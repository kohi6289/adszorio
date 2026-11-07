import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold">Adszorio admin</h1>
        <p className="mt-1 text-sm text-fg-muted">Sign in to manage orders, catalogue and content.</p>
        {error === "not-connected" && <p role="status" className="mt-4 rounded-md bg-surface-2 p-3 text-sm text-fg-muted">The dashboard isn&rsquo;t connected to a database yet. It will work once Supabase is set up.</p>}
        {error === "not-admin" && <p role="alert" className="mt-4 rounded-md bg-danger/10 p-3 text-sm text-danger">That account does not have admin access.</p>}
        <LoginForm />
      </div>
    </main>
  );
}
