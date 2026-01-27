import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Film, Zap, FileVideo } from 'lucide-react';
import { compressVideo, CompressionProgress, CompressionResult, formatFileSize } from '../../utils/videoCompressor';

interface VideoCompressionModalProps {
    isOpen: boolean;
    onClose: () => void;
    file: File;
    onCompressionComplete: (compressedFile: File) => void;
    maxSizeMB?: number;
}

const VideoCompressionModal: React.FC<VideoCompressionModalProps> = ({
    isOpen,
    onClose,
    file,
    onCompressionComplete,
    maxSizeMB = 50
}) => {
    const [progress, setProgress] = useState<CompressionProgress>({
        stage: 'loading',
        progress: 0,
        message: 'Preparing...'
    });
    const [result, setResult] = useState<CompressionResult | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);

    useEffect(() => {
        if (isOpen && file && !isCompressing && !result) {
            startCompression();
        }
    }, [isOpen, file]);

    const startCompression = async () => {
        setIsCompressing(true);
        setResult(null);

        const compressionResult = await compressVideo(file, {
            targetSizeMB: maxSizeMB - 5, // Target 45MB to have buffer
            maxWidth: 1280,
            maxHeight: 720,
            onProgress: setProgress
        });

        setResult(compressionResult);
        setIsCompressing(false);
    };

    const handleUseCompressed = () => {
        if (result?.success && result.file) {
            onCompressionComplete(result.file);
            onClose();
        }
    };

    const handleCancel = () => {
        // In a real implementation, we'd cancel the compression
        onClose();
    };

    if (!isOpen) return null;

    const originalSize = formatFileSize(file.size);
    const compressedSize = result?.compressedSize ? formatFileSize(result.compressedSize) : '—';
    const savings = result?.compressionRatio
        ? Math.round((1 - 1 / result.compressionRatio) * 100)
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1A1B1E] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-[#2A2B2E]">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E1C37A]/20 to-[#E1C37A]/5 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-[#E1C37A]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Smart Compression</h3>
                            <p className="text-sm text-[#8B8C8F]">Optimizing for upload</p>
                        </div>
                    </div>
                    {!isCompressing && (
                        <button
                            onClick={handleCancel}
                            className="p-2 rounded-lg hover:bg-[#2A2B2E] transition-colors"
                        >
                            <X className="w-5 h-5 text-[#8B8C8F]" />
                        </button>
                    )}
                </div>

                {/* File Info */}
                <div className="bg-[#0D0E10] rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-[#2A2B2E] flex items-center justify-center flex-shrink-0">
                            <FileVideo className="w-6 h-6 text-[#E1C37A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{file.name}</p>
                            <p className="text-sm text-[#8B8C8F]">Original: {originalSize}</p>
                        </div>
                    </div>
                </div>

                {/* Progress Section */}
                {isCompressing && (
                    <div className="mb-6">
                        {/* Progress Bar */}
                        <div className="relative h-3 bg-[#2A2B2E] rounded-full overflow-hidden mb-3">
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#E1C37A] to-[#F0D68A] rounded-full transition-all duration-300"
                                style={{ width: `${progress.progress}%` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-[#E1C37A] animate-spin" />
                                <span className="text-sm text-[#8B8C8F]">{progress.message}</span>
                            </div>
                            <span className="text-sm font-medium text-[#E1C37A]">{progress.progress}%</span>
                        </div>

                        {/* ETA */}
                        {progress.estimatedTimeRemaining !== undefined && progress.estimatedTimeRemaining > 0 && (
                            <p className="text-xs text-[#5B5C60] mt-2 text-center">
                                ~{Math.ceil(progress.estimatedTimeRemaining)}s remaining
                            </p>
                        )}
                    </div>
                )}

                {/* Result Section */}
                {result && (
                    <div className="mb-6">
                        {result.success ? (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span className="text-green-400 font-medium">Compression Complete!</span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-[#0D0E10] rounded-lg p-3">
                                        <p className="text-xs text-[#8B8C8F] mb-1">Original</p>
                                        <p className="text-sm font-semibold text-white">{originalSize}</p>
                                    </div>
                                    <div className="bg-[#0D0E10] rounded-lg p-3">
                                        <p className="text-xs text-[#8B8C8F] mb-1">Compressed</p>
                                        <p className="text-sm font-semibold text-[#E1C37A]">{compressedSize}</p>
                                    </div>
                                    <div className="bg-[#0D0E10] rounded-lg p-3">
                                        <p className="text-xs text-[#8B8C8F] mb-1">Saved</p>
                                        <p className="text-sm font-semibold text-green-400">{savings}%</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                    <div>
                                        <p className="text-red-400 font-medium">Compression Failed</p>
                                        <p className="text-sm text-red-400/70">{result.error}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    {isCompressing ? (
                        <button
                            onClick={handleCancel}
                            className="flex-1 py-3 px-4 rounded-xl bg-[#2A2B2E] text-white font-medium hover:bg-[#3A3B3E] transition-colors"
                        >
                            Cancel
                        </button>
                    ) : result?.success ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#2A2B2E] text-white font-medium hover:bg-[#3A3B3E] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUseCompressed}
                                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#E1C37A] to-[#F0D68A] text-[#0D0E10] font-semibold hover:opacity-90 transition-opacity"
                            >
                                Use Compressed
                            </button>
                        </>
                    ) : result ? (
                        <>
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#2A2B2E] text-white font-medium hover:bg-[#3A3B3E] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={startCompression}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#E1C37A] text-[#0D0E10] font-semibold hover:opacity-90 transition-opacity"
                            >
                                Try Again
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default VideoCompressionModal;
