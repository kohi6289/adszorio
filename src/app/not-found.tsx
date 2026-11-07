import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-[68ch] flex-col justify-center px-4 py-24">
      <p className="font-mono text-sm text-fg-subtle">404</p>
      <h1 className="mt-3 font-display text-display-xl font-semibold">This page doesn&rsquo;t exist.</h1>
      <p className="mt-4 text-lg text-fg-muted">The link may be old, or the page may have moved. Our services and order tracking are still a click away.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link href="/">Go to home</Link></Button>
        <Button asChild size="lg" variant="secondary"><Link href="/services">Browse services</Link></Button>
      </div>
    </main>
  );
}
