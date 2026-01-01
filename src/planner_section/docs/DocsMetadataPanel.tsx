import { DocPage, DocTag, DOC_TAGS } from "../types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { User, Calendar, Tag, Trash2, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DocAttachments } from "./DocAttachments";

interface DocsMetadataPanelProps {
  doc: DocPage | null;
  onUpdateTags: (tags: DocTag[]) => void;
  onUpdateNotes: (notes: string) => void;
  onDeleteDoc?: () => void;
}

const tagColors: Record<DocTag, string> = {
  Process: "bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30",
  Instructions: "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30",
  Dev: "bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30",
  Management: "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30",
  Other: "bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30",
};

export function DocsMetadataPanel({
  doc,
  onUpdateTags,
  onUpdateNotes,
  onDeleteDoc,
}: DocsMetadataPanelProps) {
  if (!doc) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        Select a document to view metadata
      </div>
    );
  }

  const toggleTag = (tag: DocTag) => {
    if (doc.tags.includes(tag)) {
      onUpdateTags(doc.tags.filter((t) => t !== tag));
    } else {
      onUpdateTags([...doc.tags, tag]);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* Tags */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground">Tags</Label>
        </div>
        <div className="flex flex-wrap gap-2">
          {DOC_TAGS.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              onClick={() => toggleTag(tag)}
              className={cn(
                "cursor-pointer transition-all text-xs",
                doc.tags.includes(tag) ? tagColors[tag] : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Created By */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground">Created by</Label>
        </div>
        <p className="text-sm text-muted-foreground">{doc.createdBy}</p>
      </div>

      {/* Last Updated */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground">Last updated</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(new Date(doc.lastUpdated), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      <Separator className="bg-border/50" />

      {/* Attachments */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Paperclip className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-medium text-foreground">Attachments</Label>
        </div>
        <DocAttachments docId={doc.id} />
      </div>

      <Separator className="bg-border/50" />

      {/* Notes */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 block">
          Notes
        </Label>
        <Textarea
          value={doc.notes || ""}
          onChange={(e) => onUpdateNotes(e.target.value)}
          placeholder="Add notes about this document..."
          className="bg-surface border-border/50 min-h-[100px] text-sm resize-none"
        />
      </div>

      {onDeleteDoc && (
        <>
          <Separator className="bg-border/50" />
          <div>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteDoc}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Document
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
