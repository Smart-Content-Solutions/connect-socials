/**
 * Draft System Types
 * 
 * Type definitions for the post draft system that prevents data loss
 * when users navigate away from post creation tools.
 */

// =============================================================================
// Tool Type Identifiers
// =============================================================================

export type ToolType =
  | 'social-automation'
  | 'wordpress-create'
  | 'ai-editor';

// =============================================================================
// Draft Data Interfaces (Tool-Specific)
// =============================================================================

/**
 * Draft data for Social Automation App
 */
export interface SocialAutomationDraft {
  caption: string;
  selectedPlatforms: string[];
  aiEnhance: boolean;
  postMode: 'publish' | 'schedule';
  scheduledTime: string;
  tone: string;
  customTone: string;
  // Image data as base64 strings (limited to avoid size issues)
  imagePreviews: string[];
  // Video is not stored in draft due to size - flag to warn user
  hadVideos: boolean;
  // Account selections
  selectedFacebookPageIds: string[];
  selectedInstagramPageIds: string[];
  selectedTikTokAccountIds: string[];
  selectedYouTubeChannelIds: string[];
  // Instagram specific
  instagramPostType: 'reel' | 'feed' | 'story';
  postToBothFeedAndStory: boolean;
}

/**
 * Draft data for WordPress Create Post
 */
export interface WordPressCreateDraft {
  selectedSiteIds: string[];
  topic: string;
  sections: number;
  keywords: string;
  location: string;
  occupation: string;
  audience: string;
  tone: string;
  customTone: string;
  // Image data as base64 string (limited to avoid size issues)
  imagePreview: string | null;
}

/**
 * Draft data for AI Agent Editor
 */
export interface AIEditorDraft {
  selectedSiteId: string;
  selectedPostId: number | null;
  userInstruction: string;
  // Image data as base64 strings (limited to avoid size issues)
  imagePreviews: string[];
}

// =============================================================================
// Database Types
// =============================================================================

/**
 * Raw database row for post_drafts table
 */
export interface PostDraftRow {
  id: string;
  user_id: string;
  tool_type: ToolType;
  draft_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Payload for creating/updating a draft
 */
export interface DraftPayload {
  user_id: string;
  tool_type: ToolType;
  draft_data: Record<string, any>;
}

// =============================================================================
// Hook Types
// =============================================================================

/**
 * Options for usePostDraft hook
 */
export interface UsePostDraftOptions {
  /** Unique identifier for the tool */
  toolType: ToolType;
  /** Function to get current form data as draft object */
  getDraftData: () => Record<string, any>;
  /** Function to restore form from draft data */
  setDraftData: (data: Record<string, any>) => void;
  /** Function to check if form has unsaved changes */
  hasChanges: () => boolean;
  /** Initial form state for comparison (optional) */
  initialState?: Record<string, any>;
}

/**
 * Return type for usePostDraft hook
 */
export interface UsePostDraftReturn {
  /** Save current form state as draft */
  saveDraft: () => Promise<boolean>;
  /** Load draft from database */
  loadDraft: () => Promise<Record<string, any> | null>;
  /** Delete draft from database */
  deleteDraft: () => Promise<boolean>;
  /** Check if draft exists in database */
  checkForDraft: () => Promise<boolean>;
  /** Whether a draft exists in the database */
  draftExists: boolean;
  /** Whether the hook is currently loading */
  isLoading: boolean;
  /** Whether the hook has completed initial load */
  isLoaded: boolean;
  /** Timestamp of the draft (if exists) */
  draftTimestamp: Date | null;
  /** Any error that occurred */
  error: string | null;
  /** Whether a save operation is in progress */
  isSaving: boolean;
}

/**
 * Options for useUnsavedChangesWarning hook
 */
export interface UseUnsavedChangesWarningOptions {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Callback when user confirms they want to leave */
  onConfirmLeave: () => void;
  /** Callback when user chooses to save draft */
  onSaveDraft: () => Promise<boolean>;
  /** Whether to show the confirmation dialog */
  showDialog: boolean;
  /** Callback to control dialog visibility */
  setShowDialog: (show: boolean) => void;
}

/**
 * Return type for useUnsavedChangesWarning hook
 */
export interface UseUnsavedChangesWarningReturn {
  /** Whether the confirmation dialog is open */
  isDialogOpen: boolean;
  /** Open the confirmation dialog */
  openDialog: () => void;
  /** Close the confirmation dialog */
  closeDialog: () => void;
  /** Handle user choosing to leave */
  handleLeave: () => void;
  /** Handle user choosing to stay */
  handleStay: () => void;
  /** Handle user choosing to save draft */
  handleSaveDraft: () => Promise<void>;
  /** Whether draft is currently being saved */
  isSaving: boolean;
  /** Navigation target (if internal navigation) */
  navigationTarget: string | null;
  /** Clear the navigation target */
  clearNavigationTarget: () => void;
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Props for LeaveConfirmationDialog component
 */
export interface LeaveConfirmationDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to control dialog open state */
  onOpenChange: (open: boolean) => void;
  /** Callback when user confirms leave */
  onLeave: () => void;
  /** Callback when user chooses to stay */
  onStay: () => void;
  /** Callback when user chooses to save draft */
  onSaveDraft: () => Promise<void>;
  /** Whether draft is currently being saved */
  isSaving?: boolean;
}

/**
 * Props for DraftRestoreDialog component
 */
export interface DraftRestoreDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to control dialog open state */
  onOpenChange: (open: boolean) => void;
  /** Callback when user chooses to continue with draft */
  onContinue: () => void;
  /** Callback when user chooses to start fresh */
  onStartFresh: () => void;
  /** Timestamp of when the draft was last saved */
  draftTimestamp?: Date | null;
  /** Whether the draft is currently being loaded */
  isLoading?: boolean;
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Result of a draft operation
 */
export interface DraftOperationResult {
  success: boolean;
  error?: string;
  data?: Record<string, any>;
}

/**
 * Configuration for draft size limits
 */
export interface DraftSizeConfig {
  /** Maximum size for base64 image data (in characters) */
  maxImageSizeChars: number;
  /** Maximum number of images to store */
  maxImages: number;
  /** Maximum total draft size (in characters) */
  maxTotalSizeChars: number;
}

/**
 * Default draft size configuration
 */
export const DEFAULT_DRAFT_SIZE_CONFIG: DraftSizeConfig = {
  maxImageSizeChars: 500000, // ~500KB per image
  maxImages: 5,
  maxTotalSizeChars: 2000000, // ~2MB total
};
