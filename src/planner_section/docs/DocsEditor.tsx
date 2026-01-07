import { useState, useCallback, useRef, useEffect } from "react";
import DOMPurify from "dompurify";
import { DocPage } from "../types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  CodeSquare,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// DOMPurify configuration for rich text editor
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'u', 'a', 'code', 'pre', 'div', 'span', 'input', 'br', 'b', 'i'],
  ALLOWED_ATTR: ['href', 'class', 'type', 'checked'],
  ALLOW_DATA_ATTR: false,
};

interface DocsEditorProps {
  doc: DocPage | null;
  localTitle: string;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
}

const toolbarButtons = [
  { icon: Heading1, command: "h1", label: "Heading 1" },
  { icon: Heading2, command: "h2", label: "Heading 2" },
  { icon: Heading3, command: "h3", label: "Heading 3" },
  { type: "separator" },
  { icon: Bold, command: "bold", label: "Bold" },
  { icon: Italic, command: "italic", label: "Italic" },
  { icon: Underline, command: "underline", label: "Underline" },
  { type: "separator" },
  { icon: List, command: "ul", label: "Bullet List" },
  { icon: ListOrdered, command: "ol", label: "Numbered List" },
  { icon: CheckSquare, command: "checkbox", label: "Checkbox" },
  { type: "separator" },
  { icon: Code, command: "code", label: "Inline Code" },
  { icon: CodeSquare, command: "codeblock", label: "Code Block" },
  { icon: Link2, command: "link", label: "Hyperlink" },
];

// Helper to sanitize text content (strips all HTML)
const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

export function DocsEditor({ doc, localTitle, onUpdateTitle, onUpdateContent }: DocsEditorProps) {
  const [activeCommands, setActiveCommands] = useState<Set<string>>(new Set());
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Initialize/update content when doc changes
  useEffect(() => {
    if (!editorRef.current || !doc) return;

    const sanitized = DOMPurify.sanitize(doc.content || "", PURIFY_CONFIG);

    // Only update if we're not currently typing (to preserve cursor)
    if (!isUpdatingRef.current && editorRef.current.innerHTML !== sanitized) {
      editorRef.current.innerHTML = sanitized || '<p><br></p>'; // Add empty paragraph if empty
    }
  }, [doc?.id]); // Only re-run when document ID changes (switching docs)

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    if (!editorRef.current) return;

    isUpdatingRef.current = true;
    const currentContent = editorRef.current.innerHTML;
    const sanitized = DOMPurify.sanitize(currentContent, PURIFY_CONFIG);
    onUpdateContent(sanitized);

    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);
  }, [onUpdateContent]);

  const executeCommand = useCallback((command: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    switch (command) {
      case "h1":
        document.execCommand("formatBlock", false, "h1");
        break;
      case "h2":
        document.execCommand("formatBlock", false, "h2");
        break;
      case "h3":
        document.execCommand("formatBlock", false, "h3");
        break;
      case "bold":
        document.execCommand("bold");
        setActiveCommands((prev) => {
          const next = new Set(prev);
          if (next.has("bold")) next.delete("bold");
          else next.add("bold");
          return next;
        });
        break;
      case "italic":
        document.execCommand("italic");
        setActiveCommands((prev) => {
          const next = new Set(prev);
          if (next.has("italic")) next.delete("italic");
          else next.add("italic");
          return next;
        });
        break;
      case "underline":
        document.execCommand("underline");
        setActiveCommands((prev) => {
          const next = new Set(prev);
          if (next.has("underline")) next.delete("underline");
          else next.add("underline");
          return next;
        });
        break;
      case "ul":
        document.execCommand("insertUnorderedList");
        break;
      case "ol":
        document.execCommand("insertOrderedList");
        break;
      case "checkbox":
        const safeCheckboxText = sanitizeText(selectedText || "Todo item");
        const checkbox = `<div class="flex items-center gap-2 my-1"><input type="checkbox" class="form-checkbox" /><span>${safeCheckboxText}</span></div>`;
        document.execCommand("insertHTML", false, checkbox);
        break;
      case "code":
        const safeCodeText = sanitizeText(selectedText);
        document.execCommand("insertHTML", false, `<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">${safeCodeText}</code>`);
        break;
      case "codeblock":
        const safeBlockText = sanitizeText(selectedText || "// Code here");
        document.execCommand("insertHTML", false, `<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-2"><code class="text-sm font-mono">${safeBlockText}</code></pre>`);
        break;
      case "link":
        const url = prompt("Enter URL:", "https://");
        if (url) {
          document.execCommand("createLink", false, url);
        }
        break;
    }

    // Trigger input event after command
    if (editorRef.current) {
      handleInput({ currentTarget: editorRef.current } as any);
    }
  }, [handleInput]);

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Heading1 className="w-10 h-10 text-primary" />
        </div>
        <h3 className="text-xl font-medium text-foreground mb-2">Select a document</h3>
        <p className="text-muted-foreground max-w-sm">
          Choose a document from the sidebar or create a new one to start editing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Title */}
      <div className="p-6 pb-4">
        <Input
          value={localTitle}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder="Untitled Document"
          className="text-2xl font-semibold bg-transparent border-none px-0 h-auto focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Toolbar */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-1 p-2 bg-surface rounded-lg border border-border/50 flex-wrap">
          {toolbarButtons.map((btn, idx) => {
            if (btn.type === "separator") {
              return <Separator key={idx} orientation="vertical" className="h-6 mx-1" />;
            }
            const Icon = btn.icon!;
            return (
              <Button
                key={btn.command}
                variant="ghost"
                size="sm"
                onClick={() => executeCommand(btn.command!)}
                className={cn(
                  "h-8 w-8 p-0",
                  activeCommands.has(btn.command!) && "bg-primary/20 text-primary"
                )}
                title={btn.label}
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          className={cn(
            "min-h-[400px] p-4 bg-surface rounded-lg border border-border/50",
            "focus:outline-none focus:ring-2 focus:ring-primary/30",
            "prose prose-invert prose-sm max-w-none",
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:text-foreground",
            "[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:text-foreground",
            "[&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:text-foreground",
            "[&_p]:mb-2 [&_p]:text-foreground/90",
            "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2",
            "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2",
            "[&_li]:mb-1 [&_li]:text-foreground/90",
            "[&_a]:text-primary [&_a]:underline",
            "[&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto",
            "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono"
          )}
        />
      </div>
    </div>
  );
}
