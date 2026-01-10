import heic2any from 'heic2any';

/**
 * Compresses and resizes an image file to ensure efficient upload.
 * - Max width/height: 1920px
 * - Quality: 0.8
 * - Format: JPEG (for optimal compression)
 * - Returns original file if it's already small or compression fails
 */
export async function compressImage(file: File): Promise<File> {
    // Check if it's a HEIC/HEIF file
    const isHeic = file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif') ||
        file.type === 'image/heic' ||
        file.type === 'image/heif';

    let fileToProcess = file;

    // Convert HEIC to JPEG first if needed
    if (isHeic) {
        try {
            console.log('Detected HEIC file, converting to JPEG...');
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            });

            // heic2any can return a single blob or an array. We expect single for a single file.
            const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            fileToProcess = new File(
                [blob],
                file.name.replace(/\.(heic|heif)$/i, '.jpg'),
                { type: 'image/jpeg' }
            );
            console.log('HEIC conversion successful.');
        } catch (error) {
            console.error('HEIC conversion failed:', error);
            // If conversion fails, we might still try to upload original, but it will likely fail.
            // Return original to let backend handle/reject it.
            return file;
        }
    }

    // If file is already small (< 500KB) AND wasn't a HEIC file (HEIC needs conversion regardless of size for compatibility),
    // return original. 
    // Note: If we just converted HEIC, we still want to resize it if it's huge, so we proceed.
    // But if it was already a small JPEG/PNG, we skip.
    if (!isHeic && fileToProcess.size < 500 * 1024) {
        return fileToProcess;
    }

    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(fileToProcess);

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
                    resolve(fileToProcess); // Fail gracefully
                    return;
                }

                // Draw white background for transparency handling (files becoming JPEGs)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);

                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG at 80% quality
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(fileToProcess); // Fail gracefully
                        return;
                    }

                    // Create new file with .jpg extension (ensure validation)
                    const originalName = file.name; // Use original name for base
                    const nameWithoutExt = originalName.lastIndexOf('.') !== -1
                        ? originalName.substring(0, originalName.lastIndexOf('.'))
                        : originalName;

                    const newName = nameWithoutExt + ".jpg";

                    const newFile = new File([blob], newName, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    });

                    // Only use compressed if it's actually smaller (or if we converted from HEIC, we prefer the JPEG version)
                    if (isHeic || newFile.size < fileToProcess.size) {
                        console.log(`Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(newFile.size / 1024 / 1024).toFixed(2)}MB`);
                        resolve(newFile);
                    } else {
                        resolve(fileToProcess);
                    }
                }, 'image/jpeg', 0.8);
            };

            img.onerror = () => resolve(fileToProcess); // Fail gracefully
        };

        reader.onerror = () => resolve(fileToProcess); // Fail gracefully
    });
}
