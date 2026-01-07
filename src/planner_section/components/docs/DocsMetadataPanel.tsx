import { DocPage, DocTag, DOC_TAGS } from "@/planner_section/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Calendar, User, Tag } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DocsMetadataPanelProps {
    doc: DocPage | null;
    onUpdateTags: (tags: DocTag[]) => void;
    onUpdateNotes: (notes: string) => void;
    onDeleteDoc: () => void;
}

export function DocsMetadataPanel({
    doc,
    onUpdateTags,
    onUpdateNotes,
    onDeleteDoc,
}: DocsMetadataPanelProps) {
    if (!doc) return null;

    const toggleTag = (tag: DocTag) => {
        if (doc.tags.includes(tag)) {
            onUpdateTags(doc.tags.filter((t) => t !== tag));
        } else {
            onUpdateTags([...doc.tags, tag]);
        }
    };

    return (
        <div className="p-4 space-y-6 h-full flex flex-col">
            {/* Metadata */}
            <div className="space-y-4">
                <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                        Information
                    </Label>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Created
                            </span>
                            <span className="text-foreground">
                                {/* Assuming createdAt is lastUpdated for now if not available */}
                                {format(new Date(doc.lastUpdated), "MMM d, yyyy")}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                            <span className="flex items-center gap-2">
                                <User className="w-3 h-3" /> Author
                            </span>
                            <span className="text-foreground">{doc.createdBy}</span>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Tag className="w-3 h-3" /> Tags
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                        {DOC_TAGS.map((tag) => {
                            const isActive = doc.tags.includes(tag);
                            return (
                                <Badge
                                    key={tag}
                                    variant={isActive ? "default" : "outline"}
                                    onClick={() => toggleTag(tag)}
                                    className={cn(
                                        "cursor-pointer transition-colors text-[10px] px-2 py-0.5",
                                        isActive
                                            ? "bg-gold text-primary-foreground border-gold hover:bg-gold/90"
                                            : "hover:bg-surface-hover text-muted-foreground"
                                    )}
                                >
                                    {tag}
                                </Badge>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="flex-1">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
                    Internal Notes
                </Label>
                <Textarea
                    value={doc.notes || ""}
                    onChange={(e) => onUpdateNotes(e.target.value)}
                    placeholder="Add notes about this document..."
                    className="h-full min-h-[150px] resize-none bg-surface border-border/50 text-sm"
                />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border mt-auto">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDeleteDoc}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 justify-start"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Page
                </Button>
            </div>
        </div>
    );
}
