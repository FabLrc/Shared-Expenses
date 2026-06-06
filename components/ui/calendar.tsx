"use client";

import { DayPicker } from "react-day-picker";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={fr}
      weekStartsOn={1}
      showOutsideDays
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col",
        month: "space-y-3",
        month_caption: "flex items-center justify-center relative h-8",
        caption_label: "text-sm font-medium capitalize",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
          "dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800",
          "transition-colors"
        ),
        button_next: cn(
          "flex h-8 w-8 items-center justify-center rounded-lg",
          "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
          "dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800",
          "transition-colors"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 text-center text-[0.75rem] font-normal text-zinc-400 dark:text-zinc-500 pb-1",
        week: "flex mt-1",
        day: "relative p-0 text-center",
        day_button: cn(
          "flex h-9 w-9 items-center justify-center rounded-lg text-sm",
          "text-zinc-700 dark:text-zinc-300",
          "hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        ),
        selected:
          "[&>button]:bg-zinc-900 [&>button]:text-white [&>button]:hover:bg-zinc-800 dark:[&>button]:bg-zinc-100 dark:[&>button]:text-zinc-900 dark:[&>button]:hover:bg-zinc-200",
        today:
          "[&>button:not([aria-selected])]:font-semibold [&>button:not([aria-selected])]:text-zinc-900 dark:[&>button:not([aria-selected])]:text-zinc-100",
        outside:
          "[&>button]:text-zinc-300 dark:[&>button]:text-zinc-600 [&>button]:pointer-events-none",
        disabled: "[&>button]:opacity-30 [&>button]:pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
