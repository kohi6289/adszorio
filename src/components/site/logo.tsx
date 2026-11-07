import Link from "next/link";

export function Logo({ name }: { name: string }) {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center gap-2 font-display text-xl font-semibold tracking-tight text-fg"
      aria-label={`${name} home`}
    >
      <span aria-hidden className="grid size-7 place-items-center rounded-sm bg-fg text-bg">
        {/* Monogram: an upward step, i.e. growth, drawn from two strokes */}
        <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12.5 L8 3.5 L13 12.5" />
          <path d="M5.6 9 H10.4" className="stroke-brand" />
        </svg>
      </span>
      {name}
    </Link>
  );
}
