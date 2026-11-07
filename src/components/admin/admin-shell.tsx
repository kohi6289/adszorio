"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ADMIN_NAV } from "./nav";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="grid gap-5">
      {ADMIN_NAV.map((g) => (
        <div key={g.group}>
          <p className="px-3 text-[0.6875rem] font-semibold tracking-wider text-fg-subtle uppercase">{g.group}</p>
          <ul className="mt-1">
            {g.items.map((i) => {
              const active = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
              return (
                <li key={i.href}>
                  <Link href={i.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
                    className={cn("flex min-h-10 items-center rounded-md px-3 text-sm font-medium text-fg-muted hover:bg-surface-2 hover:text-fg", active && "bg-surface-2 text-fg")}>
                    {i.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ name, tz, children, signOut, toggleTz }: {
  name: string; tz: string; children: React.ReactNode; signOut: () => Promise<void>; toggleTz: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const footer = (
    <div className="grid gap-2 border-t border-border pt-4 text-sm">
      <form action={toggleTz}>
        <button type="submit" className="flex min-h-10 w-full cursor-pointer items-center justify-between rounded-md px-3 text-fg-muted hover:bg-surface-2">
          Times in <span className="font-mono font-semibold text-fg">{tz === "UTC" ? "UTC" : "IST"}</span>
        </button>
      </form>
      <Link href="/" target="_blank" className="flex min-h-10 items-center gap-2 rounded-md px-3 text-fg-muted hover:bg-surface-2">View site <ExternalLink aria-hidden className="size-3.5" /></Link>
      <form action={signOut}>
        <button type="submit" className="flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-md px-3 text-fg-muted hover:bg-surface-2"><LogOut aria-hidden className="size-4" />Sign out <span className="truncate text-fg-subtle">({name})</span></button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-dvh print:hidden flex-col gap-6 overflow-y-auto border-r border-border bg-surface p-4 lg:flex">
        <Link href="/admin" className="px-3 font-display text-lg font-semibold">Adszorio <span className="font-sans text-xs font-medium text-fg-subtle">admin</span></Link>
        <div className="flex-1"><NavLinks /></div>
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 print:hidden items-center justify-between border-b border-border bg-surface/95 px-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="font-display font-semibold">Adszorio admin</Link>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild><Button variant="ghost" size="icon" aria-label="Open admin menu"><Menu aria-hidden /></Button></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-fg/30" />
            <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-xs flex-col gap-4 overflow-y-auto bg-surface p-4 shadow-3 focus:outline-none">
              <div className="flex items-center justify-between">
                <Dialog.Title className="font-display font-semibold">Menu</Dialog.Title>
                <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close menu"><X aria-hidden /></Button></Dialog.Close>
              </div>
              <Dialog.Description className="sr-only">Admin navigation</Dialog.Description>
              <div className="flex-1"><NavLinks onNavigate={() => setOpen(false)} /></div>
              {footer}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <main id="main" className="min-w-0 px-3 py-5 md:px-6 lg:px-8 lg:py-7">{children}</main>
    </div>
  );
}
