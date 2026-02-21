import React, { useState } from "react";
import { toast } from "sonner";
import {
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Image as ImageIcon,
  Video,
  ChevronDown,
  ChevronUp,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  CalendarClock,
  Youtube,
  Music,
  Ban,
} from "lucide-react";
import type { ScheduledPost, ScheduledPostStatus } from "@/types/scheduled-post";

interface ScheduledPostsTrackerProps {
  pending: ScheduledPost[];
  history: ScheduledPost[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onCancel: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  onReschedule: (id: string, newTime: string) => Promise<void>;
}

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-3.5 h-3.5" />,
  instagram: <Instagram className="w-3.5 h-3.5" />,
  twitter: <Twitter className="w-3.5 h-3.5" />,
  x: <Twitter className="w-3.5 h-3.5" />,
  linkedin: <Linkedin className="w-3.5 h-3.5" />,
  youtube: <Youtube className="w-3.5 h-3.5" />,
  tiktok: <Music className="w-3.5 h-3.5" />,
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-500/20 text-blue-400",
  instagram: "bg-pink-500/20 text-pink-400",
  twitter: "bg-sky-500/20 text-sky-400",
  x: "bg-sky-500/20 text-sky-400",
  linkedin: "bg-blue-600/20 text-blue-300",
  youtube: "bg-red-500/20 text-red-400",
  tiktok: "bg-violet-500/20 text-violet-400",
  bluesky: "bg-cyan-500/20 text-cyan-400",
  pinterest: "bg-red-600/20 text-red-300",
};

const STATUS_CONFIG: Record<ScheduledPostStatus, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled: { label: "Scheduled", color: "bg-[#E1C37A]/20 text-[#E1C37A]", icon: <Clock className="w-3 h-3" /> },
  processing: { label: "Processing", color: "bg-blue-500/20 text-blue-400", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  posted: { label: "Posted", color: "bg-green-500/20 text-green-400", icon: <CheckCircle className="w-3 h-3" /> },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400", icon: <AlertTriangle className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", color: "bg-zinc-500/20 text-zinc-400", icon: <Ban className="w-3 h-3" /> },
};

function formatScheduledTime(isoString: string, timezone?: string | null): string {
  try {
    const date = new Date(isoString);
    const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
      timeZoneName: "short",
    });
  } catch {
    return new Date(isoString).toLocaleString();
  }
}

function timeUntil(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now();
  if (diff < 0) return "overdue";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `in ${hours}h ${mins % 60}m`;
  const days = Math.floor(hours / 24);
  return `in ${days}d ${hours % 24}h`;
}

function truncateCaption(caption: string | null, maxLen = 80): string {
  if (!caption) return "No caption";
  return caption.length > maxLen ? caption.slice(0, maxLen) + "…" : caption;
}

function StatusBadge({ status }: { status: ScheduledPostStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.scheduled;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function PlatformChips({ platforms }: { platforms: string[] }) {
  if (!platforms || platforms.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {platforms.map((p) => (
        <span
          key={p}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${PLATFORM_COLORS[p.toLowerCase()] || "bg-zinc-500/20 text-zinc-400"}`}
        >
          {PLATFORM_ICONS[p.toLowerCase()] || null}
          {p}
        </span>
      ))}
    </div>
  );
}

function PostCard({
  post,
  onCancel,
  onRetry,
  onReschedule,
  showActions,
}: {
  post: ScheduledPost;
  onCancel?: (id: string) => Promise<void>;
  onRetry?: (id: string) => Promise<void>;
  onReschedule?: (id: string, newTime: string) => Promise<void>;
  showActions: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);

  const handleAction = async (action: string, fn?: (id: string) => Promise<void>) => {
    if (!fn) return;
    try {
      setActionLoading(action);
      await fn(post.id);
      toast.success(`Post ${action}led successfully`);
    } catch (err: any) {
      toast.error(err.message || `Failed to ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleTime || !onReschedule) return;
    try {
      setActionLoading("reschedule");
      await onReschedule(post.id, rescheduleTime);
      toast.success("Post rescheduled");
      setShowReschedule(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to reschedule");
    } finally {
      setActionLoading(null);
    }
  };

  const isPending = post.status === "scheduled" || post.status === "processing";

  return (
    <div className="p-4 rounded-xl bg-[#2C2C2E] border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={post.status} />
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${post.post_type === "video" ? "bg-purple-500/20 text-purple-400" : "bg-indigo-500/20 text-indigo-400"}`}>
              {post.post_type === "video" ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
              {post.post_type === "video" ? "Video" : "Image"}
            </span>
            {isPending && (
              <span className="text-[10px] text-[#A9AAAC]">{timeUntil(post.scheduled_time)}</span>
            )}
          </div>

          <p className="text-sm text-[#D6D7D8] mb-2 leading-relaxed">
            {truncateCaption(post.caption)}
          </p>

          <div className="flex items-center gap-3 mb-2">
            <PlatformChips platforms={post.platforms || []} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#5B5C60]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatScheduledTime(post.scheduled_time, post.user_timezone)}
            </span>
            {post.created_at && (
              <span className="flex items-center gap-1">
                Created {formatScheduledTime(post.created_at, post.user_timezone)}
              </span>
            )}
            {post.posted_at && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                Posted {formatScheduledTime(post.posted_at, post.user_timezone)}
              </span>
            )}
          </div>

          {post.status === "failed" && post.failure_reason && (
            <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400">{post.failure_reason}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-white/5 text-[#5B5C60] hover:text-[#D6D7D8] transition-colors shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/5">
          {post.payload?.caption && post.payload.caption !== post.caption && (
            <div className="mb-2">
              <p className="text-[10px] text-[#5B5C60] uppercase mb-1">Full Caption</p>
              <p className="text-xs text-[#A9AAAC] whitespace-pre-wrap">{post.payload.caption}</p>
            </div>
          )}
          {post.media_url && (
            <div className="mb-2">
              <p className="text-[10px] text-[#5B5C60] uppercase mb-1">Media</p>
              <p className="text-xs text-[#A9AAAC] break-all">{post.media_url}</p>
            </div>
          )}
          {post.result_metadata?.platform_post_ids && Object.keys(post.result_metadata.platform_post_ids).length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-[#5B5C60] uppercase mb-1">Platform Post IDs</p>
              <div className="text-xs text-[#A9AAAC]">
                {Object.entries(post.result_metadata.platform_post_ids).map(([platform, pid]) => (
                  <span key={platform} className="mr-3">{platform}: {pid}</span>
                ))}
              </div>
            </div>
          )}

          {showActions && (
            <div className="flex flex-wrap gap-2 mt-3">
              {isPending && onCancel && (
                <button
                  onClick={() => handleAction("cancel", onCancel)}
                  disabled={!!actionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading === "cancel" ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                  Cancel
                </button>
              )}
              {post.status === "failed" && onRetry && (
                <button
                  onClick={() => handleAction("retry", onRetry)}
                  disabled={!!actionLoading}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#E1C37A]/10 text-[#E1C37A] border border-[#E1C37A]/20 hover:bg-[#E1C37A]/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading === "retry" ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                  Retry
                </button>
              )}
              {(isPending || post.status === "failed") && onReschedule && (
                <>
                  <button
                    onClick={() => setShowReschedule(!showReschedule)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
                  >
                    <Calendar className="w-3 h-3" />
                    Reschedule
                  </button>
                  {showReschedule && (
                    <div className="flex items-center gap-2 w-full mt-1">
                      <input
                        type="datetime-local"
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        className="flex-1 bg-[#3B3C3E]/50 border border-white/10 p-2 rounded-lg text-xs text-[#D6D7D8] focus:border-[#E1C37A]/50"
                        style={{ colorScheme: "dark" }}
                      />
                      <button
                        onClick={handleReschedule}
                        disabled={!rescheduleTime || !!actionLoading}
                        className="px-3 py-2 rounded-lg text-xs font-medium bg-[#E1C37A]/20 text-[#E1C37A] hover:bg-[#E1C37A]/30 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === "reschedule" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScheduledPostsTracker({
  pending,
  history,
  loading,
  error,
  onRefresh,
  onCancel,
  onRetry,
  onReschedule,
}: ScheduledPostsTrackerProps) {
  const [activeSection, setActiveSection] = useState<"upcoming" | "recent">("upcoming");
  const [historyLimit, setHistoryLimit] = useState(10);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-[#E1C37A] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
        <p className="text-sm text-red-400 mb-3">{error}</p>
        <button onClick={onRefresh} className="text-xs text-[#E1C37A] underline hover:no-underline">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#3B3C3E]/40 backdrop-blur-[20px] rounded-xl p-1 border border-white/5">
          <button
            onClick={() => setActiveSection("upcoming")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              activeSection === "upcoming"
                ? "bg-[#E1C37A]/20 text-[#E1C37A]"
                : "text-[#A9AAAC] hover:text-[#D6D7D8]"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Upcoming
            {pending.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#E1C37A]/20 text-[#E1C37A] text-[10px] font-bold">
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection("recent")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              activeSection === "recent"
                ? "bg-[#E1C37A]/20 text-[#E1C37A]"
                : "text-[#A9AAAC] hover:text-[#D6D7D8]"
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Recent
            {history.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 text-[10px] font-bold">
                {history.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-lg hover:bg-white/5 text-[#5B5C60] hover:text-[#D6D7D8] transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Upcoming Section */}
      {activeSection === "upcoming" && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-[#3B3C3E] mx-auto mb-3" />
              <p className="text-sm text-[#5B5C60] mb-1">No scheduled posts yet</p>
              <p className="text-xs text-[#3B3C3E]">
                Schedule a post and it will appear here
              </p>
            </div>
          ) : (
            pending.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onCancel={onCancel}
                onRetry={onRetry}
                onReschedule={onReschedule}
                showActions
              />
            ))
          )}
        </div>
      )}

      {/* Recent Section */}
      {activeSection === "recent" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-10 h-10 text-[#3B3C3E] mx-auto mb-3" />
              <p className="text-sm text-[#5B5C60] mb-1">No recent scheduled posts</p>
              <p className="text-xs text-[#3B3C3E]">
                Completed and failed scheduled posts will appear here
              </p>
            </div>
          ) : (
            <>
              {history.slice(0, historyLimit).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onRetry={onRetry}
                  onReschedule={onReschedule}
                  onCancel={onCancel}
                  showActions={post.status === "failed"}
                />
              ))}
              {history.length > historyLimit && (
                <button
                  onClick={() => setHistoryLimit((l) => l + 10)}
                  className="w-full py-2 text-center text-xs text-[#E1C37A] hover:text-[#E1C37A]/80 transition-colors"
                >
                  Show more ({history.length - historyLimit} remaining)
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
