/**
 * Draft Utility Functions
 * 
 * Utility functions for managing post drafts, including size validation,
 * data transformation, and storage helpers.
 */

import {
    DraftSizeConfig,
    DEFAULT_DRAFT_SIZE_CONFIG,
    DraftOperationResult
} from '@/types/draft';

// =============================================================================
// Size Validation Utilities
// =============================================================================

/**
 * Calculate the approximate size of a JSON object in characters
 */
export function calculateJsonSize(obj: Record<string, any>): number {
    try {
        return JSON.stringify(obj).length;
    } catch {
        return 0;
    }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if draft data exceeds size limits
 */
export function validateDraftSize(
    draftData: Record<string, any>,
    config: DraftSizeConfig = DEFAULT_DRAFT_SIZE_CONFIG
): { valid: boolean; error?: string; size: number } {
    const size = calculateJsonSize(draftData);

    if (size > config.maxTotalSizeChars) {
        return {
            valid: false,
            error: `Draft size (${formatFileSize(size)}) exceeds maximum allowed (${formatFileSize(config.maxTotalSizeChars)}). Please remove some images.`,
            size
        };
    }

    return { valid: true, size };
}

// =============================================================================
// Image Handling Utilities
// =============================================================================

/**
 * Convert a File to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Convert multiple Files to base64 strings
 */
export async function filesToBase64(files: File[]): Promise<string[]> {
    return Promise.all(files.map(fileToBase64));
}

/**
 * Convert base64 string to File object
 */
export function base64ToFile(
    base64: string,
    filename: string = 'image.png',
    mimeType: string = 'image/png'
): File {
    // Remove data URL prefix if present
    const base64Data = base64.split(',')[1] || base64;

    // Convert base64 to binary
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    return new File([blob], filename, { type: mimeType });
}

/**
 * Truncate base64 image data if it exceeds size limit
 */
export function truncateImageIfNeeded(
    base64: string,
    maxSizeChars: number = DEFAULT_DRAFT_SIZE_CONFIG.maxImageSizeChars
): { data: string; wasTruncated: boolean } {
    if (base64.length <= maxSizeChars) {
        return { data: base64, wasTruncated: false };
    }

    // For oversized images, we need to compress or skip
    // For now, we'll skip storing the image and return a flag
    console.warn(`Image exceeds size limit (${base64.length} > ${maxSizeChars}), will be skipped from draft`);
    return { data: '', wasTruncated: true };
}

/**
 * Process images for draft storage
 */
export async function processImagesForDraft(
    files: File[],
    config: DraftSizeConfig = DEFAULT_DRAFT_SIZE_CONFIG
): Promise<{ previews: string[]; hadTruncation: boolean }> {
    const previews: string[] = [];
    let hadTruncation = false;

    for (let i = 0; i < Math.min(files.length, config.maxImages); i++) {
        try {
            const base64 = await fileToBase64(files[i]);
            const { data, wasTruncated } = truncateImageIfNeeded(base64, config.maxImageSizeChars);

            if (wasTruncated) {
                hadTruncation = true;
            } else if (data) {
                previews.push(data);
            }
        } catch (error) {
            console.error('Failed to process image for draft:', error);
            hadTruncation = true;
        }
    }

    return { previews, hadTruncation };
}

// =============================================================================
// Draft Data Helpers
// =============================================================================

/**
 * Create a deep clone of draft data
 */
export function cloneDraftData(data: Record<string, any>): Record<string, any> {
    try {
        return JSON.parse(JSON.stringify(data));
    } catch {
        return { ...data };
    }
}

/**
 * Compare two draft data objects for equality
 */
export function isDraftDataEqual(
    a: Record<string, any>,
    b: Record<string, any>
): boolean {
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch {
        return false;
    }
}

/**
 * Check if draft data has meaningful content
 */
export function hasDraftContent(data: Record<string, any>): boolean {
    if (!data || typeof data !== 'object') return false;

    // Check for common content fields
    const contentFields = [
        'caption', 'topic', 'userInstruction', 'keywords',
        'selectedPlatforms', 'selectedSiteIds', 'selectedPostId'
    ];

    for (const field of contentFields) {
        const value = data[field];
        if (value) {
            if (Array.isArray(value) && value.length > 0) return true;
            if (typeof value === 'string' && value.trim().length > 0) return true;
            if (typeof value === 'number') return true;
        }
    }

    // Check for media
    if (data.imagePreviews?.length > 0) return true;
    if (data.imagePreview) return true;
    if (data.hadVideos) return true;

    return false;
}

// =============================================================================
// Date/Time Utilities
// =============================================================================

/**
 * Format a timestamp for display in the draft restore dialog
 */
export function formatDraftTimestamp(date: Date | string | null): string {
    if (!date) return 'Unknown';

    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return 'Unknown';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    // For older drafts, show the actual date
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * Handle and format draft operation errors
 */
export function handleDraftError(error: unknown): DraftOperationResult {
    console.error('Draft operation error:', error);

    let errorMessage = 'An unexpected error occurred';

    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    // Map common errors to user-friendly messages
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
    } else if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
        errorMessage = 'Permission denied. Please sign in and try again.';
    } else if (errorMessage.includes('size') || errorMessage.includes('large')) {
        errorMessage = 'Draft is too large. Please remove some images and try again.';
    }

    return {
        success: false,
        error: errorMessage
    };
}

// =============================================================================
// Storage Key Helpers (for localStorage fallback/backup)
// =============================================================================

/**
 * Generate localStorage key for draft backup
 */
export function getDraftStorageKey(userId: string, toolType: string): string {
    return `draft_backup_${userId}_${toolType}`;
}

/**
 * Save draft to localStorage as backup
 */
export function saveDraftToLocalStorage(
    userId: string,
    toolType: string,
    data: Record<string, any>
): void {
    try {
        const key = getDraftStorageKey(userId, toolType);
        const payload = {
            data,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
        console.warn('Failed to save draft to localStorage:', error);
    }
}

/**
 * Load draft from localStorage backup
 */
export function loadDraftFromLocalStorage(
    userId: string,
    toolType: string
): { data: Record<string, any>; timestamp: string } | null {
    try {
        const key = getDraftStorageKey(userId, toolType);
        const stored = localStorage.getItem(key);

        if (!stored) return null;

        return JSON.parse(stored);
    } catch (error) {
        console.warn('Failed to load draft from localStorage:', error);
        return null;
    }
}

/**
 * Clear draft from localStorage
 */
export function clearDraftFromLocalStorage(
    userId: string,
    toolType: string
): void {
    try {
        const key = getDraftStorageKey(userId, toolType);
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Failed to clear draft from localStorage:', error);
    }
}