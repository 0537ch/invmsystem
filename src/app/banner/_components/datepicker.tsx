"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

interface DatePickerProps {
  value?: DateRange
  onChange: (date: DateRange | undefined) => void
  label?: string
}

export function DatePickerWithRange({ value, onChange, label = "Date Range" }: DatePickerProps) {
  const toDate = (date: Date | string | undefined): Date | undefined => {
    if (!date) return undefined;
    if (typeof date === 'string') {
      return new Date(date + 'T00:00:00');
    }
    return date;
  };

  const fromDate = toDate(value?.from);
  const toDateValue = toDate(value?.to);

  const validFromDate = fromDate && !isNaN(fromDate.getTime()) ? fromDate : undefined;
  const validToDate = toDateValue && !isNaN(toDateValue.getTime()) ? toDateValue : undefined;

  const selectedValue: DateRange | undefined = (validFromDate || validToDate) ? {
    from: validFromDate,
    to: validToDate,
  } : undefined;

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start px-2.5 font-normal"
          >
            <CalendarIcon className="mr-2 size-4" />
            {validFromDate ? (
              validToDate ? (
                <>
                  {format(validFromDate, "LLL dd, y")} -{" "}
                  {format(validToDate, "LLL dd, y")}
                </>
              ) : (
                format(validFromDate, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={validFromDate}
            selected={selectedValue}
            onSelect={onChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
    