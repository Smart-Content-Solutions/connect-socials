import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 planner-theme", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-[hsl(0,0%,95%)]",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-[hsl(240,5%,12%)] border-[hsl(240,5%,18%)] p-0 opacity-70 hover:opacity-100 hover:bg-[hsl(240,5%,18%)] text-[hsl(0,0%,95%)]"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-[hsl(220,10%,55%)] rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative h-9 w-9 text-center text-sm p-0 focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-[hsl(45,90%,55%)]/20",
          "[&:has([aria-selected].day-outside)]:bg-[hsl(45,90%,55%)]/10",
          "[&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal text-[hsl(0,0%,95%)] aria-selected:opacity-100 hover:bg-[hsl(240,5%,18%)] hover:text-[hsl(0,0%,95%)] focus:bg-[hsl(240,5%,18%)] focus:text-[hsl(0,0%,95%)] cursor-pointer"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-[hsl(45,90%,55%)] text-[hsl(240,6%,6%)] hover:bg-[hsl(45,90%,50%)] hover:text-[hsl(240,6%,6%)] focus:bg-[hsl(45,90%,55%)] focus:text-[hsl(240,6%,6%)]",
        day_today:
          "bg-[hsl(240,5%,18%)] text-[hsl(0,0%,95%)] font-semibold",
        day_outside:
          "day-outside text-[hsl(220,10%,45%)] opacity-50 aria-selected:bg-[hsl(45,90%,55%)]/20 aria-selected:text-[hsl(220,10%,65%)] aria-selected:opacity-40",
        day_disabled: "text-[hsl(220,10%,35%)] opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-[hsl(45,90%,55%)]/15 aria-selected:text-[hsl(0,0%,95%)]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...iconProps }) => <ChevronLeft className="h-4 w-4" {...iconProps} />,
        IconRight: ({ ...iconProps }) => <ChevronRight className="h-4 w-4" {...iconProps} />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
