import { useState, useEffect, useMemo } from "react";
import { useDocs } from "../store/DataProvider";
import { DocTag } from "../types";
import { DocsSidebarList } from "../components/docs/DocsSidebarList";
import { DocsEditor } from "../components/docs/DocsEditor";
import { DocsMetadataPanel } from "../components/docs/DocsMetadataPanel";
import { Loader2 } from "lucide-react";

export function DocsView() {
  const { docs, isLoading, createDoc, updateDoc, deleteDoc, searchQuery } = useDocs();
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [localSearchQuery, setLocalSearchQuery] = useState("");

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

  // Auto-select first doc on mount or when selection is invalid
  useEffect(() => {
    if (docs.length > 0 && (!selectedDocId || !docs.find((d) => d.id === selectedDocId))) {
      setSelectedDocId(docs[0].id);
    }
  }, [docs, selectedDocId]);

  const handleNewDoc = async () => {
    const newDoc = await createDoc({
      title: "Untitled Document",
      content: "<p>Start writing here...</p>",
      tags: [],
      createdBy: "Dominik",
    });
    setSelectedDocId(newDoc.id);
  };

  const handleUpdateTitle = async (title: string) => {
    if (selectedDocId) {
      await updateDoc(selectedDocId, { title });
    }
  };

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

  const handleUpdateNotes = async (notes: string) => {
    if (selectedDocId) {
      await updateDoc(selectedDocId, { notes });
    }
  };

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
          onUpdateTitle={handleUpdateTitle}
          onUpdateContent={handleUpdateContent}
        />
      </div>

      {/* Right Column - Metadata */}
      <div className="w-[260px] border-l border-border bg-card/50 flex-shrink-0 overflow-y-auto">
        <DocsMetadataPanel
          doc={selectedDoc}
          onUpdateTags={handleUpdateTags}
          onUpdateNotes={handleUpdateNotes}
          onDeleteDoc={handleDeleteDoc}
        />
      </div>
    </div>
  );
}
