import Image from "next/image";
import ClubMonogram from "@/components/ClubMonogram";
import { cn } from "@/lib/utils";

export default function ClubAvatar({
  id,
  name,
  hasLogo,
  className,
}: {
  id: string;
  name: string;
  hasLogo: boolean;
  className?: string;
}) {
  if (!hasLogo) return <ClubMonogram name={name} className={className} />;

  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm",
        className,
      )}
    >
      <Image
        src={`/api/media/clubs/${id}`}
        alt={`${name} logo`}
        fill
        unoptimized
        sizes="64px"
        className="object-cover"
      />
    </span>
  );
}
