import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageUploadZoneProps {
    images: File[];
    onImagesChange: (files: File[]) => void;
}

export default function ImageUploadZone({ images, onImagesChange }: ImageUploadZoneProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        // Limit to 5 images total
        const newImages = [...images, ...acceptedFiles].slice(0, 5);
        onImagesChange(newImages);
    }, [images, onImagesChange]);

    const removeImage = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        },
        maxSize: 5242880 // 5MB
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Images (Optional)</label>
                <span className="text-xs text-gray-500">{images.length}/5 selected</span>
            </div>

            <div
                {...getRootProps()}
                className={`
                    relative border-2 border-dashed rounded-xl p-8 transition-colors cursor-pointer group text-center
                    ${isDragActive
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-white" />
                    </div>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300">
                        Drag & drop images here, or <span className="text-purple-400">click to select</span>
                    </p>
                    <p className="text-xs text-gray-600">
                        Max 5 images. AI will place these intelligently.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
                <AnimatePresence>
                    {images.map((file, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group"
                        >
                            <img
                                src={URL.createObjectURL(file)}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                            >
                                <X className="w-3 h-3" />
                            </button>
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-1">
                                <p className="text-[10px] text-center text-white truncate px-1">Img {index + 1}</p>
                            </div>
                        </motion.div>
                    ))}
                    {/* Placeholder slots to keep grid structure */}
                    {Array.from({ length: Math.max(0, 5 - images.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square rounded-lg border border-white/5 bg-white/5 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-white/10" />
                        </div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
