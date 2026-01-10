import { useEffect, useState, useCallback } from "react";
import { MessageCircle, Loader2, Star, Edit2, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import type { Feedback, FeedbackCategory, FeedbackStatus, FeedbackSubmission } from "@/types/feedback";

const categoryLabels: Record<FeedbackCategory, string> = {
  General: "General",
  Bug: "Bug",
  Feature: "Feature",
  Billing: "Billing",
};

const statusLabels: Record<FeedbackStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  actioned: "Actioned",
};

const statusColors: Record<FeedbackStatus, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  reviewed: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  actioned: "bg-green-500/20 text-green-400 border-green-500/40",
};

export default function AdminFeedback() {
  const { getToken } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState<string>("");
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try API first
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required. Please sign in.");
      }

      // Build query params
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (debouncedSearchQuery.trim()) {
        params.set("q", debouncedSearchQuery.trim());
      }

      const response = await fetch(`/api/admin/feedback?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Parse response safely
      let responseData: any;
      try {
        responseData = await response.json();
      } catch (parseError) {
        const text = await response.text();
        throw new Error(`Server error: ${text || response.statusText || "Unknown error"}`);
      }

      if (!response.ok) {
        throw new Error(responseData?.error || responseData?.details || `HTTP ${response.status}`);
      }

      setFeedback(responseData.feedback || []);
    } catch (err: any) {
      console.error("Error loading feedback from API:", err);
      setError(err.message || "Failed to load feedback from API");

      // Fallback to localStorage
      try {
        const data = localStorage.getItem("scs_feedback_submissions");
        const submissions: FeedbackSubmission[] = data ? JSON.parse(data) : [];

        // Convert localStorage format to Feedback format
        const converted: Feedback[] = submissions.map((sub) => ({
          id: sub.id,
          created_at: sub.createdAt,
          rating: sub.rating,
          category: sub.category,
          message: sub.message,
          page_url: sub.pageUrl,
          user_id: sub.userId || "",
          user_email: sub.userEmail || null,
          user_name: sub.userName || null,
          status: "new" as FeedbackStatus,
          admin_notes: null,
        }));

        // Sort by date (newest first)
        converted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setFeedback(converted);
        toast.warning("Using local storage data. API connection unavailable.");
      } catch (fallbackError) {
        console.error("Error loading from localStorage:", fallbackError);
        setFeedback([]);
      }
    } finally {
      setLoading(false);
    }
  }, [getToken, debouncedSearchQuery, statusFilter]);

  // Load feedback when debounced search or status filter changes
  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const handleStatusChange = async (feedbackId: string, newStatus: FeedbackStatus) => {
    try {
      setUpdatingIds((prev) => new Set(prev).add(feedbackId));

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/admin/feedback?id=${feedbackId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      let responseData: any;
      try {
        responseData = await response.json();
      } catch (parseError) {
        const text = await response.text();
        throw new Error(`Server error: ${text || response.statusText || "Unknown error"}`);
      }

      if (!response.ok) {
        throw new Error(responseData?.error || responseData?.details || "Failed to update status");
      }

      // Optimistically update local state
      setFeedback((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, ...responseData.feedback } : f))
      );

      toast.success("Status updated successfully");
    } catch (err: any) {
      console.error("Error updating status:", err);
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(feedbackId);
        return next;
      });
    }
  };

  const handleNotesEdit = (feedback: Feedback) => {
    setEditingNotes(feedback.id);
    setNotesValue(feedback.admin_notes || "");
  };

  const handleNotesSave = async (feedbackId: string) => {
    try {
      setUpdatingIds((prev) => new Set(prev).add(feedbackId));

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(`/api/admin/feedback?id=${feedbackId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNotes: notesValue }),
      });

      let responseData: any;
      try {
        responseData = await response.json();
      } catch (parseError) {
        const text = await response.text();
        throw new Error(`Server error: ${text || response.statusText || "Unknown error"}`);
      }

      if (!response.ok) {
        throw new Error(responseData?.error || responseData?.details || "Failed to update notes");
      }

      // Optimistically update local state
      setFeedback((prev) =>
        prev.map((f) => (f.id === feedbackId ? { ...f, ...responseData.feedback } : f))
      );

      setEditingNotes(null);
      setNotesValue("");
      toast.success("Admin notes updated successfully");
    } catch (err: any) {
      console.error("Error updating notes:", err);
      toast.error(err.message || "Failed to update notes");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(feedbackId);
        return next;
      });
    }
  };

  const handleNotesCancel = () => {
    setEditingNotes(null);
    setNotesValue("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  // Filter feedback client-side only if using localStorage fallback
  // API handles filtering server-side
  const displayFeedback = feedback;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Feedback</h1>
        </div>
        <p className="text-muted-foreground">
          View and manage user feedback submissions.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search feedback by message, category, user, or page URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-background"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | "all")}
            className="px-3 py-2 rounded-md border border-border/60 bg-background text-sm"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="actioned">Actioned</option>
          </select>
        </div>
      </div>

      {error && !feedback.length && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading feedback...
        </div>
      )}

      {!loading && (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          {displayFeedback.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No feedback matches your search criteria."
                  : "User feedback will appear here once users start submitting feedback."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left p-3">Date</th>
                  <th className="text-left p-3">Rating</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Message</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Page URL</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayFeedback.map((item) => {
                  const isUpdating = updatingIds.has(item.id);
                  const isEditingNotes = editingNotes === item.id;
                  return (
                    <tr
                      key={item.id}
                      className="border-t border-border/40 hover:bg-muted/20"
                    >
                      <td className="p-3 text-muted-foreground text-xs">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Star className={`w-4 h-4 ${item.rating >= 1 ? "fill-[#E1C37A] text-[#E1C37A]" : "text-muted-foreground"}`} />
                          <span className="text-sm font-medium">{item.rating}/5</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            item.category === "Bug"
                              ? "bg-red-500/20 text-red-400"
                              : item.category === "Feature"
                              ? "bg-blue-500/20 text-blue-400"
                              : item.category === "Billing"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {categoryLabels[item.category]}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.id, e.target.value as FeedbackStatus)
                          }
                          disabled={isUpdating}
                          className={`rounded-md border px-2 py-1 text-xs font-medium ${
                            statusColors[item.status]
                          } disabled:opacity-50 disabled:cursor-not-allowed bg-background`}
                        >
                          <option value="new">New</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="actioned">Actioned</option>
                        </select>
                        {isUpdating && (
                          <Loader2 className="w-3 h-3 ml-2 inline animate-spin text-muted-foreground" />
                        )}
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="text-sm">{truncateMessage(item.message, 100)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          {item.user_name || item.user_email || "—"}
                        </div>
                        {item.user_email && item.user_name && (
                          <div className="text-xs text-muted-foreground">
                            {item.user_email}
                          </div>
                        )}
                      </td>
                      <td className="p-3 max-w-xs">
                        <div className="text-xs text-muted-foreground truncate">
                          {item.page_url || "—"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-2">
                          {!isEditingNotes ? (
                            <button
                              onClick={() => handleNotesEdit(item)}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              title="Edit admin notes"
                            >
                              <Edit2 className="w-3 h-3" />
                              Notes
                            </button>
                          ) : (
                            <div className="space-y-2">
                              <Textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                placeholder="Admin notes..."
                                rows={3}
                                className="text-xs bg-background"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleNotesSave(item.id)}
                                  disabled={isUpdating}
                                  className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                  title="Save notes"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={handleNotesCancel}
                                  disabled={isUpdating}
                                  className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                          {item.admin_notes && !isEditingNotes && (
                            <div className="text-xs text-muted-foreground max-w-xs truncate" title={item.admin_notes}>
                              {item.admin_notes}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
