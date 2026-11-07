"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { ContactChannel } from "@/lib/contact";
import { ContactMenu } from "./contact-menu";

/** Desktop: floating contact button. Mobile: sticky bottom bar with Contact + Order now. */
export function FloatingContact({ channels }: { channels: ContactChannel[] }) {
  const hasChannels = channels.length > 0;
  return (
    <>
      {hasChannels && (
      <div className="fixed right-6 bottom-6 z-30 hidden md:block">
        <ContactMenu
          channels={channels}
          trigger={
            <Button size="lg" className="rounded-full pr-5 pl-4 shadow-3" aria-label="Contact us">
              <MessageSquare aria-hidden />
              Questions?
            </Button>
          }
        />
      </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <div className={hasChannels ? "grid grid-cols-2 gap-2" : "grid"}>
          {hasChannels && (
          <ContactMenu
            channels={channels}
            trigger={
              <Button variant="secondary" size="lg" className="w-full">
                <MessageSquare aria-hidden />
                Contact
              </Button>
            }
          />
          )}
          <Button asChild size="lg" className="w-full">
            <Link href="/order">Order now</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
