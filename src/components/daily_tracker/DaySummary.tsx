import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const SUMMARY_TEMPLATE = `Time started:

Time finished:

WORK DONE (bullet points only):

- What was actually built / changed today

- Links, screenshots, or commits where applicable

TESTING:

- What was tested today

- Result: PASS / FAIL / NOT TESTABLE

BLOCKERS (if any):

- What is blocking progress

- What is needed to unblock it

STATUS:

- DONE / PARTIALLY DONE / BLOCKED`;

interface DaySummaryProps {
  selectedDate: Date;
  onSummaryChange?: (summary: string) => void;
}

interface DailySummary {
  id: string;
  date: string;
  summary_text: string;
  updated_at: string;
}

export function DaySummary({ selectedDate, onSummaryChange }: DaySummaryProps) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchOrCreateSummary = useCallback(async () => {
    setIsLoading(true);
    setShowSaved(false);
    try {
      const { data, error } = await supabase
        .from("daily_summaries")
        .select("*")
        .eq("date", dateStr)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSummary(data as DailySummary);
        setSummaryText(data.summary_text || "");
        setLastSaved(new Date(data.updated_at));
        onSummaryChange?.(data.summary_text || "");
      } else {
        // Fetch completed tasks for this date
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("status", "Done")
          .not("completed_date", "is", null)
          .gte("completed_date", `${dateStr}T00:00:00`)
          .lt("completed_date", `${dateStr}T23:59:59`)
          .order("completed_date", { ascending: false });

        if (tasksError) throw tasksError;

        // Generate summary text with completed tasks
        let generatedSummary = SUMMARY_TEMPLATE;

        if (tasksData && tasksData.length > 0) {
          // Auto-populate WORK DONE section with completed tasks
          const workDoneSection = tasksData.map(task => {
            const completedTime = task.completed_date ? format(new Date(task.completed_date), "h:mm a") : "";
            return `- ${task.title}${task.description ? ': ' + task.description : ''} (Completed at: ${completedTime})`;
          }).join('\n\n');

          // Replace the WORK DONE placeholder
          generatedSummary = generatedSummary.replace(
            `- What was actually built / changed today

- Links, screenshots, or commits where applicable`,
            workDoneSection
          );

          // Auto-set time started/finished if we have tasks
          if (tasksData.length > 0) {
            const firstTask = new Date(tasksData[tasksData.length - 1].completed_date);
            const lastTask = new Date(tasksData[0].completed_date);

            generatedSummary = generatedSummary.replace(
              "Time started:",
              `Time started: ${format(firstTask, "h:mm a")}`
            );
            generatedSummary = generatedSummary.replace(
              "Time finished:",
              `Time finished: ${format(lastTask, "h:mm a")}`
            );
          }
        }

        setSummary(null);
        setSummaryText(generatedSummary);
        setLastSaved(null);
        onSummaryChange?.(generatedSummary);
      }
    } catch (error) {
      console.error("Error fetching daily summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [dateStr, onSummaryChange]);

  useEffect(() => {
    fetchOrCreateSummary();
  }, [fetchOrCreateSummary]);

  const handleSave = async () => {
    if (isLoading) return;

    setIsSaving(true);
    try {
      if (summary) {
        // Update existing
        const { error } = await supabase
          .from("daily_summaries")
          .update({ summary_text: summaryText })
          .eq("id", summary.id);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("daily_summaries")
          .insert({
            date: dateStr,
            summary_text: summaryText,
          })
          .select()
          .single();

        if (error) throw error;
        setSummary(data as DailySummary);
      }

      const now = new Date();
      setLastSaved(now);
      setShowSaved(true);
      onSummaryChange?.(summaryText);

      // Hide "Saved" indicator after 3 seconds
      setTimeout(() => setShowSaved(false), 3000);
    } catch (error) {
      console.error("Error saving summary:", error);
      toast.error("Failed to save summary");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Day Summary
        </Label>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {showSaved && !isSaving && lastSaved && (
            <span className="text-xs text-green-400/80 flex items-center gap-1">
              <Check className="h-3 w-3" />
              Saved {format(lastSaved, "h:mm a")}
            </span>
          )}
        </div>
      </div>

      <Textarea
        value={summaryText}
        onChange={(e) => setSummaryText(e.target.value)}
        onBlur={handleSave}
        placeholder="Write a concise summary of what was achieved today…"
        className="bg-surface border-border/50 min-h-[120px] resize-y"
        rows={5}
      />
    </div>
  );
}
