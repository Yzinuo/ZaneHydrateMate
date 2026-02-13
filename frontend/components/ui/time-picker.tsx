"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  value: string; // "HH:mm" (24-hour format)
  onChange: (value: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  // Parse initial value
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: "12", minute: "00", ampm: "AM" };
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr;
    const ampm = h >= 12 ? "PM" : "AM";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return { hour: h.toString(), minute: m, ampm };
  };

  const [time, setTime] = React.useState(() => parseTime(value));

  React.useEffect(() => {
    setTime(parseTime(value));
  }, [value]);

  const updateTime = (newTime: { hour: string; minute: string; ampm: string }) => {
    setTime(newTime);
    let h = parseInt(newTime.hour, 10);
    if (newTime.ampm === "PM" && h < 12) h += 12;
    if (newTime.ampm === "AM" && h === 12) h = 0;
    const timeStr = `${h.toString().padStart(2, '0')}:${newTime.minute}`;
    onChange(timeStr);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-[140px] justify-start text-left font-normal", !value && "text-muted-foreground", className)}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? (
            <span>
              {time.hour}:{time.minute} {time.ampm}
            </span>
          ) : (
            <span>Pick a time</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex items-center gap-2">
          <Select
            value={time.hour}
            onValueChange={(v) => updateTime({ ...time, hour: v })}
          >
            <SelectTrigger className="w-[62px]">
              <SelectValue placeholder="Hour" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const h = i + 1;
                return (
                  <SelectItem key={h} value={h.toString()}>
                    {h.toString().padStart(2, "0")}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">:</span>

          <Select
            value={time.minute}
            onValueChange={(v) => updateTime({ ...time, minute: v })}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="Minute" />
            </SelectTrigger>
            <SelectContent>
              {["00", "15", "30", "45"].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={time.ampm}
            onValueChange={(v) => updateTime({ ...time, ampm: v })}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  )
}
