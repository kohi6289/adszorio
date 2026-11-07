import "server-only";

function need(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing env var ${name}. Copy .env.example to .env.local and fill it in (see README).`);
  }
  return value;
}

export const supabaseUrl = () => need("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
export const supabaseAnonKey = () => need("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const supabaseServiceKey = () => need("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);

/** False until the Supabase env vars are set (e.g. a first Vercel deploy). The site then runs in demo mode:
 *  public pages read the built-in sample catalogue, forms explain that ordering isn't switched on yet,
 *  and the admin dashboard shows a "not connected" notice. */
export const hasSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

export const DEMO_MESSAGE =
  "This is a preview of the site: online ordering and forms aren't switched on yet. Please reach us by email or WhatsApp for now.";
