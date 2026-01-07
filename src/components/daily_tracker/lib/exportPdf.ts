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

const removeEmojis = (str: string) => {
  if (!str) return "";
  // Regex to remove common emojis and symbols that jsPDF doesn't support with standard fonts
  return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
};

const extractImagesFromHtml = (html: string): string[] => {
  if (!html) return [];
  const regex = /<img[^>]+src="([^">]+)"/g;
  const matches = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) matches.push(match[1]);
  }
  return matches;
};

const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 }); // Fail gracefully
    img.src = src;
  });
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

    // Clean text to avoid rendering issues
    const cleanText = removeEmojis(text);

    const lines = pdf.splitTextToSize(cleanText, maxWidth - indent);
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

  // Helper to add images from content
  const addContentImages = async (htmlContent: string) => {
    const images = extractImagesFromHtml(htmlContent);
    for (const src of images) {
      // Basic support for base64 images mostly
      if (src.startsWith('data:image')) {
        const dims = await getImageDimensions(src);
        if (dims.width > 0) {
          // Calculate scale to fit width
          let imgWidth = dims.width;
          let imgHeight = dims.height;

          const maxWidth = contentWidth - 20; // Indented slightly
          const pxToMm = 0.264583; // 1px = 0.26mm approx (96dpi)

          let finalWidth = imgWidth * pxToMm;
          let finalHeight = imgHeight * pxToMm;

          if (finalWidth > maxWidth) {
            const scale = maxWidth / finalWidth;
            finalWidth = maxWidth;
            finalHeight = finalHeight * scale;
          }

          checkPageBreak(finalHeight + 10);

          try {
            // Determine format
            let format = "PNG";
            if (src.includes("image/jpeg") || src.includes("image/jpg")) format = "JPEG";
            if (src.includes("image/webp")) format = "WEBP";

            pdf.addImage(src, format, margin + 10, y, finalWidth, finalHeight);
            y += finalHeight + 5;
          } catch (e) {
            console.error("Failed to add image to PDF", e);
          }
        }
      }
    }
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

    // Render plain text with page breaks instead of a single bounded box
    // This handles long text (like the user provided) much better
    const cleanSummary = removeEmojis(daySummary);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(headerColor.r, headerColor.g, headerColor.b);

    const summaryLines = pdf.splitTextToSize(cleanSummary, contentWidth - 5);
    summaryLines.forEach((line: string) => {
      checkPageBreak(5);
      pdf.text(line, margin, y);
      y += 5;
    });

    y += 5;

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

  // Use for loop for await compatibility
  for (let index = 0; index < tasks.length; index++) {
    const task = tasks[index];
    const dailyNote = dailyNotesMap.get(task.id);

    // Calculate required height for this task (estimation)
    const estimatedHeight = 50; // Base metadata
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
    const title = removeEmojis(task.title);
    const titleLines = pdf.splitTextToSize(title, contentWidth - 16);
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
      const cleanDescription = removeEmojis(stripHtml(task.description)); // Strip emojis
      const descLines = pdf.splitTextToSize(cleanDescription, contentWidth - 16);
      descLines.forEach((line: string) => {
        checkPageBreak(5);
        pdf.text(line, margin + 16, y);
        y += 4.5;
      });
      addSpacer(3);

      // Embed images found in description
      await addContentImages(task.description);
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
      const cleanComments = removeEmojis(stripHtml(task.comments)); // Strip emojis
      const commentLines = pdf.splitTextToSize(cleanComments, contentWidth - 16);
      commentLines.forEach((line: string) => {
        checkPageBreak(5);
        pdf.text(line, margin + 16, y);
        y += 4.5;
      });
      addSpacer(3);

      // Embed images found in comments
      await addContentImages(task.comments);
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
      const cleanNotes = removeEmojis(stripHtml(dailyNote.notes_text)); // Strip emojis
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
  }

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
