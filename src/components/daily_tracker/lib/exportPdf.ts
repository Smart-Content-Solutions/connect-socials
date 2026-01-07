import jsPDF from "jspdf";
import { format } from "date-fns";
import { Task } from "../types";
import { supabase } from "@/lib/supabase";

interface DailyNoteWithAttachments {
  id: string;
  notes_text: string | null;
  time_spent_minutes: number | null;
  links: string[] | null;
  attachments: {
    file_name: string;
    storage_path: string;
  }[];
}

const stripHtml = (html: string) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  // Pre-process line breaks to preserve formatting
  const processedHtml = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<div>/gi, "\n");
  tmp.innerHTML = processedHtml;
  return (tmp.textContent || tmp.innerText || "").trim();
};

export async function exportDailyReportPDF(
  selectedDate: Date,
  tasks: Task[],
  daySummary?: string
): Promise<void> {
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const displayDate = format(selectedDate, "EEEE, MMMM d, yyyy");

  // Fetch daily notes for all tasks
  const taskIds = tasks.map((t) => t.id);
  const dailyNotesMap = new Map<string, DailyNoteWithAttachments>();

  if (taskIds.length > 0) {
    const { data: notes } = await supabase
      .from("daily_task_notes")
      .select(`
        id,
        task_id,
        notes_text,
        time_spent_minutes,
        links,
        daily_task_note_attachments (
          file_name,
          storage_path
        )
      `)
      .eq("date", dateStr)
      .in("task_id", taskIds);

    if (notes) {
      notes.forEach((note: any) => {
        dailyNotesMap.set(note.task_id, {
          id: note.id,
          notes_text: note.notes_text,
          time_spent_minutes: note.time_spent_minutes,
          links: note.links || [],
          attachments: note.daily_task_note_attachments || [],
        });
      });
    }
  }

  // Create PDF
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const headerColor = { r: 45, g: 45, b: 50 };
  const accentColor = { r: 245, g: 158, b: 11 }; // Amber
  const mutedColor = { r: 120, g: 120, b: 130 };

  // Helper to check page break and add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Helper to add text with word wrap
  const addText = (
    text: string,
    fontSize: number,
    options: {
      isBold?: boolean;
      color?: { r: number; g: number; b: number };
      maxWidth?: number;
      indent?: number;
    } = {}
  ) => {
    const { isBold = false, color = headerColor, maxWidth = contentWidth, indent = 0 } = options;
    pdf.setFontSize(fontSize);
    pdf.setFont("helvetica", isBold ? "bold" : "normal");
    pdf.setTextColor(color.r, color.g, color.b);
    const lines = pdf.splitTextToSize(text, maxWidth - indent);
    lines.forEach((line: string) => {
      checkPageBreak(fontSize * 0.5);
      pdf.text(line, margin + indent, y);
      y += fontSize * 0.45;
    });
  };

  const addSpacer = (height = 5) => {
    y += height;
  };

  const addDivider = (style: "solid" | "dashed" = "solid") => {
    checkPageBreak(8);
    pdf.setDrawColor(200, 200, 205);
    if (style === "dashed") {
      pdf.setLineDashPattern([2, 2], 0);
    }
    pdf.line(margin, y, pageWidth - margin, y);
    pdf.setLineDashPattern([], 0);
    addSpacer(8);
  };

  // =========================================
  // HEADER SECTION
  // =========================================

  // Title with accent bar
  pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
  pdf.rect(margin, y - 2, 4, 16, "F");

  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(headerColor.r, headerColor.g, headerColor.b);
  pdf.text("SCS Daily Report", margin + 10, y + 8);
  y += 18;

  // Date
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
  pdf.text(displayDate, margin + 10, y);
  y += 12;

  addDivider();

  // =========================================
  // DAY SUMMARY SECTION (if present)
  // =========================================

  if (daySummary && daySummary.trim()) {
    addText("Day Summary", 13, { isBold: true });
    addSpacer(4);

    // Summary box background
    const summaryLines = pdf.splitTextToSize(daySummary, contentWidth - 16);
    const summaryHeight = summaryLines.length * 5 + 12;

    checkPageBreak(summaryHeight);
    pdf.setFillColor(248, 248, 250);
    pdf.roundedRect(margin, y - 2, contentWidth, summaryHeight, 3, 3, "F");

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(headerColor.r, headerColor.g, headerColor.b);
    summaryLines.forEach((line: string) => {
      pdf.text(line, margin + 8, y + 6);
      y += 5;
    });
    y += 10;

    addDivider();
  }

  // =========================================
  // TASKS OVERVIEW
  // =========================================

  const totalMinutes = Array.from(dailyNotesMap.values()).reduce(
    (sum, note) => sum + (note.time_spent_minutes || 0),
    0
  );

  addText("Overview", 13, { isBold: true });
  addSpacer(4);

  // Stats row
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
  pdf.text(`Completed Tasks: `, margin, y);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(headerColor.r, headerColor.g, headerColor.b);
  pdf.text(`${tasks.length}`, margin + 35, y);

  if (totalMinutes > 0) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const timeText = `${totalMinutes} minutes (${hours}h ${mins}m)`;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
    pdf.text(`  •  Total Time: `, margin + 45, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(headerColor.r, headerColor.g, headerColor.b);
    pdf.text(timeText, margin + 75, y);
  }
  y += 8;

  addDivider();

  // =========================================
  // COMPLETED TASKS SECTION
  // =========================================

  addText("Completed Tasks", 13, { isBold: true });
  addSpacer(6);

  tasks.forEach((task, index) => {
    const dailyNote = dailyNotesMap.get(task.id);

    // Calculate required height for this task (increased for more content)
    const estimatedHeight = 80 +
      (task.description ? 40 : 0) +
      (task.comments ? 30 : 0) +
      (dailyNote?.notes_text ? 35 : 0) +
      (dailyNote?.links?.length ? dailyNote.links.length * 6 : 0) +
      (dailyNote?.attachments?.length ? dailyNote.attachments.length * 10 : 0);

    checkPageBreak(estimatedHeight);

    // Task number and title
    pdf.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    pdf.circle(margin + 4, y + 2, 3, "F");
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${index + 1}`, margin + 2.5, y + 3.5);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(headerColor.r, headerColor.g, headerColor.b);
    const titleLines = pdf.splitTextToSize(task.title, contentWidth - 16);
    titleLines.forEach((line: string) => {
      pdf.text(line, margin + 12, y + 3);
      y += 6;
    });
    y += 4;

    // Metadata badges row
    const priorityColors: Record<string, { r: number; g: number; b: number }> = {
      Critical: { r: 239, g: 68, b: 68 },
      High: { r: 249, g: 115, b: 22 },
      Medium: { r: 245, g: 158, b: 11 },
      Low: { r: 34, g: 197, b: 94 },
    };
    const priorityColor = priorityColors[task.priority] || mutedColor;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(priorityColor.r, priorityColor.g, priorityColor.b);
    pdf.text(`Priority: ${task.priority}`, margin + 12, y);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
    pdf.text(`  •  Assignee: ${task.assignee}`, margin + 12 + pdf.getTextWidth(`Priority: ${task.priority}`), y);
    y += 5;

    // Due date and completed date
    if (task.dueDate || task.completedDate) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
      let dateInfo = "";
      if (task.dueDate) {
        dateInfo += `Due: ${format(task.dueDate, "MMM d, yyyy")}`;
      }
      if (task.completedDate) {
        if (dateInfo) dateInfo += "  •  ";
        dateInfo += `Completed: ${format(task.completedDate, "MMM d, yyyy")}`;
      }
      pdf.text(dateInfo, margin + 12, y);
      y += 5;
    }

    // Time spent on this task
    if (dailyNote?.time_spent_minutes && dailyNote.time_spent_minutes > 0) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(accentColor.r, accentColor.g, accentColor.b);
      pdf.text(`Time Spent: ${dailyNote.time_spent_minutes} minutes`, margin + 12, y);
      y += 5;
    }

    addSpacer(4);

    // Description (full, not truncated)
    if (task.description) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
      pdf.text("Description:", margin + 12, y);
      y += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(headerColor.r, headerColor.g, headerColor.b);
      const cleanDescription = stripHtml(task.description);
      const descLines = pdf.splitTextToSize(cleanDescription, contentWidth - 16);
      descLines.forEach((line: string) => {
        checkPageBreak(5);
        pdf.text(line, margin + 16, y);
        y += 4.5;
      });
      addSpacer(3);
    }

    // Task Comments (full)
    if (task.comments) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
      pdf.text("Comments:", margin + 12, y);
      y += 5;

      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(headerColor.r, headerColor.g, headerColor.b);
      const cleanComments = stripHtml(task.comments);
      const commentLines = pdf.splitTextToSize(cleanComments, contentWidth - 16);
      commentLines.forEach((line: string) => {
        checkPageBreak(5);
        pdf.text(line, margin + 16, y);
        y += 4.5;
      });
      addSpacer(3);
    }

    // Task Notes (full, not truncated)
    if (dailyNote?.notes_text) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
      pdf.text("Daily Notes:", margin + 12, y);
      y += 5;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(headerColor.r, headerColor.g, headerColor.b);
      const cleanNotes = stripHtml(dailyNote.notes_text);
      const notesLines = pdf.splitTextToSize(cleanNotes, contentWidth - 16);
      notesLines.forEach((line: string) => {
        checkPageBreak(5);
        pdf.text(line, margin + 16, y);
        y += 4.5;
      });
      addSpacer(3);
    }

    // Links
    if (dailyNote?.links && dailyNote.links.length > 0) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
      pdf.text("Evidence Links:", margin + 12, y);
      y += 5;

      dailyNote.links.forEach((link) => {
        checkPageBreak(6);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(59, 130, 246); // Blue
        const displayLink = link.length > 70 ? link.substring(0, 67) + "..." : link;
        pdf.text("• ", margin + 16, y);
        pdf.textWithLink(displayLink, margin + 20, y, { url: link });
        y += 4.5;
      });
      addSpacer(3);
    }

    // Attachments
    if (dailyNote?.attachments && dailyNote.attachments.length > 0) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
      pdf.text("Attachments:", margin + 12, y);
      y += 5;

      dailyNote.attachments.forEach((att) => {
        checkPageBreak(10);
        const publicUrl = supabase.storage
          .from("daily-note-attachments")
          .getPublicUrl(att.storage_path).data.publicUrl;

        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(59, 130, 246); // Blue for clickable
        pdf.text("• ", margin + 16, y);
        pdf.textWithLink(att.file_name, margin + 20, y, { url: publicUrl });
        y += 5;
      });
    }

    // Task separator
    addSpacer(6);
    if (index < tasks.length - 1) {
      addDivider("dashed");
    }
  });

  // =========================================
  // TOTAL TIME SUMMARY - REMOVED
  // =========================================

  // =========================================
  // FOOTER
  // =========================================

  addSpacer(8);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(mutedColor.r, mutedColor.g, mutedColor.b);
  pdf.text(`Generated on ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, margin, y);

  // Save
  pdf.save(`SCS-Daily-Report-${dateStr}.pdf`);
}
