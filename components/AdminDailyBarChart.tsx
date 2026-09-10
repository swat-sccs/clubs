"use client";

import { useState } from "react";
import type { DailyActivityPoint } from "@/lib/admin-analytics";

export default function AdminDailyBarChart({
  title,
  metric,
  noun,
  color,
  data,
  rangeDays,
}: {
  title: string;
  metric: "posts" | "rsvps";
  noun: string;
  color: string;
  data: DailyActivityPoint[];
  rangeDays: number;
}) {
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const maximum = Math.max(0, ...data.map((point) => point[metric]));
  const midpoint = data.at(Math.floor(data.length / 2))?.label ?? "";
  const activePoint = data.find((point) => point.date === activeDate) ?? null;
  const activeCount = activePoint?.[metric] ?? 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <span className="text-xs text-muted-foreground">
          {activePoint
            ? `${activePoint.label}: ${activeCount} ${noun}${activeCount === 1 ? "" : "s"}`
            : `Daily high: ${maximum}`}
        </span>
      </div>
      <div
        role="group"
        aria-label={`${title} by day over the last ${rangeDays} days. Highest daily value: ${maximum}.`}
        className="relative"
        onMouseLeave={() => setActiveDate(null)}
      >
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/70" />
        {activePoint && (
          <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-background shadow-lg">
            {activePoint.label}: {activeCount} {noun}{activeCount === 1 ? "" : "s"}
          </div>
        )}
        <div
          className="relative flex h-28 items-end border-b border-border"
          style={{ columnGap: data.length > 60 ? 1 : data.length > 30 ? 2 : 4 }}
        >
          {data.map((point) => {
            const count = point[metric];
            const height = maximum === 0 ? 0 : Math.max(4, (count / maximum) * 108);
            return (
              <span
                key={point.date}
                tabIndex={0}
                aria-label={`${point.label}: ${count} ${noun}${count === 1 ? "" : "s"}`}
                onMouseEnter={() => setActiveDate(point.date)}
                onFocus={() => setActiveDate(point.date)}
                onBlur={() => setActiveDate(null)}
                className="group flex h-full min-w-px flex-1 cursor-crosshair items-end outline-none"
              >
                <span
                  aria-hidden="true"
                  className="w-full rounded-t-sm transition-opacity group-hover:opacity-70 group-focus:opacity-70"
                  style={{ height, backgroundColor: color }}
                />
              </span>
            );
          })}
        </div>
        {maximum === 0 && !activePoint && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No activity in this period
          </p>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[0.7rem] text-muted-foreground">
        <span>{data.at(0)?.label}</span>
        <span>{midpoint}</span>
        <span>{data.at(-1)?.label}</span>
      </div>
    </div>
  );
}
