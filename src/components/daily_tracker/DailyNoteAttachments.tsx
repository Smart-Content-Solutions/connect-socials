import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Upload, X, FileText, Image as ImageIcon,
  Video, File, Loader2, Download, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DailyNoteAttachment {
  id: string;
  daily_task_note_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

interface DailyNoteAttachmentsProps {
  dailyNoteId: string;
  className?: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  "application/pdf": FileText,
  "application/": FileText,
  "text/": FileText,
  "image/": ImageIcon,
  "video/": Video,
};

const getFileIcon = (mimeType: string) => {
  for (const [key, Icon] of Object.entries(FILE_ICONS)) {
    if (mimeType.startsWith(key)) return Icon;
  }
  return File;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function DailyNoteAttachments({ dailyNoteId, className }: DailyNoteAttachmentsProps) {
  const [attachments, setAttachments] = useState<DailyNoteAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAttachments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("daily_task_note_attachments")
        .select("*")
        .eq("daily_task_note_id", dailyNoteId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error("Error fetching daily note attachments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dailyNoteId]);

  useEffect(() => {
    if (dailyNoteId) {
      fetchAttachments();
    }
  }, [dailyNoteId, fetchAttachments]);

  const [isDragging, setIsDragging] = useState(false);

  // ... (keep fetchAttachments)

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${dailyNoteId}/${Date.now()}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("daily-note-attachments")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw uploadError;
        }

        // Save metadata to database
        const { error: dbError } = await supabase
          .from("daily_task_note_attachments")
          .insert({
            daily_task_note_id: dailyNoteId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: fileName,
          });

        if (dbError) {
          console.error("DB error:", dbError);
          throw dbError;
        }
      }

      toast.success("Files uploaded successfully");
      fetchAttachments();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      await processFiles(files);
      event.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFiles(files);
    }
  };

  const handleDownload = async (attachment: DailyNoteAttachment) => {
    try {
      const { data } = supabase.storage
        .from("daily-note-attachments")
        .getPublicUrl(attachment.storage_path);

      window.open(data.publicUrl, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleDelete = async (attachment: DailyNoteAttachment) => {
    try {
      // Delete from storage
      await supabase.storage
        .from("daily-note-attachments")
        .remove([attachment.storage_path]);

      // Delete from database
      const { error } = await supabase
        .from("daily_task_note_attachments")
        .delete()
        .eq("id", attachment.id);

      if (error) throw error;

      toast.success("File deleted");
      fetchAttachments();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload Button */}
      {/* Upload Drop Zone */}
      <label
        className="cursor-pointer block relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
          disabled={isUploading}
          accept="*/*"
        />
        <div className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 flex flex-col items-center justify-center gap-2",
          isDragging
            ? "border-[#E1C37A] bg-[#E1C37A]/5 scale-[1.02]"
            : "border-border/50 hover:bg-surface/50 hover:border-[#E1C37A]/30 bg-surface/30"
        )}>
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#E1C37A]" />
          ) : (
            <>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                isDragging ? "bg-[#E1C37A]/20" : "bg-surface-hover"
              )}>
                <Upload className={cn(
                  "h-5 w-5 transition-colors",
                  isDragging ? "text-[#E1C37A]" : "text-muted-foreground"
                )} />
              </div>
              <p className={cn(
                "text-sm font-medium transition-colors",
                isDragging ? "text-[#E1C37A]" : "text-foreground"
              )}>
                {isDragging ? "Drop files here" : "Upload Files"}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to browse
              </p>
            </>
          )}
        </div>
      </label>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.file_type);
            const isImage = attachment.file_type.startsWith("image/");

            return (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/50 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {isImage ? (
                    <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                      <img
                        src={supabase.storage.from("daily-note-attachments").getPublicUrl(attachment.storage_path).data.publicUrl}
                        alt={attachment.file_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attachment.file_type || "Unknown type"} · {formatFileSize(attachment.file_size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDownload(attachment)}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(attachment)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
