import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Platform } from "@/types/models";
import { CurrencySwitcher } from "./currency-switcher";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { primaryNav } from "./nav";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ brand, platforms }: { brand: string; platforms: Platform[] }) {
  const items = primaryNav(platforms);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-4 md:px-6 lg:px-8">
        <Logo name={brand} />
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-md px-3 text-[0.9375rem] font-medium text-fg-muted transition-colors hover:text-fg"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <CurrencySwitcher />
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Button asChild variant="ghost" className="hidden lg:inline-flex">
            <Link href="/contact">Contact</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/order">Order now</Link>
          </Button>
          <MobileNav items={items} />
        </div>
      </div>
    </header>
  );
}
