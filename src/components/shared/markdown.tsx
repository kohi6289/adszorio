import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

/** Safe renderer for admin-written text. Input is escaped in renderMarkdown. */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[68ch] leading-relaxed text-fg-muted [&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-fg [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-fg [&_li]:mt-1.5 [&_p]:mt-4 [&_strong]:text-fg [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(source) }}
    />
  );
}
