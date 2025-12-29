import { DocPage } from "@/planner_section/types";
import { Input } from "@/components/ui/input";
import { TaskRichEditor } from "../../tasks/TaskRichEditor";

interface DocsEditorProps {
    doc: DocPage | null;
    onUpdateTitle: (title: string) => void;
    onUpdateContent: (content: string) => void;
}

export function DocsEditor({ doc, onUpdateTitle, onUpdateContent }: DocsEditorProps) {
    if (!doc) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground bg-background">
                Select a page to edit
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="p-8 pb-4 max-w-4xl mx-auto w-full">
                <Input
                    value={doc.title}
                    onChange={(e) => onUpdateTitle(e.target.value)}
                    className="text-4xl font-bold border-none bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                    placeholder="Untitled Page"
                />
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8">
                <div className="max-w-4xl mx-auto w-full h-full">
                    <TaskRichEditor
                        value={doc.content}
                        onChange={onUpdateContent}
                        placeholder="Type '/' for commands..."
                        className="border-none min-h-[500px]"
                    />
                </div>
            </div>
        </div>
    );
}
