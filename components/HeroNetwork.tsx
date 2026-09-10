"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export type CrowdNode = {
  label: string;
  tag: string;
  count: number;
};

const SPHERE_FILL = 0.82; // sphere radius as a fraction of the half-extent
const ROTATION_SPEED = 0.1; // radians / second
const TILT = -0.42;
const PERSPECTIVE = 3.2;
const HOVER_RADIUS = 18;

type ActiveCard = {
  title: string;
  sub: string;
};

type Node3D = {
  x: number;
  y: number;
  z: number;
  size: number; // base radius, px at reference scale
  tone: number; // 0..1, varies the grey of the ball
  phase: number;
  jitter: number;
};

/**
 * The campus as a small society: a slowly turning 3D cluster of shaded
 * spheres joined by faint linkwork. Every node is a kind of person on
 * campus; hovering names them, clicking meets them. The orange one is you.
 */
export default function HeroNetwork({
  nodes: crowd,
  className,
}: {
  nodes: CrowdNode[];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ActiveCard | null>(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    const card = cardRef.current;
    if (!canvas || !wrapper || !card || crowd.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // One node per crowd descriptor, plus one for you, spread on a
    // fibonacci sphere with radial noise so it reads as a crowd, not a
    // bead ornament.
    const n = crowd.length + 1;
    const youIndex = Math.floor(n * 0.4);
    const golden = Math.PI * (3 - Math.sqrt(5));
    const nodes: Node3D[] = Array.from({ length: n }, (_, i) => {
      const yUnit = 1 - (2 * (i + 0.5)) / n;
      const rUnit = Math.sqrt(1 - yUnit * yUnit);
      const theta = golden * i;
      const noise = 0.78 + Math.random() * 0.34;
      return {
        x: Math.cos(theta) * rUnit * noise,
        y: yUnit * noise,
        z: Math.sin(theta) * rUnit * noise,
        size: i === youIndex ? 6.5 : 3 + Math.pow(Math.random(), 1.8) * 6,
        tone: Math.random(),
        phase: Math.random() * Math.PI * 2,
        jitter: 0.015 + Math.random() * 0.02,
      };
    });
    // Crowd entry for a node: every index except you's.
    const entryAt = (i: number): CrowdNode | null =>
      i === youIndex ? null : crowd[i < youIndex ? i : i - 1];

    // Static linkwork: each node reaches its nearest neighbours in 3D, so
    // the web turns with the globe instead of flickering.
    const edges: Array<[number, number]> = [];
    const seen = new Set<string>();
    for (let i = 0; i < n; i++) {
      const dists: Array<[number, number]> = [];
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        dists.push([dx * dx + dy * dy + dz * dz, j]);
      }
      dists.sort((a, b) => a[0] - b[0]);
      const links = 2 + (Math.random() < 0.25 ? 1 : 0);
      for (let k = 0; k < links && k < dists.length; k++) {
        const j = dists[k][1];
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([i, j]);
        }
      }
    }

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
    let hovered = -1;
    let lastPointerType = "mouse";
    let armedIndex = -1; // touch: first tap names, second tap navigates
    let rotation = Math.random() * Math.PI * 2;
    let speed = ROTATION_SPEED;
    let lastT = 0;

    const sx = new Float32Array(n);
    const sy = new Float32Array(n);
    const sr = new Float32Array(n);
    const sz = new Float32Array(n);
    const order: number[] = Array.from({ length: n }, (_, i) => i);

    const cosB = Math.cos(TILT);
    const sinB = Math.sin(TILT);

    function project(t: number) {
      const cx = width / 2;
      const cy = height / 2;
      const R = (Math.min(width, height) / 2) * SPHERE_FILL;
      const pxScale = Math.min(width, height) / 420;
      const cosA = Math.cos(rotation);
      const sinA = Math.sin(rotation);

      for (let i = 0; i < n; i++) {
        const node = nodes[i];
        // A breath of individual drift keeps the crowd alive.
        const jx = node.x + node.jitter * Math.sin(t * 0.7 + node.phase);
        const jy = node.y + node.jitter * Math.cos(t * 0.6 + node.phase * 1.7);
        const jz = node.z + node.jitter * Math.sin(t * 0.8 + node.phase * 2.3);

        const x1 = jx * cosA + jz * sinA;
        const z1 = -jx * sinA + jz * cosA;
        const y2 = jy * cosB - z1 * sinB;
        const z2 = jy * sinB + z1 * cosB;

        const s = PERSPECTIVE / (PERSPECTIVE - z2);
        sx[i] = cx + x1 * R * s;
        sy[i] = cy + y2 * R * s;
        sr[i] = Math.max(1.4, node.size * s * pxScale);
        sz[i] = z2;
      }
      order.sort((a, b) => sz[a] - sz[b]);
    }

    function pickNode(): number {
      let best = -1;
      let bestDist = HOVER_RADIUS;
      for (let i = 0; i < n; i++) {
        const dist =
          Math.hypot(sx[i] - pointer.x, sy[i] - pointer.y) - sr[i];
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      return best;
    }

    function cardFor(i: number): ActiveCard {
      if (i === youIndex) {
        return {
          title: "this one's you",
          sub: "no clubs yet · click to claim your spot",
        };
      }
      const entry = entryAt(i)!;
      return {
        title: entry.label,
        sub: `${entry.count} ${entry.count === 1 ? "club" : "clubs"} · click to meet them`,
      };
    }

    function syncHover() {
      const previous = hovered;
      hovered = pointer.x > -1e3 ? pickNode() : -1;
      if (hovered !== previous) {
        setActive(hovered >= 0 ? cardFor(hovered) : null);
        if (hovered !== armedIndex) armedIndex = -1;
      }
    }

    function placeCard() {
      if (!card || hovered < 0) return;
      const cardW = card.offsetWidth;
      const cardH = card.offsetHeight;
      const pad = 8;
      let x = sx[hovered] + sr[hovered] + 12;
      let y = sy[hovered] - cardH / 2;
      if (x + cardW + pad > width) x = sx[hovered] - sr[hovered] - cardW - 12;
      y = Math.max(pad, Math.min(y, height - cardH - pad));
      card.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }

    function ballFill(i: number, r: number) {
      if (!ctx) return "#888";
      const node = nodes[i];
      const depth = (sz[i] + 1) / 2; // 0 back … 1 front
      const grad = ctx.createRadialGradient(
        sx[i] - r * 0.35,
        sy[i] - r * 0.4,
        r * 0.12,
        sx[i],
        sy[i],
        r * 1.05,
      );
      if (i === youIndex) {
        grad.addColorStop(0, "#ffc9a3");
        grad.addColorStop(0.55, "#ff8f53");
        grad.addColorStop(1, "#d4661f");
        return grad;
      }
      // Cool navy-greys; deeper nodes flatten toward the ground.
      const light = 205 - node.tone * 26 - depth * 12;
      const dark = 96 - node.tone * 22;
      const fade = 0.45 + depth * 0.55;
      grad.addColorStop(
        0,
        `rgba(${light - 12}, ${light - 5}, ${light}, ${fade})`,
      );
      grad.addColorStop(
        1,
        `rgba(${dark}, ${dark + 8}, ${dark + 24}, ${fade})`,
      );
      return grad;
    }

    function draw(t: number) {
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      project(t);
      syncHover();

      // Linkwork first, faint and depth-weighted.
      ctx.lineWidth = 1;
      for (const [i, j] of edges) {
        const depth = ((sz[i] + sz[j]) / 2 + 1) / 2;
        const alpha = 0.05 + depth * 0.16;
        ctx.strokeStyle = `rgba(49, 66, 95, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(sx[i], sy[i]);
        ctx.lineTo(sx[j], sy[j]);
        ctx.stroke();
      }

      // Balls, back to front.
      for (const i of order) {
        const r = i === hovered ? sr[i] * 1.25 : sr[i];

        if (i === youIndex) {
          // A soft halo so you can always find yourself.
          const glow = ctx.createRadialGradient(
            sx[i],
            sy[i],
            r * 0.5,
            sx[i],
            sy[i],
            r * 3.4,
          );
          glow.addColorStop(0, "rgba(255, 143, 83, 0.32)");
          glow.addColorStop(1, "rgba(255, 143, 83, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], r * 3.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = ballFill(i, r);
        ctx.beginPath();
        ctx.arc(sx[i], sy[i], r, 0, Math.PI * 2);
        ctx.fill();

        if (i === hovered) {
          ctx.strokeStyle = "rgba(20, 28, 42, 0.75)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sx[i], sy[i], r + 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.lineWidth = 1;
        }
      }

      // Label you.
      ctx.fillStyle = "#b5501a";
      ctx.font =
        '600 12px ui-sans-serif, -apple-system, "Helvetica Neue", Arial, sans-serif';
      ctx.fillText("you", sx[youIndex] + sr[youIndex] + 6, sy[youIndex] + 4);

      placeCard();
      if (canvas) canvas.style.cursor = hovered >= 0 ? "pointer" : "default";
    }

    function frame(timeMs: number) {
      const t = timeMs / 1000;
      const dt = lastT ? Math.min(t - lastT, 0.1) : 0;
      lastT = t;
      // Ease the spin down while a card is open so it stays readable.
      const target = hovered >= 0 ? ROTATION_SPEED * 0.15 : ROTATION_SPEED;
      speed += (target - speed) * Math.min(1, dt * 4);
      rotation += speed * dt;
      draw(t);
    }

    let raf = 0;
    let running = false;
    function loop(timeMs: number) {
      frame(timeMs);
      if (running) raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reducedMotion) return;
      running = true;
      lastT = 0;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    function setPointerFromEvent(event: PointerEvent | MouseEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    }

    function onPointerMove(event: PointerEvent) {
      lastPointerType = event.pointerType || "mouse";
      setPointerFromEvent(event);
      if (reducedMotion) draw(4);
    }
    function onPointerLeave() {
      pointer.x = -1e4;
      pointer.y = -1e4;
      if (reducedMotion) draw(4);
    }
    function onClick(event: MouseEvent) {
      setPointerFromEvent(event);
      syncHover();
      if (hovered < 0) return;
      // On touch, the first tap names the node; the second one commits.
      if (lastPointerType === "touch" && armedIndex !== hovered) {
        armedIndex = hovered;
        return;
      }
      if (hovered === youIndex) {
        router.push("/login");
        return;
      }
      const entry = entryAt(hovered);
      if (entry) router.push(`/clubs?tags=${encodeURIComponent(entry.tag)}`);
    }

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (reducedMotion) draw(4);
    });
    resizeObserver.observe(canvas);
    resize();

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("click", onClick);

    let intersectionObserver: IntersectionObserver | null = null;
    if (reducedMotion) {
      // One still frame; hover and click still answer.
      draw(4);
    } else {
      // Only animate while the figure is actually on screen.
      intersectionObserver = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) start();
        else stop();
      });
      intersectionObserver.observe(canvas);
    }

    return () => {
      stop();
      intersectionObserver?.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, [crowd, router]);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
      {/* Who's behind the hovered node */}
      <div
        ref={cardRef}
        className={cn(
          "pointer-events-none absolute left-0 top-0 max-w-60 border border-border bg-card px-4 py-3 transition-opacity duration-150",
          active ? "opacity-100" : "opacity-0",
        )}
      >
        {active && (
          <>
            <p className="font-heading text-lg font-medium italic leading-snug text-foreground">
              {active.title}
            </p>
            <p className="mt-1.5 text-[0.68rem] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
              {active.sub}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
