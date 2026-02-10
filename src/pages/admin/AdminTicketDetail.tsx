import { useEffect, useState } from "react";
import { Ticket, ArrowLeft, Send, Calendar, User, Shield, Mail, Package, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import type { Ticket as TicketType, TicketComment, TicketStatus } from "@/types/tickets";
import { toast } from "sonner";

interface StaffMember {
  userId: string;
  email: string | null;
  name: string | null;
  role: string;
}

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_on_customer: "Waiting on Customer",
  resolved: "Resolved",
  closed: "Closed",
};

const typeLabels: Record<string, string> = {
  support: "Support",
  bug: "Bug",
  feature: "Feature",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-500/20 text-gray-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  urgent: "bg-red-500/20 text-red-400",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  waiting_on_customer: "bg-purple-500/20 text-purple-400",
  resolved: "bg-green-500/20 text-green-400",
  closed: "bg-gray-500/20 text-gray-400",
};

export default function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [updatingAssignment, setUpdatingAssignment] = useState(false);

  useEffect(() => {
    async function fetchTicketAndComments() {
      if (!id) {
        setError("Invalid ticket ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = await getToken();
        if (!token) {
          setError("Authentication required. Please sign in.");
          setLoading(false);
          return;
        }

        // Fetch ticket with comments (admin endpoint returns both)
        const response = await fetch(`/api/admin/tickets?id=${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 404) {
            setError("Ticket not found");
          } else {
            throw new Error(data.error || "Failed to fetch ticket");
          }
          setLoading(false);
          return;
        }

        setTicket(data.ticket);
        setComments(data.comments || []);
      } catch (err: any) {
        setError(err.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }

    async function fetchStaff() {
      try {
        setLoadingStaff(true);
        const token = await getToken();
        if (!token) return;

        const response = await fetch("/api/admin/staff", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Failed to fetch staff:", data.error);
          return;
        }

        setStaff(data.staff || []);
      } catch (err: any) {
        console.error("Error fetching staff:", err);
      } finally {
        setLoadingStaff(false);
      }
    }

    fetchTicketAndComments();
    fetchStaff();
  }, [id, getToken]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !commentBody.trim()) {
      return;
    }

    try {
      setSubmittingComment(true);

      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`/api/admin/tickets/comments?ticketId=${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: commentBody.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to post comment");
      }

      // Add new comment to list, clear form, and refresh ticket (status might have changed)
      setComments((prev) => [...prev, data.comment]);
      setCommentBody("");
      
      // Refresh ticket to get updated status
      const ticketResponse = await fetch(`/api/admin/tickets?id=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const ticketData = await ticketResponse.json();
      if (ticketResponse.ok && ticketData.ticket) {
        setTicket(ticketData.ticket);
      }

      toast.success("Comment posted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!id || !ticket) return;

    try {
      setUpdatingStatus(true);

      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`/api/admin/tickets?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setTicket(data.ticket);
      toast.success("Status updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignmentChange = async (selectedUserId: string | null) => {
    if (!id || !ticket) return;

    try {
      setUpdatingAssignment(true);

      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      // Find selected staff member
      let assignedToEmail: string | null = null;
      let assignedToName: string | null = null;

      if (selectedUserId && selectedUserId !== "") {
        const selectedStaff = staff.find((s) => s.userId === selectedUserId);
        if (selectedStaff) {
          assignedToEmail = selectedStaff.email;
          assignedToName = selectedStaff.name;
        } else {
          toast.error("Selected staff member not found");
          return;
        }
      }

      const response = await fetch(`/api/admin/tickets?id=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedToUserId: selectedUserId || null,
          assignedToEmail: assignedToEmail || null,
          assignedToName: assignedToName || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update assignment");
      }

      setTicket(data.ticket);
      toast.success(
        selectedUserId
          ? "Ticket assigned successfully"
          : "Ticket unassigned successfully"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update assignment");
    } finally {
      setUpdatingAssignment(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-border/60 p-12 text-center">
          <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">Ticket Not Found</h3>
          <p className="text-muted-foreground mb-6">{error || "The ticket you're looking for doesn't exist."}</p>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/tickets")}
            className="border-border/60"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/tickets")}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <Ticket className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
        </div>
      </div>

      {/* Ticket Info Card */}
      <div className="rounded-xl border border-border/60 overflow-hidden mb-6">
        <div className="bg-muted/30 p-4 border-b border-border/60">
          <h2 className="font-semibold">Ticket Information</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <div className="mt-1">
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                  disabled={updatingStatus}
                  className={`rounded-md border border-border/60 bg-background px-3 py-2 text-sm font-medium ${
                    statusColors[ticket.status] || statusColors.open
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_on_customer">Waiting on Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                {updatingStatus && (
                  <div className="w-4 h-4 ml-2 inline border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Priority</label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${priorityColors[ticket.priority] || priorityColors.medium}`}>
                  {priorityLabels[ticket.priority]}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Type</label>
              <div className="mt-1 text-sm">{typeLabels[ticket.type] || ticket.type}</div>
            </div>

            {ticket.module && (
              <div>
                <label className="text-sm text-muted-foreground">Module</label>
                <div className="mt-1 text-sm capitalize">{ticket.module}</div>
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground">Created By</label>
              <div className="mt-1 flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{ticket.created_by_name || "Unknown"}</span>
              </div>
              {ticket.created_by_email && (
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  {ticket.created_by_email}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Created At</label>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {new Date(ticket.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Description</label>
            <div className="mt-2 p-4 rounded-md bg-muted/20 border border-border/40">
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Section */}
      <div className="rounded-xl border border-border/60 overflow-hidden mb-6">
        <div className="bg-muted/30 p-4 border-b border-border/60 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Assignment</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Assign To</label>
              {loadingStaff ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  Loading staff...
                </div>
              ) : (
                <select
                  value={ticket.assigned_to_user_id || ""}
                  onChange={(e) => handleAssignmentChange(e.target.value || null)}
                  disabled={updatingAssignment}
                  className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Unassigned</option>
                  {staff.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.name || member.email || member.userId} {member.role === "admin" ? "(Admin)" : "(Staff)"}
                    </option>
                  ))}
                </select>
              )}
              {updatingAssignment && (
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  Updating assignment...
                </div>
              )}
            </div>

            {ticket.assigned_to_user_id && (
              <div className="p-3 rounded-md bg-muted/20 border border-border/40">
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-medium">
                      {ticket.assigned_to_name || "Unknown"}
                    </div>
                    {ticket.assigned_to_email && (
                      <div className="text-xs text-muted-foreground">{ticket.assigned_to_email}</div>
                    )}
                    {ticket.assigned_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Assigned {new Date(ticket.assigned_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="bg-muted/30 p-4 border-b border-border/60">
          <h2 className="font-semibold">Conversation</h2>
        </div>
        <div className="p-6">
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No comments yet.</p>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-lg border ${
                    comment.author_role === "admin"
                      ? "bg-primary/5 border-primary/20 ml-8"
                      : "bg-background border-border/40 mr-8"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {comment.author_role === "admin" ? (
                      <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {comment.author_role === "admin" ? "Admin" : "Customer"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Admin Reply Form */}
          <form onSubmit={handleSubmitComment} className="pt-4 border-t border-border/60">
            <Textarea
              placeholder="Type your reply as admin..."
              rows={4}
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              required
              className="bg-background border-border/60 mb-4"
            />
            <Button
              type="submit"
              disabled={submittingComment || !commentBody.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {submittingComment ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
