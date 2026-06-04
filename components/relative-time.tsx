"use client";

import { useEffect, useState } from "react";
import { formatRelativeTime } from "@/lib/format-media";

type RelativeTimeProps = {
  date: string;
  className?: string;
};

/** Updates periodically so "Just now" advances to "1 min ago", etc. */
export function RelativeTime({ date, className }: RelativeTimeProps) {
  const [label, setLabel] = useState(() => formatRelativeTime(date));

  useEffect(() => {
    setLabel(formatRelativeTime(date));
    const id = window.setInterval(() => setLabel(formatRelativeTime(date)), 30_000);
    return () => window.clearInterval(id);
  }, [date]);

  if (!label) return null;
  return <span className={className}>{label}</span>;
}
