"use client";

import { useEffect, useRef, useState } from "react";

const HOLD_MS = 2200;
const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

export default function WordRoll({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [widths, setWidths] = useState<number[]>([]);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const measure = () =>
      setWidths(wordRefs.current.map((el) => el?.offsetWidth ?? 0));
    measure();
    document.fonts.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [words]);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      HOLD_MS,
    );
    return () => clearInterval(id);
  }, [words.length]);

  const prev = (index - 1 + words.length) % words.length;

  return (
    <>
      <span className="sr-only">{words[0]}</span>
      <span
        aria-hidden="true"
        className={`inline-grid overflow-hidden whitespace-nowrap transition-[width] duration-500 ${EASE} motion-reduce:transition-none`}
        style={{ width: widths[index] ? `${widths[index]}px` : undefined }}
      >
        {words.map((word, i) => (
          <span
            key={word}
            ref={(el) => {
              wordRefs.current[i] = el;
            }}
            // Only the entering and exiting words animate; the rest reposition
            // instantly while off-screen so they never streak through the box.
            className={`col-start-1 row-start-1 w-max ${
              i === index || i === prev
                ? `transition-transform duration-500 ${EASE} motion-reduce:transition-none`
                : ""
            }`}
            style={{
              transform:
                i === index
                  ? "translateY(0)"
                  : i === prev
                    ? "translateY(-105%)"
                    : "translateY(105%)",
            }}
          >
            {word}
          </span>
        ))}
      </span>
    </>
  );
}
