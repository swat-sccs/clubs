"use client";

import { useEffect, useRef } from "react";

const INK = "26, 31, 46";
const PAPER = "#faf6ef";
const ORANGE = "#e8804a";
const ORANGE_DEEP = "#a84a12";

const NODE_COUNT = 64;
const LINK_DISTANCE = 0.46; // in unit space
const BREATH_SPEED = 0.4;
const BREATH_DEPTH = 0.12;
const ROTATION_SPEED = 0.035; // radians / second, whole constellation
const MAX_PULSES = 10;
const POINTER_REACH = 140;

type NodeSeed = {
  angle: number;
  radius: number;
  depth: number; // 0..1; far layers are smaller, fainter, calmer
  phase: number;
  wanderX: number;
  wanderY: number;
  speed: number;
  size: number; // draw radius, px
  open: boolean; // open circles vs solid dots, like print diagram notation
};

type Pulse = {
  from: number;
  to: number;
  start: number;
  duration: number;
  orange: boolean;
};

function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}

/**
 * Fig. 1: a deep, slowly rotating constellation. Nodes drift on three
 * depth layers, the whole web breathes, and signals travel along the
 * edges. The one orange node is "you"; the cursor joins the web.
 */
export default function HeroNetwork({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const DEPTHS = [0.5, 0.75, 1];
    const seeds: NodeSeed[] = Array.from({ length: NODE_COUNT }, (_, i) => {
      const depth = DEPTHS[i % DEPTHS.length];
      return {
        angle: Math.random() * Math.PI * 2,
        radius: 0.22 + 0.78 * Math.sqrt(Math.random()) + Math.random() * 0.08,
        depth,
        phase: Math.random() * Math.PI * 2,
        wanderX: (0.04 + Math.random() * 0.07) * depth,
        wanderY: (0.04 + Math.random() * 0.07) * depth,
        speed: 0.5 + Math.random() * 0.55,
        size: (1.6 + depth * 2.6) * (0.85 + Math.random() * 0.4),
        open: depth > 0.6 && Math.random() < 0.28,
      };
    });
    // "You" sits on the near layer, close to the heart of the web.
    const youIndex = seeds.findIndex((s) => s.depth === 1);
    seeds[youIndex].radius = 0.4;

    const pulses: Pulse[] = [];
    let lastSpawn = 0;

    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const pointer = { x: -1e4, y: -1e4 };
    function onPointerMove(event: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    }
    function onPointerLeave() {
      pointer.x = -1e4;
      pointer.y = -1e4;
    }

    const xs = new Float32Array(NODE_COUNT);
    const ys = new Float32Array(NODE_COUNT);

    function positions(t: number) {
      const cx = width / 2;
      const cy = height / 2;
      const scale = (Math.min(width, height) / 2) * 0.86;
      const rot = t * ROTATION_SPEED;

      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        // Layers breathe slightly out of phase — the web never holds still.
        const breath =
          1 + BREATH_DEPTH * Math.sin(t * BREATH_SPEED + s.depth * 1.4);
        const r = s.radius * breath;
        const a = s.angle + rot * (0.6 + s.depth * 0.4);
        let x =
          cx +
          scale *
            (Math.cos(a) * r + s.wanderX * Math.sin(t * s.speed + s.phase));
        let y =
          cy +
          scale *
            (Math.sin(a) * r +
              s.wanderY * Math.cos(t * s.speed * 0.85 + s.phase * 1.7));

        // The cursor gathers the web toward itself — you join, it reknits.
        const dx = pointer.x - x;
        const dy = pointer.y - y;
        const distSq = dx * dx + dy * dy;
        if (distSq < POINTER_REACH * POINTER_REACH && distSq > 1) {
          const dist = Math.sqrt(distSq);
          const pull = ((POINTER_REACH - dist) / POINTER_REACH) * 9 * s.depth;
          x += (dx / dist) * pull;
          y += (dy / dist) * pull;
        }
        xs[i] = x;
        ys[i] = y;
      }
    }

    function nearestNode(px: number, py: number) {
      let best = 0;
      let bestSq = Infinity;
      for (let i = 0; i < NODE_COUNT; i++) {
        const dx = xs[i] - px;
        const dy = ys[i] - py;
        const d = dx * dx + dy * dy;
        if (d < bestSq) {
          bestSq = d;
          best = i;
        }
      }
      return best;
    }

    function spawnPulse(t: number, from?: number) {
      if (pulses.length >= MAX_PULSES) return;
      const scale = (Math.min(width, height) / 2) * 0.86;
      const linkDist = LINK_DISTANCE * scale;
      // Some conversations start with you.
      const i =
        from ??
        (Math.random() < 0.25
          ? youIndex
          : Math.floor(Math.random() * NODE_COUNT));
      for (let attempt = 0; attempt < 14; attempt++) {
        const j = Math.floor(Math.random() * NODE_COUNT);
        if (j === i) continue;
        const dist = Math.hypot(xs[i] - xs[j], ys[i] - ys[j]);
        if (dist < linkDist) {
          pulses.push({
            from: i,
            to: j,
            start: t,
            duration: 0.9 + Math.random() * 0.9,
            orange: i === youIndex || j === youIndex,
          });
          return;
        }
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      // A tap ripples outward: the nearest node hails its neighbors.
      const origin = nearestNode(px, py);
      const now = performance.now() / 1000;
      for (let k = 0; k < 5; k++) spawnPulse(now, origin);
    }

    function draw(t: number) {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      positions(t);

      const scale = (Math.min(width, height) / 2) * 0.86;
      const linkDist = LINK_DISTANCE * scale;

      // Edges — hairlines, weighted by the deeper of the two layers.
      ctx.lineWidth = 1;
      for (let i = 0; i < seeds.length; i++) {
        for (let j = i + 1; j < seeds.length; j++) {
          const dx = xs[i] - xs[j];
          const dy = ys[i] - ys[j];
          const dist = Math.hypot(dx, dy);
          if (dist >= linkDist) continue;
          const layer = Math.min(seeds[i].depth, seeds[j].depth);
          const alpha = (1 - dist / linkDist) * 0.3 * layer;
          ctx.strokeStyle = `rgba(${INK}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(xs[i], ys[i]);
          ctx.lineTo(xs[j], ys[j]);
          ctx.stroke();
        }
      }

      // The cursor is a member too: hairlines reach out to meet it.
      if (pointer.x > -1e3) {
        for (let i = 0; i < seeds.length; i++) {
          const dist = Math.hypot(xs[i] - pointer.x, ys[i] - pointer.y);
          if (dist >= POINTER_REACH) continue;
          const alpha = (1 - dist / POINTER_REACH) * 0.3;
          ctx.strokeStyle = `rgba(${INK}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(xs[i], ys[i]);
          ctx.stroke();
        }
      }

      // Signals traveling the web.
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        const progress = (t - pulse.start) / pulse.duration;
        if (progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }
        const eased = easeInOut(progress);
        const px = xs[pulse.from] + (xs[pulse.to] - xs[pulse.from]) * eased;
        const py = ys[pulse.from] + (ys[pulse.to] - ys[pulse.from]) * eased;
        const fade = Math.sin(progress * Math.PI); // in, then out
        ctx.fillStyle = pulse.orange
          ? ORANGE
          : `rgba(${INK}, ${(0.85 * fade).toFixed(3)})`;
        ctx.globalAlpha = pulse.orange ? fade : 1;
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Nodes, sized by depth, each gently swelling on its own beat. A paper
      // halo punches every node out of the linework so the web stays crisp.
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        if (i === youIndex) continue;
        const r = s.size * (1 + 0.12 * Math.sin(t * 0.9 + s.phase * 3));

        ctx.fillStyle = PAPER;
        ctx.beginPath();
        ctx.arc(xs[i], ys[i], r + 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (s.open) {
          ctx.strokeStyle = `rgba(${INK}, ${(0.45 + s.depth * 0.35).toFixed(3)})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(xs[i], ys[i], r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
        } else {
          ctx.fillStyle = `rgba(${INK}, ${(0.35 + s.depth * 0.5).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(xs[i], ys[i], r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // You — the one orange point in the ink.
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.arc(xs[youIndex], ys[youIndex], 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ORANGE;
      ctx.beginPath();
      ctx.arc(xs[youIndex], ys[youIndex], 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ORANGE_DEEP;
      ctx.font =
        '600 12px ui-sans-serif, -apple-system, "Helvetica Neue", Arial, sans-serif';
      ctx.fillText("you", xs[youIndex] + 11, ys[youIndex] + 4);

      // Keep conversations flowing.
      if (t - lastSpawn > 0.45) {
        lastSpawn = t;
        spawnPulse(t);
      }
    }

    let raf = 0;
    let running = false;
    function loop(timeMs: number) {
      draw(timeMs / 1000);
      if (running) raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reducedMotion) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw(4);
    });
    resizeObserver.observe(canvas);
    resize();

    if (reducedMotion) {
      // A single considered frame, no motion.
      draw(4);
      return () => resizeObserver.disconnect();
    }

    // Only animate while the figure is actually on screen.
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    });
    intersectionObserver.observe(canvas);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);

    return () => {
      stop();
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className={className} aria-hidden="true" />
  );
}
