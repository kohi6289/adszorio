import "server-only";

// Transactional email via Resend's HTTP API. Without RESEND_API_KEY, emails are logged instead
// so local development and early testing work without an account.
export async function sendEmail(msg: { to: string | string[]; subject: string; text: string; replyTo?: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Adszorio <onboarding@resend.dev>";
  if (!key) {
    console.info(`[email:not-sent] to=${String(msg.to)} subject="${msg.subject}"\n${msg.text}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: msg.to, subject: msg.subject, text: msg.text, reply_to: msg.replyTo }),
    });
    if (!res.ok) console.error("[email] Resend error", res.status, await res.text());
  } catch (e) {
    // Email failure must never fail the order itself.
    console.error("[email] send failed", e);
  }
}

export function siteUrl(path = "") {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}${path}`;
}
