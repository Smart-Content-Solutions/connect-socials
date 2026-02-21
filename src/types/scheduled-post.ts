export type ScheduledPostStatus = "scheduled" | "processing" | "posted" | "failed" | "cancelled";

export interface ScheduledPost {
  id: string;
  user_id: string;
  user_email: string | null;
  caption: string | null;
  platforms: string[];
  media_url: string | null;
  scheduled_time: string;
  user_timezone: string | null;
  post_type: "image" | "video";
  status: ScheduledPostStatus;
  payload: {
    caption?: string;
    media_urls?: string[];
    ai_enhance?: boolean;
    tone?: string;
    image_post_types?: { feed: boolean; story: boolean };
    video_post_types?: {
      instagram: { feed: boolean; reel: boolean; story: boolean };
      facebook: { feed: boolean; reel: boolean; story: boolean };
    };
    facebook_page_ids?: string[];
    instagram_page_ids?: string[];
    tiktok_account_ids?: string[];
    youtube_channel_ids?: string[];
  };
  result_metadata: {
    posted_at?: string;
    platform_post_ids?: Record<string, string>;
    error_summary?: string;
  };
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  posted_at: string | null;
  cancelled_at: string | null;
}
