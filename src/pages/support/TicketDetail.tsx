import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Ticket, ArrowLeft, Send, Loader2, Calendar, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import type { Ticket as TicketType, TicketComment } from "@/types/tickets";
import { toast } from "sonner";

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

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

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

        // Fetch ticket
        const ticketResponse = await fetch(`/api/tickets?id=${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const ticketData = await ticketResponse.json();

        if (!ticketResponse.ok) {
          if (ticketResponse.status === 404) {
            setError("Ticket not found or unauthorized");
          } else {
            throw new Error(ticketData.error || "Failed to fetch ticket");
          }
          setLoading(false);
          return;
        }

        setTicket(ticketData.ticket);

        // Fetch comments
        const commentsResponse = await fetch(`/api/tickets/comments?ticketId=${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const commentsData = await commentsResponse.json();

        if (!commentsResponse.ok) {
          console.error("Failed to fetch comments:", commentsData.error);
          // Continue even if comments fail
        } else {
          setComments(commentsData.comments || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }

    fetchTicketAndComments();
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

      const response = await fetch(`/api/tickets/comments?ticketId=${id}`, {
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

      // Add new comment to list and clear form
      setComments((prev) => [...prev, data.comment]);
      setCommentBody("");
      toast.success("Comment posted successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E1C37A]" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8 md:p-12 text-center"
          >
            <Ticket className="w-16 h-16 mx-auto mb-6 text-[#E1C37A] opacity-50" />
            <h2 className="text-2xl font-semibold mb-4">Ticket Not Found</h2>
            <p className="text-[#A9AAAC] mb-8">{error || "The ticket you're looking for doesn't exist or you don't have access to it."}</p>
            <Link to="/support">
              <Button className="btn-gold inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to My Tickets
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#E1C37A]/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#D6D7D8]/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto mb-8">
            <Link
              to="/support"
              className="inline-flex items-center gap-2 text-[#A9AAAC] hover:text-[#D6D7D8] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Tickets
            </Link>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-[#E1C37A]/10 border border-[#E1C37A]/20">
                <Ticket className="w-5 h-5 text-[#E1C37A]" />
                <span className="text-sm font-medium text-[#E1C37A]">Support Ticket</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{ticket.subject}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#A9AAAC]">
                <span className={`px-3 py-1 rounded-md font-medium ${statusColors[ticket.status] || statusColors.open}`}>
                  {statusLabels[ticket.status] || ticket.status}
                </span>
                <span className={`px-3 py-1 rounded-md font-medium ${priorityColors[ticket.priority] || priorityColors.medium}`}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(ticket.created_at).toLocaleDateString()}
                </span>
                {ticket.type && (
                  <span>{typeLabels[ticket.type] || ticket.type}</span>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card rounded-3xl p-8 md:p-12 mb-6"
          >
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-[#D6D7D8] whitespace-pre-wrap">{ticket.description}</p>
          </motion.div>

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="glass-card rounded-3xl p-8 md:p-12 mb-6"
          >
            <h2 className="text-xl font-semibold mb-6">Conversation</h2>

            {comments.length === 0 ? (
              <p className="text-[#A9AAAC] text-center py-8">No comments yet. Be the first to reply!</p>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-xl ${
                      comment.author_role === "admin"
                        ? "bg-[#E1C37A]/5 border border-[#E1C37A]/20 ml-8"
                        : "bg-[#1A1A1C] border border-[#3B3C3E] mr-8"
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-2">
                      {comment.author_role === "admin" ? (
                        <Shield className="w-5 h-5 text-[#E1C37A] flex-shrink-0 mt-0.5" />
                      ) : (
                        <User className="w-5 h-5 text-[#A9AAAC] flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[#D6D7D8]">
                            {comment.author_role === "admin" ? "Admin" : "You"}
                          </span>
                          <span className="text-xs text-[#A9AAAC]">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[#D6D7D8] whitespace-pre-wrap">{comment.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Form */}
            <form onSubmit={handleSubmitComment} className="mt-8 pt-8 border-t border-[#3B3C3E]">
              <Textarea
                placeholder="Type your reply..."
                rows={4}
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                required
                className="bg-[#1A1A1C] border-[#3B3C3E] mb-4"
              />
              <Button
                type="submit"
                disabled={submittingComment || !commentBody.trim()}
                className="btn-gold inline-flex items-center gap-2"
              >
                {submittingComment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Comment
                  </>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
