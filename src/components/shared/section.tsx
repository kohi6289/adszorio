import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-4 md:px-6 lg:px-8", className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, intro, platform }: { eyebrow?: string; title: string; intro?: React.ReactNode; platform?: string }) {
  return (
    <div data-platform={platform} className="border-b border-border">
      <Container className="py-12 md:py-16">
        {eyebrow && <p className="text-overline font-semibold text-accent uppercase">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-display-xl font-semibold text-balance">{title}</h1>
        {intro && <div className="mt-4 max-w-[60ch] text-lg leading-relaxed text-pretty text-fg-muted">{intro}</div>}
      </Container>
    </div>
  );
}
