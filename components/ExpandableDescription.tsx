"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const descriptionId = useId();
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const checkOverflow = () => {
      if (element.scrollHeight > element.clientHeight + 1) {
        setCanExpand(true);
      }
    };

    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(element);

    return () => observer.disconnect();
  }, [text]);

  return (
    <div className="mt-1">
      <p
        ref={textRef}
        id={descriptionId}
        className={cn(
          "min-h-6 whitespace-pre-wrap text-[0.95rem] leading-6 text-foreground/80",
          !expanded && "line-clamp-1",
        )}
      >
        {text}
      </p>
      <div className="mt-1 h-5">
        {(canExpand || expanded) && (
          <button
            type="button"
            aria-controls={descriptionId}
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
            className="text-xs font-bold text-sccs-ember underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </div>
  );
}
