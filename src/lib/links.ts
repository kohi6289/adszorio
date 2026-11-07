import type { LinkType } from "@/types/models";

// Validates the public link a customer pastes. We only ever need a public URL — never a password.

const IG_HOSTS = ["instagram.com", "www.instagram.com", "m.instagram.com", "instagr.am", "www.instagr.am"];
const YT_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be"];

export const LINK_EXAMPLES: Record<LinkType, string> = {
  profile: "https://instagram.com/yourname",
  post: "https://instagram.com/p/AbC123xyz",
  reel: "https://instagram.com/reel/AbC123xyz",
  video: "https://youtube.com/watch?v=dQw4w9WgXcQ",
  short: "https://youtube.com/shorts/AbC123xyz",
  channel: "https://youtube.com/@yourchannel",
};

export type LinkCheck = { ok: true; url: string } | { ok: false; message: string };

export function validateLink(linkType: LinkType, raw: string): LinkCheck {
  const input = raw.trim();
  if (!input) return { ok: false, message: "Paste the link to continue." };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { ok: false, message: `That doesn't look like a link. Example: ${LINK_EXAMPLES[linkType]}` };
  }
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, "");
  const bad = (what: string) => ({ ok: false as const, message: `Please paste ${what}. Example: ${LINK_EXAMPLES[linkType]}` });

  const isIg = IG_HOSTS.includes(host);
  const isYt = YT_HOSTS.includes(host);

  switch (linkType) {
    case "profile":
      if (!isIg) return bad("an Instagram profile link");
      if (!/^\/[A-Za-z0-9._]{1,30}$/.test(path) || /^\/(p|reel|reels|tv|stories|explore)$/i.test(path)) return bad("a profile link, not a post");
      break;
    case "post":
      if (!isIg || !/^\/(p|reel|tv)\/[A-Za-z0-9_-]+$/.test(path)) return bad("an Instagram post link");
      break;
    case "reel":
      if (!isIg || !/^\/(reel|reels|p)\/[A-Za-z0-9_-]+$/.test(path)) return bad("an Instagram reel link");
      break;
    case "video":
      if (!isYt) return bad("a YouTube video link");
      if (host.endsWith("youtu.be") ? !/^\/[A-Za-z0-9_-]{6,}$/.test(path) : !(path === "/watch" && url.searchParams.get("v")) && !/^\/(shorts|live)\/[A-Za-z0-9_-]+$/.test(path))
        return bad("a YouTube video link");
      break;
    case "short":
      if (!isYt || !/^\/shorts\/[A-Za-z0-9_-]+$/.test(path)) return bad("a YouTube Shorts link");
      break;
    case "channel":
      if (!isYt || !/^\/(@[A-Za-z0-9._-]+|channel\/[A-Za-z0-9_-]+|c\/[A-Za-z0-9._-]+|user\/[A-Za-z0-9._-]+)$/.test(path)) return bad("a YouTube channel link");
      break;
  }
  url.protocol = "https:";
  url.hash = "";
  return { ok: true, url: url.toString() };
}
