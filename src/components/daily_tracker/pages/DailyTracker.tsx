import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarCheck, CheckCircle2, FileDown, Loader2, ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react";
import { format, isSameDay, addMonths, subMonths, startOfMonth } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Task, dbTaskToTask } from "../types";
import { CompletedTaskRow } from "../CompletedTaskRow";
import { TaskDetailDrawer } from "../tasks/TaskDetailDrawer";
import { DaySummary } from "../DaySummary";
import { exportDailyReportPDF } from "../lib/exportPdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: "easeOut" as const }
};

const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05
    }
  }
};

const taskItemVariant = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: 0.15, ease: "easeOut" as const }
};

export default function DailyTracker() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayMonth, setDisplayMonth] = useState<Date>(startOfMonth(new Date()));
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [daySummaryText, setDaySummaryText] = useState("");
  const [totalTimeForDay, setTotalTimeForDay] = useState(0);

  // Fetch completed tasks from database
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("status", "Done")
          .not("completed_date", "is", null)
          .order("completed_date", { ascending: false });

        if (error) throw error;
        setTasks(data?.map(dbTaskToTask) || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to load tasks");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Tasks for selected date
  const tasksForSelectedDate = useMemo(() => {
    return tasks.filter(task => {
      if (!task.completedDate) return false;
      return isSameDay(new Date(task.completedDate), selectedDate);
    });
  }, [tasks, selectedDate]);

  // Fetch total time for selected date
  const fetchTotalTime = useCallback(async () => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const taskIds = tasksForSelectedDate.map(t => t.id);

    if (taskIds.length === 0) {
      setTotalTimeForDay(0);
      return;
    }

    try {
      const { data } = await supabase
        .from("daily_task_notes")
        .select("time_spent_minutes")
        .eq("date", dateStr)
        .in("task_id", taskIds);

      const total = (data || []).reduce((sum, note) => sum + (note.time_spent_minutes || 0), 0);
      setTotalTimeForDay(total);
    } catch (error) {
      console.error("Error fetching total time:", error);
    }
  }, [selectedDate, tasksForSelectedDate]);

  useEffect(() => {
    fetchTotalTime();
  }, [fetchTotalTime]);

  // Dates with completed tasks (for calendar highlighting)
  const datesWithCompletedTasks = useMemo(() => {
    return tasks
      .filter(task => task.completedDate)
      .map(task => new Date(task.completedDate!));
  }, [tasks]);

  const [openFullscreen, setOpenFullscreen] = useState(false);

  const handleSelectTask = (task: Task, altKey: boolean = false) => {
    setSelectedTask(task);
    setOpenFullscreen(altKey);
    setDrawerOpen(true);
  };

  const handleExportPDF = async () => {
    if (tasksForSelectedDate.length === 0) {
      toast.error("No tasks to export for this day");
      return;
    }

    setIsExporting(true);
    try {
      await exportDailyReportPDF(selectedDate, tasksForSelectedDate, daySummaryText);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrevMonth = () => setDisplayMonth(subMonths(displayMonth, 1));
  const handleNextMonth = () => setDisplayMonth(addMonths(displayMonth, 1));
  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setDisplayMonth(startOfMonth(today));
  };

  return (
    <div className="min-h-screen bg-[hsl(240,5%,6%)] planner-theme">
      {/* Sticky Top Bar */}
      <header className="sticky top-16 z-20 border-b border-border/30 bg-[hsl(240,5%,8%)]/90 backdrop-blur-xl">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Title - hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-amber-400/20 to-yellow-500/10 rounded-xl border border-amber-400/20">
                <CalendarCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">Daily Tracker</h1>
            </div>

            {/* Mobile: Just icon */}
            <div className="flex sm:hidden items-center">
              <div className="p-2 bg-gradient-to-br from-amber-400/20 to-yellow-500/10 rounded-xl border border-amber-400/20">
                <CalendarCheck className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            {/* Center: Month Navigation */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-surface/50 hover:bg-surface-hover border border-border/30 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <motion.div
                key={displayMonth.toISOString()}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-w-[90px] sm:min-w-[160px] text-center"
              >
                <span className="sm:hidden text-sm font-semibold text-foreground">
                  {format(displayMonth, "MMM yyyy")}
                </span>
                <span className="hidden sm:inline text-lg font-semibold text-foreground">
                  {format(displayMonth, "MMMM yyyy")}
                </span>
              </motion.div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-surface/50 hover:bg-surface-hover border border-border/30 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: Today Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="rounded-xl bg-surface/50 border-border/30 hover:bg-surface-hover hover:border-amber-400/30 transition-all text-xs sm:text-sm px-2 sm:px-3"
            >
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Today</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,520px)_1fr] gap-4 sm:gap-8">
          {/* Calendar Panel */}
          <motion.div
            key={displayMonth.toISOString()}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="bg-[hsl(240,5%,10%)] border-border/30 rounded-xl sm:rounded-2xl planner-shadow overflow-hidden">
              <CardContent className="p-3 sm:p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  month={displayMonth}
                  onMonthChange={setDisplayMonth}
                  className={cn("pointer-events-auto w-full")}
                  modifiers={{
                    completed: datesWithCompletedTasks,
                  }}
                  modifiersClassNames={{
                    completed: "calendar-completed-day",
                  }}
                />

                {/* Legend - scrollable on mobile */}
                <div className="mt-4 sm:mt-6 pt-3 sm:pt-5 border-t border-border/30 flex items-center gap-3 sm:gap-6 overflow-x-auto">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-sm shadow-amber-500/30" />
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ring-2 ring-primary/50" />
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/30 ring-1 ring-green-500/50" />
                    <span>Has tasks</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Selected Day Panel */}
          <Card className="bg-[hsl(240,5%,10%)] border-border/30 rounded-xl sm:rounded-2xl planner-shadow">
            <div className="p-4 sm:p-6 border-b border-border/30">
              <div className="flex items-center justify-between gap-2">
                <motion.div
                  key={selectedDate.toISOString()}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="min-w-0"
                >
                  <h2 className="text-base sm:text-xl font-semibold text-foreground truncate">
                    <span className="sm:hidden">{format(selectedDate, "EEE, MMM d")}</span>
                    <span className="hidden sm:inline">{format(selectedDate, "EEEE, MMMM d")}</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    {format(selectedDate, "yyyy")}
                  </p>
                </motion.div>
                <Badge
                  variant="outline"
                  className="bg-green-500/10 text-green-400 border-green-500/30 rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm whitespace-nowrap"
                >
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                  {tasksForSelectedDate.length}
                  <span className="hidden sm:inline"> completed</span>
                </Badge>
              </div>
            </div>

            <CardContent className="p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    {...fadeSlideUp}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <Loader2 className="w-8 h-8 text-amber-400/50 mb-4 animate-spin" />
                    <p className="text-muted-foreground">Loading tasks...</p>
                  </motion.div>
                ) : tasksForSelectedDate.length === 0 ? (
                  <motion.div
                    key="empty"
                    {...fadeSlideUp}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="p-4 bg-surface/50 rounded-2xl border border-border/30 mb-4">
                      <CheckCircle2 className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    <p className="text-foreground font-medium">No tasks completed</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
                      Select a highlighted date on the calendar to view completed tasks
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={`tasks-${selectedDate.toISOString()}`}
                    variants={staggerContainer}
                    initial="initial"
                    animate="animate"
                    className="space-y-4"
                  >
                    {/* Day Summary Section */}
                    <motion.div variants={taskItemVariant}>
                      <DaySummary
                        selectedDate={selectedDate}
                        onSummaryChange={setDaySummaryText}
                      />
                    </motion.div>

                    {/* Tasks List */}
                    <motion.div variants={taskItemVariant} className="space-y-3">
                      {tasksForSelectedDate.map((task, index) => (
                        <motion.div
                          key={task.id}
                          variants={taskItemVariant}
                          custom={index}
                          whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <CompletedTaskRow
                            task={task}
                            onSelect={handleSelectTask}
                          />
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Total Time Display */}
                    {totalTimeForDay > 0 && (
                      <motion.div
                        variants={taskItemVariant}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
                      >
                        <div className="flex items-center gap-2 text-amber-400">
                          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm font-medium">Total Time</span>
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-foreground">
                          {totalTimeForDay} min ({Math.floor(totalTimeForDay / 60)}h {totalTimeForDay % 60}m)
                        </span>
                      </motion.div>
                    )}

                    {/* Export PDF Button */}
                    <motion.div
                      variants={taskItemVariant}
                      className="pt-4 border-t border-border/30"
                    >
                      <Button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-400/90 to-yellow-500/90 text-primary-foreground font-medium hover:from-amber-400 hover:to-yellow-500 shadow-lg shadow-amber-500/20 transition-all"
                      >
                        {isExporting ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <FileDown className="w-4 h-4 mr-2" />
                        )}
                        Export Day as PDF
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Task Detail Drawer - with Daily Notes */}
      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setOpenFullscreen(false);
        }}
        initialFullscreen={openFullscreen}
        readOnly
        showDailyNotes
        selectedDate={selectedDate}
      />

      {/* Custom styles for calendar completed days */}
      <style>{`
        .calendar-completed-day {
          position: relative;
        }
        .calendar-completed-day::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: hsl(142, 76%, 46%);
          box-shadow: 0 0 6px hsl(142, 76%, 46%, 0.6);
        }
        .calendar-completed-day[aria-selected="true"]::after {
          background: hsl(0, 0%, 95%);
          box-shadow: 0 0 6px hsl(0, 0%, 95%, 0.6);
        }
      `}</style>
    </div>
  );
}
