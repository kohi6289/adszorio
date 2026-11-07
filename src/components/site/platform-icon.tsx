import { AtSign, Play, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Neutral glyphs rather than copies of platform logos (trademark-safe). Admin-added platforms get a generic icon.
const ICONS: Record<string, typeof Play> = { youtube: Play, instagram: AtSign };

export function PlatformIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Sparkles;
  return (
    <span
      aria-hidden
      data-platform={slug}
      className={cn("grid size-9 shrink-0 place-items-center rounded-md bg-accent text-white [background-image:var(--accent-gradient)]", className)}
    >
      <Icon className="size-[1.125rem]" strokeWidth={2.25} />
    </span>
  );
}
