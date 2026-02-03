import { useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold, Italic, List, ListChecks, Code, ToggleLeft,
  Heading1, Heading2, Quote, Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface TaskRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function TaskRichEditor({ value, onChange, placeholder, className }: TaskRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef<string>("");
  const isFirstMountRef = useRef(true);

  // Initialize content on mount and sync external value changes
  useEffect(() => {
    if (!editorRef.current) return;

    // Always initialize on first mount
    if (isFirstMountRef.current) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value || "";
      isFirstMountRef.current = false;
      return;
    }

    // Only sync if value changed externally (not from our own onChange)
    if (value !== lastValueRef.current) {
      editorRef.current.innerHTML = value || "";
      lastValueRef.current = value || "";
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      lastValueRef.current = currentHtml;
      onChange(currentHtml);
    }
  }, [onChange]);

  const execCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  };

  const sanitizeText = (text: string): string => {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  };



  const insertToggle = () => {
    const selection = window.getSelection();
    const selectedText = sanitizeText(selection?.toString() || "Toggle item");
    const toggle = `<details class="task-toggle my-1 border border-border/50 rounded p-2 bg-surface/50">
      <summary class="cursor-pointer font-medium">${selectedText}</summary>
      <div class="mt-2 pl-4 text-muted-foreground">Toggle content here...</div>
    </details>`;
    execCommand("insertHTML", toggle);
  };

  const insertCodeBlock = () => {
    const selection = window.getSelection();
    const selectedText = sanitizeText(selection?.toString() || "// code here");
    const code = `<pre class="task-code bg-surface border border-border/50 rounded p-3 my-2 font-mono text-sm overflow-x-auto"><code>${selectedText}</code></pre>`;
    execCommand("insertHTML", code);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => execCommand("bold"), tooltip: "Bold" },
    { icon: Italic, action: () => execCommand("italic"), tooltip: "Italic" },
    { type: "separator" },
    { icon: Heading1, action: () => execCommand("formatBlock", "h1"), tooltip: "Heading 1" },
    { icon: Heading2, action: () => execCommand("formatBlock", "h2"), tooltip: "Heading 2" },
    { type: "separator" },
    { icon: List, action: () => execCommand("insertUnorderedList"), tooltip: "Bullet list" },
    { icon: ListChecks, action: () => execCommand("insertUnorderedList"), tooltip: "Checkbox" },
    { icon: ToggleLeft, action: insertToggle, tooltip: "Toggle list" },
    { type: "separator" },
    { icon: Code, action: insertCodeBlock, tooltip: "Code block" },
    { icon: Quote, action: () => execCommand("formatBlock", "blockquote"), tooltip: "Quote" },
    { icon: Minus, action: () => execCommand("insertHorizontalRule"), tooltip: "Divider" },
  ];

  return (
    <div className={cn("border border-border/50 rounded-lg bg-surface overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-1 border-b border-border/50 bg-surface/80 flex-wrap">
        {toolbarButtons.map((btn, idx) =>
          btn.type === "separator" ? (
            <Separator key={idx} orientation="vertical" className="h-6 mx-1" />
          ) : (
            <Button
              key={idx}
              type="button"
              variant="ghost"
              size="sm"
              onClick={btn.action}
              className="h-7 w-7 p-0 hover:bg-primary/10"
              title={btn.tooltip}
            >
              {btn.icon && <btn.icon className="h-4 w-4" />}
            </Button>
          )
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className={cn(
          "min-h-[150px] p-3 focus:outline-none prose prose-sm max-w-none",
          "prose-headings:text-foreground prose-p:text-foreground",
          "prose-strong:text-foreground prose-em:text-foreground",
          "prose-ul:text-foreground prose-ol:text-foreground prose-li:list-disc prose-li:ml-5",
          "prose-blockquote:border-primary prose-blockquote:text-muted-foreground",
          "prose-code:text-primary prose-pre:bg-surface",
          "[&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground",
          "task-editor-content"
        )}
        data-placeholder={placeholder || "Add description with rich formatting..."}
        suppressContentEditableWarning
      />
    </div>
  );
}