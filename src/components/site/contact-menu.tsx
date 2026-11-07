"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Mail, MessageCircle, Send } from "lucide-react";
import type { ReactNode } from "react";
import type { ContactChannel } from "@/lib/contact";

const ICON = { whatsapp: MessageCircle, telegram: Send, email: Mail } as const;

/** WhatsApp / Telegram / email deep links. Replaces a live-chat widget for now (docs/scope.md). */
export function ContactMenu({ channels, trigger, side = "top" }: { channels: ContactChannel[]; trigger: ReactNode; side?: "top" | "bottom" }) {
  return (
    <Dropdown.Root modal={false}>
      <Dropdown.Trigger asChild>{trigger}</Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          side={side}
          align="end"
          sideOffset={8}
          className="z-50 min-w-64 rounded-lg border border-border bg-surface p-1.5 shadow-3"
        >
          <Dropdown.Label className="px-3 pt-2 pb-1 text-overline font-semibold text-fg-muted uppercase">Talk to us</Dropdown.Label>
          {channels.map((c) => {
            const Icon = ICON[c.key];
            return (
              <Dropdown.Item key={c.key} asChild>
                <a
                  href={c.href}
                  target={c.key === "email" ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md px-3 outline-none data-highlighted:bg-surface-2"
                >
                  <Icon aria-hidden className="size-5 text-brand" />
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-fg">{c.label}</span>
                    <span className="font-mono text-xs text-fg-muted">{c.detail}</span>
                  </span>
                </a>
              </Dropdown.Item>
            );
          })}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
