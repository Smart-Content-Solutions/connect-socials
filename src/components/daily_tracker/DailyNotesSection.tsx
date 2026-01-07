import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Clock, FileText, Loader2, Link as LinkIcon, Plus, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { DailyNoteAttachments } from "./DailyNoteAttachments";

interface DailyNotesSectionProps {
  taskId: string;
  selectedDate: Date;
}

interface DailyNote {
  id: string;
  task_id: string;
  date: string;
  notes_text: string | null;
  time_spent_minutes: number | null;
  links: string[] | null;
}

const isValidUrl = (url: string): boolean => {
  return url.startsWith("http://") || url.startsWith("https://");
};

export function DailyNotesSection({ taskId, selectedDate }: DailyNotesSectionProps) {
  const [dailyNote, setDailyNote] = useState<DailyNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dateStr = selectedDate.toISOString().split("T")[0];

  const handleImageUpload = async (file: File) => {
    if (!dailyNote) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${dailyNote.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("daily-note-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("daily-note-attachments")
        .getPublicUrl(fileName);

      // Insert image markdown at cursor position or at end
      const textarea = textareaRef.current;
      const imageMarkdown = `\n![${file.name}](${publicUrl})\n`;

      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = notesText.slice(0, start) + imageMarkdown + notesText.slice(end);
        setNotesText(newText);
      } else {
        setNotesText(prev => prev + imageMarkdown);
      }

      toast.success("Image added to notes");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);

    // Check for image files first
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleImageUpload(file);
        }
        return; // Stop processing after handling image
      }
    }

    // Check for files (screenshots from clipboard)
    const files = Array.from(e.clipboardData.files);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        await handleImageUpload(file);
        return;
      }
    }
  };

  const fetchOrCreateNote = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try to fetch existing note
      const { data, error } = await supabase
        .from("daily_task_notes")
        .select("*")
        .eq("task_id", taskId)
        .eq("date", dateStr)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDailyNote(data as DailyNote);
        setNotesText(data.notes_text || "");
        setTimeSpent(data.time_spent_minutes?.toString() || "");
        setLinks((data as DailyNote).links || []);
      } else {
        // Create new note
        const { data: newNote, error: insertError } = await supabase
          .from("daily_task_notes")
          .insert({
            task_id: taskId,
            date: dateStr,
            notes_text: "",
            time_spent_minutes: 0,
            links: [],
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setDailyNote(newNote as DailyNote);
        setNotesText("");
        setTimeSpent("");
        setLinks([]);
      }
    } catch (error) {
      console.error("Error fetching/creating daily note:", error);
      toast.error("Failed to load task notes");
    } finally {
      setIsLoading(false);
    }
  }, [taskId, dateStr]);

  useEffect(() => {
    fetchOrCreateNote();
  }, [fetchOrCreateNote]);

  // Debounced save for notes and time
  useEffect(() => {
    if (!dailyNote || isLoading) return;

    const timeoutId = setTimeout(async () => {
      const minutes = parseInt(timeSpent) || 0;
      if (
        notesText === (dailyNote.notes_text || "") &&
        minutes === (dailyNote.time_spent_minutes || 0)
      ) {
        return;
      }

      setIsSaving(true);
      try {
        const { error } = await supabase
          .from("daily_task_notes")
          .update({
            notes_text: notesText,
            time_spent_minutes: minutes,
          })
          .eq("id", dailyNote.id);

        if (error) throw error;
        setDailyNote((prev) =>
          prev ? { ...prev, notes_text: notesText, time_spent_minutes: minutes } : null
        );
      } catch (error) {
        console.error("Error saving daily note:", error);
        toast.error("Failed to save notes");
      } finally {
        setIsSaving(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [notesText, timeSpent, dailyNote, isLoading]);

  const handleAddLink = async () => {
    if (!newLink.trim()) return;

    if (!isValidUrl(newLink.trim())) {
      toast.error("Invalid URL. Must start with http:// or https://");
      return;
    }

    if (!dailyNote) return;

    const updatedLinks = [...links, newLink.trim()];
    setLinks(updatedLinks);
    setNewLink("");

    try {
      const { error } = await supabase
        .from("daily_task_notes")
        .update({ links: updatedLinks })
        .eq("id", dailyNote.id);

      if (error) throw error;
      setDailyNote((prev) => (prev ? { ...prev, links: updatedLinks } : null));
    } catch (error) {
      console.error("Error saving link:", error);
      toast.error("Failed to save link");
      setLinks(links); // Revert on error
    }
  };

  const handleRemoveLink = async (index: number) => {
    if (!dailyNote) return;

    const updatedLinks = links.filter((_, i) => i !== index);
    setLinks(updatedLinks);

    try {
      const { error } = await supabase
        .from("daily_task_notes")
        .update({ links: updatedLinks })
        .eq("id", dailyNote.id);

      if (error) throw error;
      setDailyNote((prev) => (prev ? { ...prev, links: updatedLinks } : null));
    } catch (error) {
      console.error("Error removing link:", error);
      toast.error("Failed to remove link");
      setLinks(links); // Revert on error
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Task Notes
        </Label>
        {isSaving && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        )}
      </div>

      {/* Notes Text with Image Support */}
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            onPaste={handlePaste}
            placeholder="Add notes specific to this day's work... (paste images or click the image button)"
            className="bg-surface border-border/50 min-h-[100px] resize-none pr-12"
          />
          <div className="absolute bottom-2 right-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploadingImage}
              title="Add image"
            >
              {isUploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Tip: Paste images directly or click the image icon to upload
        </p>
      </div>

      {/* Time Spent */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Time Spent (minutes)
        </Label>
        <Input
          type="number"
          value={timeSpent}
          onChange={(e) => setTimeSpent(e.target.value)}
          placeholder="0"
          min="0"
          className="bg-surface border-border/50 w-32"
        />
        {timeSpent && parseInt(timeSpent) > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            ≈ {(parseInt(timeSpent) / 60).toFixed(1)} hours
          </p>
        )}
      </div>

      <Separator className="bg-border/50" />

      {/* Links */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <LinkIcon className="w-4 h-4" />
          Links (optional)
        </Label>
        <div className="flex items-center gap-2 mb-2">
          <Input
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            placeholder="https://..."
            className="bg-surface border-border/50 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddLink();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLink}
            className="bg-surface border-border/50"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        {links.length > 0 && (
          <div className="space-y-1.5">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/50 group"
              >
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 truncate flex-1 mr-2"
                >
                  {link}
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => handleRemoveLink(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator className="bg-border/50" />

      {/* Attachments */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 block">
          Evidence / Attachments
        </Label>
        {dailyNote && <DailyNoteAttachments dailyNoteId={dailyNote.id} />}
      </div>
    </div>
  );
}
