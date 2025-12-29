import { Plus } from "lucide-react";
import { DocPage } from "@/planner_section/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DocsSidebarListProps {
    docs: DocPage[];
    selectedDocId: string | null;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onSelectDoc: (id: string) => void;
    onNewDoc: () => void;
}

export function DocsSidebarList({
    docs,
    selectedDocId,
    searchQuery,
    onSearchChange,
    onSelectDoc,
    onNewDoc,
}: DocsSidebarListProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground">Pages</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNewDoc}
                        className="h-8 w-8 hover:bg-gold/10 hover:text-gold transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <Input
                    placeholder="Filter pages..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="h-8 bg-surface border-border/50 text-xs"
                />
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {docs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-xs">
                            No pages found
                        </div>
                    ) : (
                        docs.map((doc) => (
                            <div
                                key={doc.id}
                                onClick={() => onSelectDoc(doc.id)}
                                className={cn(
                                    "w-full text-left px-3 py-2 rounded-lg cursor-pointer transition-colors",
                                    selectedDocId === doc.id
                                        ? "bg-surface-hover border border-border/50"
                                        : "hover:bg-surface/50 border border-transparent"
                                )}
                            >
                                <div className="text-sm font-medium text-foreground truncate mb-0.5">
                                    {doc.title || "Untitled"}
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span>{format(new Date(doc.lastUpdated), "MMM d")}</span>
                                    {doc.tags.length > 0 && (
                                        <span className="bg-primary/10 text-primary px-1 rounded">
                                            {doc.tags[0]}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
