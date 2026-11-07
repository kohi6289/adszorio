// Domain types mirroring supabase/migrations. Hand-written for Phase 1;
// swap for `supabase gen types` output once a hosted project exists.

export type QualityTier = "standard" | "premium" | "elite";
export type LinkType = "profile" | "post" | "reel" | "video" | "channel" | "short";
export type RoundingRule = "cents" | "end_99" | "whole";

export interface Platform {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  brand_color: string;
  is_active: boolean;
  sort_order: number;
}

export interface Category {
  id: string;
  platform_id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface Service {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price_per_1000_usd: number;
  min_qty: number;
  max_qty: number;
  start_time: string;
  start_time_hours_max: number;
  speed: string;
  speed_per_day: number;
  quality_tier: QualityTier;
  delivery_method: string;
  is_real_engagement_verified: boolean;
  refill_days: number;
  guarantee_text: string | null;
  requirements: string[];
  link_type: LinkType;
  geo_targeting: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface PackageItem {
  service_id: string;
  qty: number;
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  platform_id: string;
  tagline: string | null;
  items: PackageItem[];
  price_usd: number;
  compare_at_price_usd: number | null;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Currency {
  code: string;
  symbol: string;
  rate_to_usd: number;
  rounding_rule: RoundingRule;
  is_active: boolean;
  sort_order: number;
}

export interface Faq {
  id: string;
  category: string;
  platform_id: string | null;
  question: string;
  answer: string;
  sort_order: number;
}

export interface Stat {
  label: string;
  value: number;
  suffix?: string;
}

/** Public site settings (site_settings.data). Everything here is readable by visitors. */
export interface SiteSettings {
  brand: string;
  domain: string;
  contact: {
    email: string;
    /** E.164 without spaces, e.g. "+919800000000". Empty string hides the channel. */
    whatsapp: string;
    /** Handle without "@". Empty string hides the channel. */
    telegram: string;
  };
  socials: { label: string; url: string }[];
  support_hours: { timezone: string; days: string; open: string; close: string };
  /** Real numbers only. Empty array hides the stats block. */
  stats: Stat[];
  announcement: { text: string; link?: string } | null;
  default_currency: string;
  seo: { title: string; description: string };
}

export type OrderStatus = "pending" | "confirmed" | "processing" | "in_progress" | "completed" | "partial" | "cancelled" | "refunded";
export type PaymentStatus = "unpaid" | "pending" | "paid" | "failed" | "refunded";
export type LeadStatus = "new" | "contacted" | "converted" | "lost";

export const ORDER_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "in_progress", "completed", "partial", "cancelled", "refunded"];
export const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "pending", "paid", "failed", "refunded"];
export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "converted", "lost"];

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
  cta_text: string | null;
  cta_link: string | null;
  placement: "home_hero" | "top_strip" | "popup";
  target_countries: string[] | null;
  sort_order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role_company: string | null;
  country: string | null;
  avatar_url: string | null;
  text: string;
  rating: number | null;
  source_url: string | null;
  verified: boolean;
}

export interface LegalPage {
  slug: string;
  title: string;
  body: string;
  version: number;
  published_at: string | null;
  updated_at: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  customer_timezone: string | null;
  ip_country: string | null;
  service_id: string | null;
  package_id: string | null;
  quantity: number;
  target_link: string;
  currency: string;
  fx_rate: number;
  amount: number;
  amount_usd: number;
  payment_method: string | null;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  status: OrderStatus;
  start_count: number | null;
  delivered_count: number | null;
  delivery_proof_urls: string[];
  risk_flags: string[];
  requires_review: boolean;
  admin_notes: string | null;
  status_history: StatusEvent[];
  created_at: string;
  updated_at: string;
}

/** Catalogue views with joined names, used by the public site. */
export interface ServiceView extends Service {
  platform_slug: string;
  platform_name: string;
  category_name: string;
  category_slug: string;
}

export interface PackageView extends Package {
  platform_slug: string;
  platform_name: string;
  resolved: { service: ServiceView; qty: number }[];
}

export interface Catalog {
  platforms: Platform[];
  categories: Category[];
  services: ServiceView[];
  packages: PackageView[];
}
