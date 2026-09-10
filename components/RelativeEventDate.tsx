"use client";

import { useEffect, useState } from "react";
import { campusNow, formatRelativeEventDate } from "@/lib/events";

export default function RelativeEventDate({
  eventDate,
  initialDate,
}: {
  eventDate: string;
  initialDate: string;
}) {
  const [currentDate, setCurrentDate] = useState(initialDate);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentDate(campusNow().date);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <time dateTime={eventDate}>{formatRelativeEventDate(eventDate, currentDate)}</time>
  );
}
