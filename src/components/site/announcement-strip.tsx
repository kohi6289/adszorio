import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { SiteSettings } from "@/types/models";

export function AnnouncementStrip({ announcement }: { announcement: SiteSettings["announcement"] }) {
  if (!announcement?.text) return null;
  const body = (
    <>
      <span>{announcement.text}</span>
      {announcement.link && <ArrowRight aria-hidden className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </>
  );
  return (
    <div className="bg-fg text-bg">
      <div className="mx-auto flex max-w-[1200px] justify-center px-4 text-center text-[0.8125rem] font-medium">
        {announcement.link ? (
          <Link href={announcement.link} className="group inline-flex min-h-11 items-center gap-1.5 py-1.5 hover:underline">
            {body}
          </Link>
        ) : (
          <p className="inline-flex min-h-9 items-center py-1.5">{body}</p>
        )}
      </div>
    </div>
  );
}
