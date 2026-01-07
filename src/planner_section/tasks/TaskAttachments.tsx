import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Paperclip, Upload, X, FileText, Image as ImageIcon,
  Video, File, Code, Loader2, Download, Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  created_at: string;
}

interface TaskAttachmentsProps {
  taskId: string;
  compact?: boolean;
  className?: string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  "application/pdf": FileText,
  "application/msword": FileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileText,
  "image/": ImageIcon,
  "video/": Video,
  "text/": Code,
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

export function TaskAttachments({ taskId, compact = false, className }: TaskAttachmentsProps) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const fetchAttachments = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("task_attachments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        console.log("📁 Attempting upload:", {
          name: file.name,
          type: file.type,
          size: file.size,
        });

        // Validate file size (max 200MB)
        if (file.size > 200 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 200MB)`);
          continue;
        }

        const fileName = `${taskId}/${Date.now()}-${file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("task-attachments")
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("❌ Supabase Storage Error:", uploadError);
          throw new Error(`Storage Error: ${uploadError.message}`);
        }

        // Save reference in database
        const { error: dbError } = await supabase
          .from("task_attachments")
          .insert({
            task_id: taskId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: fileName,
          });

        if (dbError) {
          console.error("❌ Database Error:", dbError);
          throw new Error(`Database Error: ${dbError.message}`);
        }
      }

      toast.success("Files uploaded successfully");
      fetchAttachments();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  const handleDelete = async (attachment: TaskAttachment) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("task-attachments")
        .remove([attachment.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("task_attachments")
        .delete()
        .eq("id", attachment.id);

      if (dbError) throw dbError;

      toast.success("Attachment deleted");
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    }
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("task-attachments")
        .download(attachment.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("task-attachments").getPublicUrl(path);
    return data.publicUrl;
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="video/*,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*,.zip,.rar"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1"
            asChild
            disabled={isUploading}
          >
            <span>
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
              {attachments.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {attachments.length}
                </span>
              )}
            </span>
          </Button>
        </label>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload button */}
      <label className="cursor-pointer">
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept="video/*,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*,.zip,.rar"
        />
        <div className="border border-dashed border-border/50 rounded-lg p-4 text-center hover:bg-surface/50 transition-colors">
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Click to upload files (PDF, Word, images, videos, code, etc.)
              </p>
              <p className="text-xs text-muted-foreground mt-1">Max 200MB per file</p>
            </>
          )}
        </div>
      </label>

      {/* Attachments list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length > 0 ? (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.file_type);
            const isImage = attachment.file_type.startsWith("image/");
            const isVideo = attachment.file_type.startsWith("video/");

            return (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-2 bg-surface rounded-lg border border-border/30"
              >
                {/* Preview for images */}
                {isImage ? (
                  <img
                    src={getPublicUrl(attachment.storage_path)}
                    alt={attachment.file_name}
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 flex items-center justify-center bg-surface-hover rounded">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {attachment.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(attachment)}
                    className="h-8 w-8 p-0 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}