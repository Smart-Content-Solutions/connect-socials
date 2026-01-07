import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDocs } from "../store/DataProvider";
import { DocTag } from "../types";
import { DocsSidebarList } from "../docs/DocsSidebarList";
import { DocsEditor } from "../docs/DocsEditor";
import { DocsMetadataPanel } from "../docs/DocsMetadataPanel";
import { Loader2 } from "lucide-react";
import { useUser } from "@clerk/clerk-react";

export function DocsView() {
  const { docs, isLoading, createDoc, updateDoc, deleteDoc, searchQuery } = useDocs();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const { user } = useUser();

  // Combine global search with local search
  const effectiveSearchQuery = searchQuery || localSearchQuery;

  // Filter docs based on search
  const filteredDocs = useMemo(() => {
    if (!effectiveSearchQuery) return docs;
    const query = effectiveSearchQuery.toLowerCase();
    return docs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        doc.content.toLowerCase().includes(query)
    );
  }, [docs, effectiveSearchQuery]);

  const selectedDoc = docs.find((d) => d.id === selectedDocId) || null;

  // Local state for editing to prevent cursor issues
  const [localTitle, setLocalTitle] = useState("");
  const [localNotes, setLocalNotes] = useState("");
  const titleUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notesUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-select first doc on mount or when selection is invalid
  useEffect(() => {
    if (docs.length > 0 && (!selectedDocId || !docs.find((d) => d.id === selectedDocId))) {
      setSelectedDocId(docs[0].id);
    }
  }, [docs, selectedDocId]);

  // Sync local state when doc changes
  useEffect(() => {
    if (selectedDoc) {
      setLocalTitle(selectedDoc.title);
      setLocalNotes(selectedDoc.notes || "");
    }
  }, [selectedDoc?.id]); // Only update when switching docs

  const handleNewDoc = async () => {
    const creatorName = user?.firstName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || "Admin";
    const newDoc = await createDoc({
      title: "Untitled Document",
      content: "<p>Start writing here...</p>",
      tags: [],
      createdBy: creatorName,
    });
    setSelectedDocId(newDoc.id);
  };

  // Debounced title update
  const handleUpdateTitle = useCallback((title: string) => {
    setLocalTitle(title); // Update local state immediately

    if (titleUpdateTimeoutRef.current) {
      clearTimeout(titleUpdateTimeoutRef.current);
    }

    titleUpdateTimeoutRef.current = setTimeout(() => {
      if (selectedDocId) {
        updateDoc(selectedDocId, { title });
      }
    }, 500); // 500ms debounce
  }, [selectedDocId, updateDoc]);

  const handleUpdateContent = async (content: string) => {
    if (selectedDocId) {
      await updateDoc(selectedDocId, { content });
    }
  };

  const handleUpdateTags = async (tags: DocTag[]) => {
    if (selectedDocId) {
      await updateDoc(selectedDocId, { tags });
    }
  };

  // Debounced notes update
  const handleUpdateNotes = useCallback((notes: string) => {
    setLocalNotes(notes); // Update local state immediately

    if (notesUpdateTimeoutRef.current) {
      clearTimeout(notesUpdateTimeoutRef.current);
    }

    notesUpdateTimeoutRef.current = setTimeout(() => {
      if (selectedDocId) {
        updateDoc(selectedDocId, { notes });
      }
    }, 500); // 500ms debounce
  }, [selectedDocId, updateDoc]);

  const handleDeleteDoc = async () => {
    if (selectedDocId) {
      const success = await deleteDoc(selectedDocId);
      if (success) {
        // Select the first available doc or clear selection
        const remaining = docs.filter((d) => d.id !== selectedDocId);
        setSelectedDocId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Left Column - Doc List */}
      <div className="w-[280px] border-r border-border bg-card/50 flex-shrink-0">
        <DocsSidebarList
          docs={filteredDocs}
          selectedDocId={selectedDocId}
          searchQuery={localSearchQuery}
          onSearchChange={setLocalSearchQuery}
          onSelectDoc={setSelectedDocId}
          onNewDoc={handleNewDoc}
        />
      </div>

      {/* Center Column - Editor */}
      <div className="flex-1 min-w-0 bg-background">
        <DocsEditor
          doc={selectedDoc}
          localTitle={localTitle}
          onUpdateTitle={handleUpdateTitle}
          onUpdateContent={handleUpdateContent}
        />
      </div>

      {/* Right Column - Metadata */}
      <div className="w-[260px] border-l border-border bg-card/50 flex-shrink-0 overflow-y-auto">
        <DocsMetadataPanel
          doc={selectedDoc}
          localNotes={localNotes}
          onUpdateTags={handleUpdateTags}
          onUpdateNotes={handleUpdateNotes}
          onDeleteDoc={handleDeleteDoc}
        />
      </div>
    </div>
  );
}
