/**
 * Smart Video Compressor
 * Uses browser's native APIs to compress videos client-side
 */

export interface CompressionProgress {
    stage: 'loading' | 'analyzing' | 'compressing' | 'finalizing' | 'complete' | 'error';
    progress: number; // 0-100
    message: string;
    estimatedTimeRemaining?: number; // seconds
}

export interface CompressionResult {
    success: boolean;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    file: File | null;
    error?: string;
}

export interface CompressionOptions {
    targetSizeMB?: number;
    maxWidth?: number;
    maxHeight?: number;
    videoBitrate?: number; // kbps
    audioBitrate?: number; // kbps
    onProgress?: (progress: CompressionProgress) => void;
}

const DEFAULT_OPTIONS: Required<Omit<CompressionOptions, 'onProgress'>> = {
    targetSizeMB: 45, // Target 45MB to have buffer under 50MB limit
    maxWidth: 1280,
    maxHeight: 720,
    videoBitrate: 2500, // 2.5 Mbps - good quality for social media
    audioBitrate: 128,
};

/**
 * Estimates the optimal bitrate to achieve target file size
 */
function calculateOptimalBitrate(
    durationSeconds: number,
    targetSizeMB: number,
    audioBitrate: number
): number {
    // Target size in bits
    const targetBits = targetSizeMB * 8 * 1024 * 1024;
    // Audio bits
    const audioBits = audioBitrate * 1000 * durationSeconds;
    // Available for video
    const videoBits = targetBits - audioBits;
    // Video bitrate in kbps
    const videoBitrate = Math.floor(videoBits / durationSeconds / 1000);

    // Clamp between reasonable values
    return Math.max(500, Math.min(videoBitrate, 8000));
}

/**
 * Loads video metadata
 */
function loadVideo(file: File): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;

        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadedmetadata = () => {
            video.onloadedmetadata = null;
            resolve(video);
        };

        video.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load video'));
        };

        video.load();
    });
}

/**
 * Calculates target dimensions maintaining aspect ratio
 */
function calculateDimensions(
    videoWidth: number,
    videoHeight: number,
    maxWidth: number,
    maxHeight: number
): { width: number; height: number } {
    let width = videoWidth;
    let height = videoHeight;

    // Scale down if needed
    if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
    }

    if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
    }

    // Ensure even dimensions (required for video encoding)
    width = Math.floor(width / 2) * 2;
    height = Math.floor(height / 2) * 2;

    return { width, height };
}

/**
 * Compresses a video file using Canvas and MediaRecorder
 */
export async function compressVideo(
    file: File,
    options: CompressionOptions = {}
): Promise<CompressionResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const onProgress = options.onProgress || (() => { });

    const originalSize = file.size;
    const originalSizeMB = originalSize / (1024 * 1024);

    // If already under target, skip compression
    if (originalSizeMB <= opts.targetSizeMB) {
        onProgress({
            stage: 'complete',
            progress: 100,
            message: 'Video is already under the size limit'
        });
        return {
            success: true,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 1,
            file
        };
    }

    try {
        // Stage 1: Loading
        onProgress({
            stage: 'loading',
            progress: 5,
            message: 'Loading video...'
        });

        const video = await loadVideo(file);
        const duration = video.duration;

        // Stage 2: Analyzing
        onProgress({
            stage: 'analyzing',
            progress: 10,
            message: 'Analyzing video properties...'
        });

        // Calculate optimal settings
        const { width, height } = calculateDimensions(
            video.videoWidth,
            video.videoHeight,
            opts.maxWidth,
            opts.maxHeight
        );

        const optimalBitrate = calculateOptimalBitrate(
            duration,
            opts.targetSizeMB,
            opts.audioBitrate
        );

        // Create canvas for rendering
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // Create audio context for audio processing
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(video);
        const destination = audioCtx.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioCtx.destination); // Also connect to speakers for monitoring (muted)

        // Create MediaRecorder with canvas stream + audio
        const canvasStream = canvas.captureStream(30); // 30fps
        const audioTrack = destination.stream.getAudioTracks()[0];
        if (audioTrack) {
            canvasStream.addTrack(audioTrack);
        }

        // Determine supported MIME type
        const mimeTypes = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];

        let selectedMime = mimeTypes.find(mime => MediaRecorder.isTypeSupported(mime)) || 'video/webm';

        const recorder = new MediaRecorder(canvasStream, {
            mimeType: selectedMime,
            videoBitsPerSecond: optimalBitrate * 1000
        });

        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        // Stage 3: Compressing
        onProgress({
            stage: 'compressing',
            progress: 15,
            message: `Compressing video (0%)...`,
            estimatedTimeRemaining: Math.ceil(duration)
        });

        return new Promise((resolve) => {
            recorder.onstop = async () => {
                // Stage 4: Finalizing
                onProgress({
                    stage: 'finalizing',
                    progress: 95,
                    message: 'Finalizing compressed video...'
                });

                // Clean up
                URL.revokeObjectURL(video.src);
                audioCtx.close();

                // Create final file
                const blob = new Blob(chunks, { type: selectedMime });
                const extension = selectedMime.includes('mp4') ? 'mp4' : 'webm';
                const compressedFile = new File(
                    [blob],
                    file.name.replace(/\.[^.]+$/, `_compressed.${extension}`),
                    { type: selectedMime }
                );

                const compressedSize = compressedFile.size;
                const compressionRatio = originalSize / compressedSize;

                onProgress({
                    stage: 'complete',
                    progress: 100,
                    message: `Compressed from ${originalSizeMB.toFixed(1)}MB to ${(compressedSize / (1024 * 1024)).toFixed(1)}MB`
                });

                resolve({
                    success: true,
                    originalSize,
                    compressedSize,
                    compressionRatio,
                    file: compressedFile
                });
            };

            recorder.start(1000); // Collect data every second

            // Play and render video
            video.currentTime = 0;
            video.play();

            const startTime = Date.now();

            const renderFrame = () => {
                if (video.ended || video.paused) {
                    recorder.stop();
                    return;
                }

                // Draw current frame to canvas
                ctx.drawImage(video, 0, 0, width, height);

                // Update progress
                const elapsed = (Date.now() - startTime) / 1000;
                const videoProgress = video.currentTime / duration;
                const percentComplete = Math.min(95, 15 + (videoProgress * 80));
                const remaining = Math.max(0, (duration - video.currentTime));

                onProgress({
                    stage: 'compressing',
                    progress: Math.round(percentComplete),
                    message: `Compressing video (${Math.round(videoProgress * 100)}%)...`,
                    estimatedTimeRemaining: Math.ceil(remaining)
                });

                requestAnimationFrame(renderFrame);
            };

            video.onended = () => {
                recorder.stop();
            };

            renderFrame();
        });

    } catch (error: any) {
        onProgress({
            stage: 'error',
            progress: 0,
            message: error.message || 'Compression failed'
        });

        return {
            success: false,
            originalSize,
            compressedSize: 0,
            compressionRatio: 0,
            file: null,
            error: error.message
        };
    }
}

/**
 * Quick check if a video needs compression
 */
export function needsCompression(file: File, maxSizeMB: number = 50): boolean {
    return file.size > maxSizeMB * 1024 * 1024;
}

/**
 * Format bytes to human readable string
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}
