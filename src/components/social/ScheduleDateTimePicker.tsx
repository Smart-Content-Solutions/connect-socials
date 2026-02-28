import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Check, Clock3, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduleDateTimePickerProps {
  value: string;
  onChange: (nextValue: string) => void;
  minDateTime?: Date;
}

const pad = (value: number) => String(value).padStart(2, "0");
const HOURS_12 = Array.from({ length: 12 }, (_, index) => pad(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) => pad(index));
const PERIODS = ["AM", "PM"] as const;

const toLocalDateTimeInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const parseLocalDateTimeInputValue = (value: string): Date | null => {
  if (!value) return null;

  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  if ([year, month, day, hours, minutes].some(Number.isNaN)) return null;

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

const formatPreviewDateTime = (value: string) => {
  const parsed = parseLocalDateTimeInputValue(value);
  if (!parsed) return "Select date & time";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

const getTimeParts = (time24: string) => {
  const [hoursRaw, minutesRaw] = time24.split(":");
  const hours24 = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (Number.isNaN(hours24) || Number.isNaN(minutes)) {
    return { hour12: "09", minute: "00", period: "AM" as const };
  }

  const period = hours24 >= 12 ? "PM" : "AM";
  const normalizedHour = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return { hour12: pad(normalizedHour), minute: pad(minutes), period };
};

const to24HourTime = (hour12Value: string, minuteValue: string, period: "AM" | "PM") => {
  const hour12 = Number(hour12Value);
  const minute = Number(minuteValue);

  if (Number.isNaN(hour12) || Number.isNaN(minute)) return "09:00";

  let hour24 = hour12 % 12;
  if (period === "PM") hour24 += 12;

  return `${pad(hour24)}:${pad(minute)}`;
};

export function ScheduleDateTimePicker({
  value,
  onChange,
  minDateTime,
}: ScheduleDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const [draftDate, setDraftDate] = useState<Date | undefined>(undefined);
  const [draftTime, setDraftTime] = useState("09:00");

  useEffect(() => {
    if (!open) return;

    const parsed = parseLocalDateTimeInputValue(value);
    if (parsed) {
      setDraftDate(parsed);
      setDraftTime(`${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`);
      return;
    }

    const baseline = minDateTime ?? new Date();
    setDraftDate(baseline);
    setDraftTime(`${pad(baseline.getHours())}:${pad(baseline.getMinutes())}`);
  }, [open, value, minDateTime]);

  const minDate = minDateTime ?? new Date();
  const { hour12, minute, period } = useMemo(() => getTimeParts(draftTime), [draftTime]);

  const combinedDraft = useMemo(() => {
    if (!draftDate || !draftTime) return null;

    const [hoursRaw, minutesRaw] = draftTime.split(":");
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

    return new Date(
      draftDate.getFullYear(),
      draftDate.getMonth(),
      draftDate.getDate(),
      hours,
      minutes,
      0,
      0,
    );
  }, [draftDate, draftTime]);

  const isPastSelection = Boolean(combinedDraft && combinedDraft < minDate);
  const canConfirm = Boolean(combinedDraft && !isPastSelection);
  const selectedTimeLabel = `${hour12}:${minute} ${period}`;

  const handleConfirm = () => {
    if (!combinedDraft || isPastSelection) return;
    onChange(toLocalDateTimeInputValue(combinedDraft));
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setOpen(false);
  };

  const updateTime = (
    part: "hour" | "minute" | "period",
    nextValue: string,
  ) => {
    const current = getTimeParts(draftTime);
    if (part === "hour") {
      setDraftTime(to24HourTime(nextValue, current.minute, current.period));
      return;
    }

    if (part === "minute") {
      setDraftTime(to24HourTime(current.hour12, nextValue, current.period));
      return;
    }

    const nextPeriod = nextValue === "PM" ? "PM" : "AM";
    setDraftTime(to24HourTime(current.hour12, current.minute, nextPeriod));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full rounded-xl border border-white/10 bg-[#3B3C3E]/50 p-3 text-left text-[#D6D7D8] transition-all duration-300 hover:border-[#E1C37A]/40 focus:outline-none focus:ring-2 focus:ring-[#E1C37A]/25"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-[#A9AAAC]">Scheduled for</p>
              <p className="truncate text-sm font-medium text-[#D6D7D8]">
                {formatPreviewDateTime(value)}
              </p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E1C37A]/30 bg-[#E1C37A]/10 shadow-[0_0_20px_rgba(225,195,122,0.18)]">
              <CalendarClock className="h-4 w-4 text-[#E1C37A]" />
            </span>
          </div>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={10}
        className="w-[min(92vw,24rem)] rounded-2xl border border-[#E1C37A]/35 bg-[#202125]/95 p-0 shadow-[0_18px_40px_rgba(0,0,0,0.45),0_0_35px_rgba(225,195,122,0.12)] backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="p-4 pt-3"
        >
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.06, delayChildren: 0.03 },
              },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
              className="mb-3 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-[#E1C37A]" />
                <p className="text-sm font-semibold text-[#F1F1F2]">Schedule post</p>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-[#E1C37A]/30 bg-[#E1C37A]/10 px-2.5 py-1 text-[11px] font-medium text-[#EFD99F]">
                <Sparkles className="h-3 w-3" />
                {selectedTimeLabel}
              </div>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10, scale: 0.98 },
                show: { opacity: 1, y: 0, scale: 1 },
              }}
              className="rounded-xl border border-white/10 bg-[#2B2D31]/70"
            >
              <Calendar
                mode="single"
                selected={draftDate}
                onSelect={setDraftDate}
                disabled={{ before: minDate }}
                initialFocus
                className="rounded-xl p-3"
              />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                show: { opacity: 1, y: 0 },
              }}
              className="mt-3 rounded-xl border border-white/10 bg-[#2B2D31]/70 p-3"
            >
              <label className="mb-2 flex items-center gap-2 text-xs font-medium text-[#A9AAAC]">
                <Clock3 className="h-3.5 w-3.5" />
                Select time
              </label>

              <div className="grid grid-cols-3 gap-2">
                <Select value={hour12} onValueChange={(next) => updateTime("hour", next)}>
                  <SelectTrigger className="h-10 rounded-lg border-white/10 bg-[#1F2023] text-[#D6D7D8] focus:ring-[#E1C37A]/35">
                    <SelectValue placeholder="Hour" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1F2023] text-[#D6D7D8]">
                    {HOURS_12.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={minute} onValueChange={(next) => updateTime("minute", next)}>
                  <SelectTrigger className="h-10 rounded-lg border-white/10 bg-[#1F2023] text-[#D6D7D8] focus:ring-[#E1C37A]/35">
                    <SelectValue placeholder="Min" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1F2023] text-[#D6D7D8]">
                    {MINUTES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={period} onValueChange={(next) => updateTime("period", next)}>
                  <SelectTrigger className="h-10 rounded-lg border-white/10 bg-[#1F2023] text-[#D6D7D8] focus:ring-[#E1C37A]/35">
                    <SelectValue placeholder="AM/PM" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#1F2023] text-[#D6D7D8]">
                    {PERIODS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isPastSelection && (
                <p className="mt-2 text-xs text-red-300">
                  Please choose a future date and time.
                </p>
              )}
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0 },
              }}
              className="mt-4 flex items-center justify-between gap-2"
            >
              <Button
                type="button"
                variant="ghost"
                className="h-9 px-3 text-[#A9AAAC] hover:text-[#F1F1F2]"
                onClick={handleClear}
              >
                Clear
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 border-white/15 bg-transparent text-[#D6D7D8] hover:bg-white/5"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-9 bg-gradient-to-r from-[#E1C37A] to-[#B6934C] font-semibold text-[#1A1A1C] hover:opacity-95"
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                >
                  <Check className="h-4 w-4" />
                  Confirm
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
