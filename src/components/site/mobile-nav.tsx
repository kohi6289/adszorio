"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencySwitcher } from "./currency-switcher";
import { ThemeToggle } from "./theme-toggle";
import type { NavItem } from "./nav";

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu aria-hidden />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-fg/30 backdrop-blur-[2px] data-[state=open]:animate-in" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-bg shadow-3 focus:outline-none">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Dialog.Title className="font-display text-lg font-semibold">Menu</Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close menu">
                <X aria-hidden />
              </Button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Site navigation and display preferences</Dialog.Description>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-2 py-3">
            <ul>
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center rounded-md px-3 text-lg font-medium text-fg hover:bg-surface-2"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-md px-3 text-lg font-medium text-fg hover:bg-surface-2">
                  Contact
                </Link>
              </li>
            </ul>
          </nav>
          <div className="flex items-center gap-2 border-t border-border p-4">
            <CurrencySwitcher />
            <ThemeToggle />
            <Button asChild className="ml-auto">
              <Link href="/order" onClick={() => setOpen(false)}>Order now</Link>
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
