// Single source of truth for sample data. Used by:
//  - the app as a fallback when Supabase env vars are not set (local dev, previews)
//  - scripts/gen-seed-sql.ts to produce supabase/seed.sql
//
// Honesty: no testimonials and no stats are seeded. delivery_method text is a deliberately cautious
// default; the owner MUST replace it with an accurate description per service before launch.
import type { Category, Currency, Faq, Package, Platform, Service, SiteSettings } from "../types/models.ts";

const id = (n: number) => `00000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;

export const platforms: Platform[] = [
  { id: id(1), name: "YouTube", slug: "youtube", icon: "youtube", brand_color: "#D1121B", is_active: true, sort_order: 1 },
  { id: id(2), name: "Instagram", slug: "instagram", icon: "instagram", brand_color: "#C2185B", is_active: true, sort_order: 2 },
];

export const categories: Category[] = [
  { id: id(101), platform_id: id(1), name: "Views & Watch time", slug: "views", sort_order: 1 },
  { id: id(102), platform_id: id(1), name: "Subscribers", slug: "subscribers", sort_order: 2 },
  { id: id(103), platform_id: id(1), name: "Engagement", slug: "engagement", sort_order: 3 },
  { id: id(201), platform_id: id(2), name: "Followers", slug: "followers", sort_order: 1 },
  { id: id(202), platform_id: id(2), name: "Reels & Views", slug: "reels", sort_order: 2 },
  { id: id(203), platform_id: id(2), name: "Engagement", slug: "engagement", sort_order: 3 },
];

const DELIVERY_DEFAULT =
  "Delivered gradually through our third-party supplier network. Engagement comes from accounts we do not control, is not targeted to your audience, and some of it may be removed by the platform over time.";

type S = Omit<Service, "id" | "description" | "delivery_method" | "is_real_engagement_verified" | "geo_targeting" | "is_active"> &
  Partial<Pick<Service, "description" | "delivery_method" | "geo_targeting">>;

const svc = (n: number, s: S): Service => ({
  id: id(n),
  description: "",
  delivery_method: DELIVERY_DEFAULT,
  is_real_engagement_verified: false,
  geo_targeting: null,
  is_active: true,
  ...s,
});

export const services: Service[] = [
  // YouTube
  svc(1001, { category_id: id(101), name: "YouTube Views — Standard", slug: "youtube-views-standard", price_per_1000_usd: 1.9, min_qty: 500, max_qty: 1_000_000, start_time: "0–12 hours", start_time_hours_max: 12, speed: "5,000–20,000 per day", speed_per_day: 10_000, quality_tier: "standard", refill_days: 30, guarantee_text: "Free refill for 30 days if the count drops.", requirements: ["Video must be public", "Embedding must be enabled"], link_type: "video", is_featured: true, sort_order: 1 }),
  svc(1002, { category_id: id(101), name: "YouTube Views — Premium Retention", slug: "youtube-views-premium", price_per_1000_usd: 3.4, min_qty: 1000, max_qty: 500_000, start_time: "0–24 hours", start_time_hours_max: 24, speed: "2,000–8,000 per day", speed_per_day: 5_000, quality_tier: "premium", refill_days: 60, guarantee_text: "Free refill for 60 days if the count drops.", requirements: ["Video must be public", "Video longer than 1 minute"], link_type: "video", is_featured: false, sort_order: 2 }),
  svc(1003, { category_id: id(101), name: "YouTube Shorts Views", slug: "youtube-shorts-views", price_per_1000_usd: 1.2, min_qty: 1000, max_qty: 2_000_000, start_time: "0–6 hours", start_time_hours_max: 6, speed: "20,000–50,000 per day", speed_per_day: 30_000, quality_tier: "standard", refill_days: 30, guarantee_text: "Free refill for 30 days.", requirements: ["Short must be public"], link_type: "short", is_featured: false, sort_order: 3 }),
  svc(1004, { category_id: id(101), name: "YouTube Watch Time (hours)", slug: "youtube-watch-time", price_per_1000_usd: 38, min_qty: 100, max_qty: 4000, start_time: "24–48 hours", start_time_hours_max: 48, speed: "200–500 hours per day", speed_per_day: 300, quality_tier: "premium", refill_days: 30, guarantee_text: "Refill for 30 days. Watch time does not guarantee monetisation approval.", requirements: ["Video must be public", "Video longer than 60 minutes"], link_type: "video", is_featured: true, sort_order: 4 }),
  svc(1005, { category_id: id(102), name: "YouTube Subscribers", slug: "youtube-subscribers", price_per_1000_usd: 24, min_qty: 100, max_qty: 50_000, start_time: "0–24 hours", start_time_hours_max: 24, speed: "300–1,000 per day", speed_per_day: 500, quality_tier: "premium", refill_days: 30, guarantee_text: "Free refill for 30 days if the count drops.", requirements: ["Channel must be public", "Subscriber count must be visible"], link_type: "channel", is_featured: true, sort_order: 1 }),
  svc(1006, { category_id: id(103), name: "YouTube Likes", slug: "youtube-likes", price_per_1000_usd: 4.5, min_qty: 50, max_qty: 100_000, start_time: "0–6 hours", start_time_hours_max: 6, speed: "1,000–5,000 per day", speed_per_day: 2_000, quality_tier: "standard", refill_days: 30, guarantee_text: "Free refill for 30 days.", requirements: ["Video must be public"], link_type: "video", is_featured: false, sort_order: 1 }),
  svc(1007, { category_id: id(103), name: "YouTube Custom Comments", slug: "youtube-custom-comments", price_per_1000_usd: 45, min_qty: 10, max_qty: 2000, start_time: "12–24 hours", start_time_hours_max: 24, speed: "50–200 per day", speed_per_day: 100, quality_tier: "premium", refill_days: 0, guarantee_text: null, requirements: ["Video must be public", "Comments must be enabled", "You provide the comment text"], link_type: "video", is_featured: false, sort_order: 2 }),
  svc(1008, { category_id: id(103), name: "YouTube Shares", slug: "youtube-shares", price_per_1000_usd: 6, min_qty: 100, max_qty: 50_000, start_time: "0–24 hours", start_time_hours_max: 24, speed: "1,000–3,000 per day", speed_per_day: 2_000, quality_tier: "standard", refill_days: 0, guarantee_text: null, requirements: ["Video must be public"], link_type: "video", is_featured: false, sort_order: 3 }),
  // Instagram
  svc(2001, { category_id: id(201), name: "Instagram Followers — Standard", slug: "instagram-followers-standard", price_per_1000_usd: 2.8, min_qty: 100, max_qty: 100_000, start_time: "0–6 hours", start_time_hours_max: 6, speed: "2,000–10,000 per day", speed_per_day: 5_000, quality_tier: "standard", refill_days: 30, guarantee_text: "Free refill for 30 days if the count drops.", requirements: ["Profile must be public", "Turn off “Flag for review” in Follow & invite settings"], link_type: "profile", is_featured: true, sort_order: 1 }),
  svc(2002, { category_id: id(201), name: "Instagram Followers — Premium", slug: "instagram-followers-premium", price_per_1000_usd: 6.5, min_qty: 100, max_qty: 50_000, start_time: "0–12 hours", start_time_hours_max: 12, speed: "1,000–3,000 per day", speed_per_day: 2_000, quality_tier: "premium", refill_days: 90, guarantee_text: "Free refill for 90 days if the count drops.", requirements: ["Profile must be public"], link_type: "profile", is_featured: false, sort_order: 2 }),
  svc(2003, { category_id: id(202), name: "Instagram Reels Views", slug: "instagram-reels-views", price_per_1000_usd: 0.45, min_qty: 1000, max_qty: 5_000_000, start_time: "0–2 hours", start_time_hours_max: 2, speed: "50,000+ per day", speed_per_day: 50_000, quality_tier: "standard", refill_days: 30, guarantee_text: "Free refill for 30 days.", requirements: ["Account must be public"], link_type: "reel", is_featured: true, sort_order: 1 }),
  svc(2004, { category_id: id(202), name: "Instagram Saves", slug: "instagram-saves", price_per_1000_usd: 1.6, min_qty: 100, max_qty: 100_000, start_time: "0–6 hours", start_time_hours_max: 6, speed: "5,000 per day", speed_per_day: 5_000, quality_tier: "standard", refill_days: 0, guarantee_text: null, requirements: ["Post must be public"], link_type: "post", is_featured: false, sort_order: 2 }),
  svc(2005, { category_id: id(203), name: "Instagram Likes", slug: "instagram-likes", price_per_1000_usd: 1.8, min_qty: 50, max_qty: 100_000, start_time: "0–1 hour", start_time_hours_max: 1, speed: "5,000–20,000 per day", speed_per_day: 10_000, quality_tier: "standard", refill_days: 30, guarantee_text: "Free refill for 30 days.", requirements: ["Post must be public"], link_type: "post", is_featured: true, sort_order: 1 }),
  svc(2006, { category_id: id(203), name: "Instagram Custom Comments", slug: "instagram-custom-comments", price_per_1000_usd: 32, min_qty: 10, max_qty: 1000, start_time: "6–24 hours", start_time_hours_max: 24, speed: "50–200 per day", speed_per_day: 100, quality_tier: "premium", refill_days: 0, guarantee_text: null, requirements: ["Post must be public", "Comments must be enabled", "You provide the comment text"], link_type: "post", is_featured: false, sort_order: 2 }),
  svc(2007, { category_id: id(203), name: "Instagram Shares", slug: "instagram-shares", price_per_1000_usd: 1.4, min_qty: 100, max_qty: 100_000, start_time: "0–6 hours", start_time_hours_max: 6, speed: "5,000 per day", speed_per_day: 5_000, quality_tier: "standard", refill_days: 0, guarantee_text: null, requirements: ["Post must be public"], link_type: "post", is_featured: false, sort_order: 3 }),
];

export const packages: Package[] = [
  { id: id(3001), name: "YouTube Starter", slug: "youtube-starter", platform_id: id(1), tagline: "A first push for a new video", items: [{ service_id: id(1001), qty: 5000 }, { service_id: id(1006), qty: 250 }], price_usd: 9.49, compare_at_price_usd: 10.63, badge: null, is_active: true, sort_order: 1 },
  { id: id(3002), name: "YouTube Growth", slug: "youtube-growth", platform_id: id(1), tagline: "Views, likes and subscribers together", items: [{ service_id: id(1001), qty: 20000 }, { service_id: id(1006), qty: 1000 }, { service_id: id(1005), qty: 250 }], price_usd: 42, compare_at_price_usd: 48.5, badge: "Best value", is_active: true, sort_order: 2 },
  { id: id(3003), name: "YouTube Launch", slug: "youtube-launch", platform_id: id(1), tagline: "For channel launches and premieres", items: [{ service_id: id(1002), qty: 50000 }, { service_id: id(1006), qty: 2500 }, { service_id: id(1005), qty: 1000 }], price_usd: 179, compare_at_price_usd: 205.25, badge: null, is_active: true, sort_order: 3 },
  { id: id(4001), name: "Instagram Starter", slug: "instagram-starter", platform_id: id(2), tagline: "Followers and likes to get started", items: [{ service_id: id(2001), qty: 500 }, { service_id: id(2005), qty: 500 }], price_usd: 1.99, compare_at_price_usd: 2.3, badge: null, is_active: true, sort_order: 1 },
  { id: id(4002), name: "Instagram Creator", slug: "instagram-creator", platform_id: id(2), tagline: "Reels reach plus engagement", items: [{ service_id: id(2003), qty: 50000 }, { service_id: id(2005), qty: 2000 }, { service_id: id(2004), qty: 500 }], price_usd: 22.9, compare_at_price_usd: 26.9, badge: "Most popular", is_active: true, sort_order: 2 },
  { id: id(4003), name: "Instagram Brand", slug: "instagram-brand", platform_id: id(2), tagline: "Premium followers and full engagement mix", items: [{ service_id: id(2002), qty: 5000 }, { service_id: id(2003), qty: 100000 }, { service_id: id(2005), qty: 5000 }, { service_id: id(2007), qty: 1000 }], price_usd: 74, compare_at_price_usd: 87.9, badge: null, is_active: true, sort_order: 3 },
];

// Sample rates (units per 1 USD). Owner updates these in admin. AED is pegged at 3.6725.
export const currencies: Currency[] = [
  { code: "USD", symbol: "$", rate_to_usd: 1, rounding_rule: "cents", is_active: true, sort_order: 1 },
  { code: "EUR", symbol: "€", rate_to_usd: 0.92, rounding_rule: "cents", is_active: true, sort_order: 2 },
  { code: "GBP", symbol: "£", rate_to_usd: 0.78, rounding_rule: "cents", is_active: true, sort_order: 3 },
  { code: "CAD", symbol: "CA$", rate_to_usd: 1.38, rounding_rule: "cents", is_active: true, sort_order: 4 },
  { code: "AUD", symbol: "A$", rate_to_usd: 1.52, rounding_rule: "cents", is_active: true, sort_order: 5 },
  { code: "AED", symbol: "AED", rate_to_usd: 3.6725, rounding_rule: "cents", is_active: true, sort_order: 6 },
];

export const faqs: Faq[] = [
  { id: id(5001), category: "General", platform_id: null, question: "Do you need my password?", answer: "No. We only ever need the public link to your profile, post or video. Never share your password with anyone, including us.", sort_order: 1 },
  { id: id(5002), category: "General", platform_id: null, question: "Are results guaranteed to stay?", answer: "No. Platforms can remove engagement at any time. If a count drops within a service's refill period we top it up free of charge; after the refill period ends, results are not guaranteed.", sort_order: 2 },
  { id: id(5003), category: "General", platform_id: null, question: "How is engagement delivered?", answer: "Each service lists its delivery method in plain language on its page. Please read it before ordering.", sort_order: 3 },
  { id: id(5004), category: "Orders", platform_id: null, question: "How do I pay?", answer: "After you place an order we email you payment details. Your order starts once payment is confirmed.", sort_order: 4 },
  { id: id(5005), category: "Orders", platform_id: null, question: "Can I track my order?", answer: "Yes. Use your order code and email on the Track order page.", sort_order: 5 },
];

export const siteSettings: SiteSettings = {
  brand: "Adszorio",
  domain: "adszorio.com",
  contact: { email: "hello@adszorio.com", whatsapp: "", telegram: "" },
  socials: [],
  support_hours: { timezone: "Asia/Kolkata", days: "Mon–Sat", open: "10:00", close: "22:00" },
  stats: [],
  announcement: { text: "Transparent pricing in your currency. Every service shows how it is delivered.", link: "/services" },
  default_currency: "USD",
  seo: {
    title: "Adszorio — YouTube & Instagram growth services",
    description: "Transparent, per-1,000 pricing for YouTube and Instagram growth services, shown in your currency, with clear delivery methods and refill policies.",
  },
};
