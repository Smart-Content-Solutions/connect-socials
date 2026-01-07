
/**
 * Compresses and resizes an image file to ensure efficient upload.
 * - Max width/height: 1920px
 * - Quality: 0.8
 * - Format: JPEG (for optimal compression)
 * - Returns original file if it's already small or compression fails
 */
export async function compressImage(file: File): Promise<File> {
    // If file is already small (< 500KB), return original to avoid unnecessary processing
    if (file.size < 500 * 1024) {
        return file;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            
            img.onload = () => {
                const maxWidth = 1920;
                const maxHeight = 1920;
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file); // Fail gracefully
                    return;
                }
                
                // Draw white background for transparency handling (files becoming JPEGs)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG at 80% quality
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file); // Fail gracefully
                        return;
                    }

                    // Create new file with .jpg extension
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                    const newFile = new File([blob], newName, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    // Only use compressed if it's actually smaller
                    if (newFile.size < file.size) {
                        console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(newFile.size / 1024 / 1024).toFixed(2)}MB`);
                        resolve(newFile);
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', 0.8);
            };
            
            img.onerror = () => resolve(file); // Fail gracefully
        };
        
        reader.onerror = () => resolve(file); // Fail gracefully
    });
}
