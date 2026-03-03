import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { BlogPost } from "./BlogCard";
import { AssignmentMap, SectionType } from "./blogSectionsApi";

interface BlogManageModalProps {
  isOpen: boolean;
  posts: BlogPost[];
  assignments: AssignmentMap;
  saving: boolean;
  onClose: () => void;
  onSave: (nextAssignments: AssignmentMap) => Promise<void>;
}

export default function BlogManageModal({
  isOpen,
  posts,
  assignments,
  saving,
  onClose,
  onSave,
}: BlogManageModalProps) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<AssignmentMap>({});

  React.useEffect(() => {
    if (isOpen) {
      setDraft(assignments);
      setQuery("");
    }
  }, [isOpen, assignments]);

  const filteredPosts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return posts;
    return posts.filter((post) => {
      return (
        post.title.toLowerCase().includes(needle) ||
        post.slug.toLowerCase().includes(needle)
      );
    });
  }, [posts, query]);

  if (!isOpen) return null;

  const getValue = (postId: number): SectionType => {
    return draft[String(postId)] || "our";
  };

  const updatePostSection = (postId: number, section: SectionType) => {
    setDraft((prev) => ({
      ...prev,
      [String(postId)]: section,
    }));
  };

  const handleSave = async () => {
    await onSave(draft);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#1A1A1C] border border-[#3B3C3E] rounded-xl shadow-2xl max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#3B3C3E]">
          <div>
            <h3 className="text-xl font-semibold text-white">Manage Blog Sections</h3>
            <p className="text-sm text-[#A9AAAC] mt-1">
              Assign each post to Our Posts or Our Clients.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-[#A9AAAC] hover:text-white hover:bg-[#2A2A2C] transition-colors"
            aria-label="Close manage dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 border-b border-[#3B3C3E]">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts by title or slug..."
            className="w-full bg-[#0F0F10] border border-[#3B3C3E] rounded-lg px-4 py-2 text-white placeholder:text-[#5B5C60] focus:outline-none focus:border-[#E1C37A]/60"
          />
        </div>

        <div className="overflow-y-auto max-h-[50vh]">
          {filteredPosts.length === 0 ? (
            <div className="p-6 text-center text-[#A9AAAC]">No matching posts found.</div>
          ) : (
            <div className="divide-y divide-[#2A2A2C]">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{post.title}</p>
                    <p className="text-xs text-[#A9AAAC] truncate">/{post.slug}</p>
                  </div>
                  <select
                    value={getValue(post.id)}
                    onChange={(e) =>
                      updatePostSection(post.id, e.target.value as SectionType)
                    }
                    className="bg-[#0F0F10] border border-[#3B3C3E] rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E1C37A]/60"
                  >
                    <option value="our">Our Posts</option>
                    <option value="client">Our Clients</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#3B3C3E]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-[#3B3C3E] text-[#A9AAAC] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-[#E1C37A] text-[#1A1A1C] font-semibold hover:bg-[#E1C37A]/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
