import { cn } from "@/lib/utils";

/* Monogram grounds drawn from the SCCS dusk palette; picked per club so the
   grid feels varied without leaving the brand. */
const MONOGRAM_GRADIENTS = [
  "from-[#31425f] to-[#5a729c]",
  "from-[#1d2b47] to-[#31425f]",
  "from-[#bf5f2c] to-[#e8804a]",
  "from-[#3d5177] to-[#7189b3]",
];

const monogramGradientCache = new Map<string, string>();

function monogramGradient(name: string) {
  const cached = monogramGradientCache.get(name);
  if (cached !== undefined) return cached;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const gradient =
    MONOGRAM_GRADIENTS[Math.abs(hash) % MONOGRAM_GRADIENTS.length];
  monogramGradientCache.set(name, gradient);
  return gradient;
}

export default function ClubMonogram({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-xl bg-gradient-to-br font-heading font-bold text-white shadow-sm",
        monogramGradient(name),
        className
      )}
      aria-hidden="true"
    >
      {name.charAt(0)}
    </div>
  );
}
