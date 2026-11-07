// Declarative admin resources. One config drives the list page, the edit form and the save action,
// so adding a field to the dashboard is a one-line change here (plus the DB column).

export type FieldType =
  | "text" | "slug" | "textarea" | "markdown" | "number" | "boolean" | "select"
  | "ref" | "lines" | "csv" | "datetime" | "color" | "image" | "package-items";

export type RefTable = "platforms" | "categories" | "services";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  options?: readonly string[];
  ref?: RefTable;
  step?: string;
  min?: number;
  max?: number;
  readonly?: boolean;
  /** Only editable when creating (e.g. currency code). */
  createOnly?: boolean;
  wide?: boolean;
}

export interface ColumnDef {
  name: string;
  label: string;
  kind?: "text" | "bool" | "money4" | "money" | "badge" | "ref" | "date" | "color" | "mono";
  ref?: RefTable;
}

export interface ResourceDef {
  key: string;
  table: string;
  label: string;
  singular: string;
  group: "Catalogue" | "Content" | "Commerce" | "Privacy";
  pk: string;
  titleField: string;
  orderBy: string;
  ascending?: boolean;
  sortable?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
  canDuplicate?: boolean;
  toggles?: string[];
  columns: ColumnDef[];
  fields: FieldDef[];
  intro?: string;
}

const active: FieldDef = { name: "is_active", label: "Visible on the site", type: "boolean" };

export const RESOURCES: ResourceDef[] = [
  {
    key: "platforms", table: "platforms", label: "Platforms", singular: "platform", group: "Catalogue",
    pk: "id", titleField: "name", orderBy: "sort_order", ascending: true, sortable: true, canCreate: true, canDelete: true,
    toggles: ["is_active"],
    intro: "Adding a platform here (e.g. TikTok) creates its landing page and navigation link automatically.",
    columns: [{ name: "name", label: "Name" }, { name: "slug", label: "URL", kind: "mono" }, { name: "brand_color", label: "Colour", kind: "color" }, { name: "is_active", label: "Visible", kind: "bool" }],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "slug", required: true, help: "Lowercase, used in the URL: adszorio.com/<slug>" },
      { name: "icon", label: "Icon key", type: "select", options: ["youtube", "instagram", "other"] },
      { name: "brand_color", label: "Accent colour", type: "color", required: true, help: "Automatically darkened if needed for readable contrast." },
      active,
    ],
  },
  {
    key: "categories", table: "categories", label: "Categories", singular: "category", group: "Catalogue",
    pk: "id", titleField: "name", orderBy: "sort_order", ascending: true, sortable: true, canCreate: true, canDelete: true,
    columns: [{ name: "name", label: "Name" }, { name: "platform_id", label: "Platform", kind: "ref", ref: "platforms" }, { name: "slug", label: "Slug", kind: "mono" }],
    fields: [
      { name: "platform_id", label: "Platform", type: "ref", ref: "platforms", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "slug", required: true },
    ],
  },
  {
    key: "services", table: "services", label: "Services", singular: "service", group: "Catalogue",
    pk: "id", titleField: "name", orderBy: "sort_order", ascending: true, sortable: true, canCreate: true, canDelete: true, canDuplicate: true,
    toggles: ["is_active", "is_featured"],
    columns: [
      { name: "name", label: "Name" }, { name: "category_id", label: "Category", kind: "ref", ref: "categories" },
      { name: "price_per_1000_usd", label: "Per 1,000", kind: "money4" }, { name: "is_featured", label: "Featured", kind: "bool" }, { name: "is_active", label: "Visible", kind: "bool" },
    ],
    fields: [
      { name: "category_id", label: "Category", type: "ref", ref: "categories", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "slug", required: true },
      { name: "price_per_1000_usd", label: "Price per 1,000 (USD)", type: "number", step: "0.0001", min: 0, required: true },
      { name: "link_type", label: "Link the customer provides", type: "select", options: ["profile", "post", "reel", "video", "channel", "short"], required: true },
      { name: "min_qty", label: "Minimum quantity", type: "number", step: "1", min: 1, required: true },
      { name: "max_qty", label: "Maximum quantity", type: "number", step: "1", min: 1, required: true },
      { name: "start_time", label: "Start time (shown)", type: "text", required: true, help: "e.g. 0–12 hours" },
      { name: "start_time_hours_max", label: "Start time, max hours", type: "number", step: "1", min: 0, required: true, help: "Used for delivery estimates." },
      { name: "speed", label: "Speed (shown)", type: "text", required: true, help: "e.g. 5,000–20,000 per day" },
      { name: "speed_per_day", label: "Speed per day", type: "number", step: "1", min: 1, required: true },
      { name: "quality_tier", label: "Quality tier", type: "select", options: ["standard", "premium", "elite"], required: true },
      { name: "refill_days", label: "Refill period (days)", type: "number", step: "1", min: 0, required: true, help: "0 = no refill." },
      { name: "delivery_method", label: "How it is delivered (shown to customers)", type: "textarea", required: true, wide: true,
        help: "Plain language and accurate. This is required and is shown on every service page and at checkout." },
      { name: "is_real_engagement_verified", label: "I have verified this engagement comes from real people", type: "boolean", wide: true,
        help: "Only tick if true. It allows the word “real” to be used for this service." },
      { name: "description", label: "Description", type: "markdown", wide: true },
      { name: "requirements", label: "Requirements (one per line)", type: "lines", wide: true, help: "e.g. Profile must be public" },
      { name: "guarantee_text", label: "Guarantee text", type: "text", wide: true },
      { name: "geo_targeting", label: "Geo targeting", type: "text", help: "Optional, e.g. United States" },
      { name: "provider_service_id", label: "Provider service ID", type: "text", help: "For a future supplier API. Leave empty." },
      { name: "is_featured", label: "Featured on home page", type: "boolean" },
      active,
    ],
  },
  {
    key: "packages", table: "packages", label: "Packages", singular: "package", group: "Catalogue",
    pk: "id", titleField: "name", orderBy: "sort_order", ascending: true, sortable: true, canCreate: true, canDelete: true, canDuplicate: true,
    toggles: ["is_active"],
    columns: [{ name: "name", label: "Name" }, { name: "platform_id", label: "Platform", kind: "ref", ref: "platforms" }, { name: "price_usd", label: "Price", kind: "money" }, { name: "badge", label: "Badge" }, { name: "is_active", label: "Visible", kind: "bool" }],
    fields: [
      { name: "platform_id", label: "Platform", type: "ref", ref: "platforms", required: true },
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "slug", required: true },
      { name: "tagline", label: "Tagline", type: "text", wide: true },
      { name: "items", label: "What's included", type: "package-items", wide: true, required: true },
      { name: "price_usd", label: "Package price (USD)", type: "number", step: "0.01", min: 0, required: true },
      { name: "compare_at_price_usd", label: "Compare-at price (USD)", type: "number", step: "0.01", min: 0, help: "Must be the real price of the items bought separately. Leave empty to auto-calculate." },
      { name: "badge", label: "Badge", type: "text", help: "e.g. Best value. Leave empty for none." },
      active,
    ],
  },
  {
    key: "currencies", table: "currencies", label: "Currencies", singular: "currency", group: "Commerce",
    pk: "code", titleField: "code", orderBy: "sort_order", ascending: true, sortable: true, canCreate: true, canDelete: true,
    toggles: ["is_active"],
    intro: "Rates are units of the currency per 1 US dollar. Prices are always stored and charged in USD; other currencies are for display.",
    columns: [{ name: "code", label: "Code", kind: "mono" }, { name: "symbol", label: "Symbol" }, { name: "rate_to_usd", label: "Per 1 USD", kind: "mono" }, { name: "rounding_rule", label: "Rounding" }, { name: "updated_at", label: "Updated", kind: "date" }, { name: "is_active", label: "Active", kind: "bool" }],
    fields: [
      { name: "code", label: "ISO code", type: "text", required: true, createOnly: true, help: "3 capital letters, e.g. SGD" },
      { name: "symbol", label: "Symbol", type: "text", required: true },
      { name: "rate_to_usd", label: "Rate (per 1 USD)", type: "number", step: "0.000001", min: 0, required: true },
      { name: "rounding_rule", label: "Display rounding", type: "select", options: ["cents", "end_99", "whole"], required: true, help: "end_99 shows e.g. 12.99; whole rounds up to whole units." },
      active,
    ],
  },
  {
    key: "banners", table: "banners", label: "Banners", singular: "banner", group: "Content",
    pk: "id", titleField: "title", orderBy: "sort_order", ascending: true, sortable: true, canCreate: true, canDelete: true,
    toggles: ["is_active"],
    intro: "The first active home banner replaces the home page headline. Leave countries empty to show it everywhere.",
    columns: [{ name: "title", label: "Title" }, { name: "placement", label: "Placement" }, { name: "starts_at", label: "Starts", kind: "date" }, { name: "ends_at", label: "Ends", kind: "date" }, { name: "is_active", label: "Active", kind: "bool" }],
    fields: [
      { name: "title", label: "Headline", type: "text", required: true, wide: true },
      { name: "subtitle", label: "Subtitle", type: "textarea", wide: true },
      { name: "placement", label: "Placement", type: "select", options: ["home_hero", "top_strip", "popup"], required: true },
      { name: "cta_text", label: "Button text", type: "text" },
      { name: "cta_link", label: "Button link", type: "text", help: "e.g. /instagram" },
      { name: "image_url", label: "Desktop image", type: "image" },
      { name: "mobile_image_url", label: "Mobile image", type: "image" },
      { name: "target_countries", label: "Only show in countries", type: "csv", help: "Comma-separated ISO codes, e.g. US, GB, AE" },
      { name: "starts_at", label: "Starts", type: "datetime" },
      { name: "ends_at", label: "Ends", type: "datetime" },
      { name: "is_active", label: "Active", type: "boolean" },
    ],
  },
  {
    key: "testimonials", table: "testimonials", label: "Testimonials", singular: "testimonial", group: "Content",
    pk: "id", titleField: "name", orderBy: "sort_order", ascending: true, sortable: true, canCreate: true, canDelete: true,
    toggles: ["is_active"],
    intro: "Real customers only, with their permission. The testimonials section stays hidden until at least one is active.",
    columns: [{ name: "name", label: "Name" }, { name: "country", label: "Country" }, { name: "rating", label: "Rating" }, { name: "verified", label: "Verified", kind: "bool" }, { name: "is_active", label: "Visible", kind: "bool" }],
    fields: [
      { name: "name", label: "Customer name", type: "text", required: true },
      { name: "role_company", label: "Role / company", type: "text" },
      { name: "country", label: "Country", type: "text" },
      { name: "rating", label: "Rating (1–5)", type: "number", step: "1", min: 1, max: 5 },
      { name: "text", label: "Quote", type: "textarea", required: true, wide: true },
      { name: "source_url", label: "Source link", type: "text", help: "Where the review was originally posted." },
      { name: "avatar_url", label: "Photo", type: "image" },
      { name: "verified", label: "Verified (source link checked)", type: "boolean" },
      active,
    ],
  },
  {
    key: "faqs", table: "faqs", label: "FAQs", singular: "FAQ", group: "Content",
    pk: "id", titleField: "question", orderBy: "sort_order", ascending: true, sortable: true, canCreate: true, canDelete: true,
    toggles: ["is_active"],
    columns: [{ name: "question", label: "Question" }, { name: "category", label: "Group" }, { name: "platform_id", label: "Platform", kind: "ref", ref: "platforms" }, { name: "is_active", label: "Visible", kind: "bool" }],
    fields: [
      { name: "question", label: "Question", type: "text", required: true, wide: true },
      { name: "answer", label: "Answer", type: "markdown", required: true, wide: true },
      { name: "category", label: "Group", type: "text", required: true, help: "e.g. General, Orders" },
      { name: "platform_id", label: "Only on platform page", type: "ref", ref: "platforms", help: "Leave empty to show everywhere." },
      active,
    ],
  },
  {
    key: "legal_pages", table: "legal_pages", label: "Legal pages", singular: "legal page", group: "Content",
    pk: "id", titleField: "title", orderBy: "slug", ascending: true, canCreate: true, canDelete: false,
    intro: "Shown at /legal/<slug>. The version number increases automatically when the text changes.",
    columns: [{ name: "title", label: "Title" }, { name: "slug", label: "URL", kind: "mono" }, { name: "version", label: "Version", kind: "mono" }, { name: "updated_at", label: "Updated", kind: "date" }],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "slug", required: true },
      { name: "body", label: "Text", type: "markdown", required: true, wide: true },
      { name: "published_at", label: "Published", type: "datetime", help: "Empty = hidden from the site." },
    ],
  },
  {
    key: "data_requests", table: "data_requests", label: "Privacy requests", singular: "privacy request", group: "Privacy",
    pk: "id", titleField: "email", orderBy: "created_at", ascending: false, canCreate: false, canDelete: false,
    intro: "Verify the requester owns the email before acting. Respond within 30 days (GDPR) / 45 days (CCPA).",
    columns: [{ name: "email", label: "Email" }, { name: "type", label: "Type" }, { name: "status", label: "Status", kind: "badge" }, { name: "created_at", label: "Received", kind: "date" }],
    fields: [
      { name: "email", label: "Email", type: "text", readonly: true },
      { name: "type", label: "Request", type: "text", readonly: true },
      { name: "details", label: "Details from requester", type: "textarea", readonly: true, wide: true },
      { name: "status", label: "Status", type: "select", options: ["received", "completed", "rejected"], required: true },
      { name: "notes", label: "Internal notes", type: "textarea", wide: true },
    ],
  },
];

export const resourceByKey = (key: string) => RESOURCES.find((r) => r.key === key);
