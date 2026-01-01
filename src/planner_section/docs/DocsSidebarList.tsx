import { Plus, FileText, Search } from "lucide-react";
import { DocPage, DocTag } from "../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DocsSidebarListProps {
  docs: DocPage[];
  selectedDocId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectDoc: (id: string) => void;
  onNewDoc: () => void;
}

const tagColors: Record<DocTag, string> = {
  Process: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Instructions: "bg-green-500/20 text-green-400 border-green-500/30",
  Dev: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Management: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function DocsSidebarList({
  docs,
  selectedDocId,
  searchQuery,
  onSearchChange,
  onSelectDoc,
  onNewDoc,
}: DocsSidebarListProps) {
  const filteredDocs = docs.filter((doc) => {
    const query = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewDoc}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gold-glow"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Page
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-surface border-border/50"
          />
        </div>
        {searchQuery && (
          <p className="text-xs text-muted-foreground mt-2">
            {filteredDocs.length} result{filteredDocs.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Doc List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No documents found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectDoc(doc.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all duration-200",
                  "hover:bg-surface-hover",
                  selectedDocId === doc.id
                    ? "bg-surface-hover border border-primary/30"
                    : "border border-transparent"
                )}
              >
                <h4 className="text-sm font-medium text-foreground truncate mb-1.5">
                  {doc.title}
                </h4>
                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 2).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn("text-[10px] px-1.5 py-0", tagColors[tag])}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {doc.tags.length > 2 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 bg-muted/50 text-muted-foreground"
                      >
                        +{doc.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
