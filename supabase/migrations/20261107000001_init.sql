-- Adszorio — initial schema (NPI-1234). Simplified scope: see docs/scope.md.
create extension if not exists citext;

-- ---------- helpers ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- enums ----------
create type public.quality_tier   as enum ('standard', 'premium', 'elite');
create type public.link_type      as enum ('profile', 'post', 'reel', 'video', 'channel', 'short');
create type public.order_status   as enum ('pending', 'confirmed', 'processing', 'in_progress', 'completed', 'partial', 'cancelled', 'refunded');
create type public.payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'refunded');
create type public.lead_status    as enum ('new', 'contacted', 'converted', 'lost');
create type public.banner_placement as enum ('home_hero', 'top_strip', 'popup');
create type public.rounding_rule  as enum ('cents', 'end_99', 'whole');
create type public.data_request_type   as enum ('export', 'delete');
create type public.data_request_status as enum ('received', 'completed', 'rejected');
create type public.admin_role     as enum ('owner', 'staff');

-- ---------- catalogue ----------
create table public.platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  icon text,                         -- lucide key or storage path
  brand_color text not null default '#14161A' check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  platform_id uuid not null references public.platforms(id) on delete cascade,
  name text not null,
  slug text not null check (slug ~ '^[a-z0-9-]+$'),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform_id, slug)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text not null default '',
  price_per_1000_usd numeric(12,4) not null check (price_per_1000_usd >= 0),
  min_qty int not null check (min_qty > 0),
  max_qty int not null,
  start_time text not null,                       -- e.g. "0–6 hours"
  start_time_hours_max int not null default 24,   -- for delivery estimates
  speed text not null,                            -- e.g. "500–1,000 per day"
  speed_per_day int not null default 1000,
  quality_tier public.quality_tier not null default 'standard',
  delivery_method text not null check (length(trim(delivery_method)) > 0),
  is_real_engagement_verified boolean not null default false,
  refill_days int not null default 0 check (refill_days >= 0),
  guarantee_text text,
  requirements text[] not null default '{}',
  link_type public.link_type not null,
  geo_targeting text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  provider_service_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (max_qty >= min_qty)
);
create index on public.services (category_id) where is_active;

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  platform_id uuid not null references public.platforms(id) on delete cascade,
  tagline text,
  items jsonb not null default '[]'::jsonb,       -- [{ "service_id": uuid, "qty": int }]
  price_usd numeric(12,2) not null check (price_usd >= 0),
  compare_at_price_usd numeric(12,2),
  badge text,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(items) = 'array'),
  check (compare_at_price_usd is null or compare_at_price_usd >= price_usd)
);

create table public.currencies (
  code text primary key check (code ~ '^[A-Z]{3}$'),
  symbol text not null,
  rate_to_usd numeric(14,6) not null check (rate_to_usd > 0),  -- units of this currency per 1 USD
  rounding_rule public.rounding_rule not null default 'cents',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- orders ----------
create sequence public.order_code_seq start 24817;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique default ('ADZ-' || nextval('public.order_code_seq')),
  customer_name text not null,
  email citext not null,
  phone text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),   -- E.164
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  customer_timezone text,
  ip_country text,
  service_id uuid references public.services(id) on delete restrict,
  package_id uuid references public.packages(id) on delete restrict,
  quantity int not null check (quantity > 0),
  target_link text not null,
  currency text not null references public.currencies(code),
  fx_rate numeric(14,6) not null,
  amount numeric(12,2) not null,
  amount_usd numeric(12,2) not null,
  payment_method text,                  -- free text until payments are built
  payment_status public.payment_status not null default 'unpaid',
  payment_ref text,
  payment_proof_url text,
  status public.order_status not null default 'pending',
  start_count int,
  delivered_count int,
  delivery_proof_urls text[] not null default '{}',
  risk_flags jsonb not null default '[]'::jsonb,
  requires_review boolean not null default false,
  admin_notes text,
  status_history jsonb not null default '[]'::jsonb,   -- [{ status, at, by, note }]
  terms_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((service_id is null) <> (package_id is null))
);
create index on public.orders (email);
create index on public.orders (status, created_at desc);

-- ---------- CRM & content ----------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext not null,
  phone text,
  country text,
  company text,
  platform_interest text,
  budget_range_usd text,
  message text not null,
  source_page text,
  utm jsonb not null default '{}'::jsonb,
  status public.lead_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  mobile_image_url text,
  cta_text text,
  cta_link text,
  placement public.banner_placement not null default 'home_hero',
  target_countries text[],
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_company text,
  country text,
  avatar_url text,
  text text not null,
  rating smallint check (rating between 1 and 5),
  source_url text,
  verified boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'General',
  platform_id uuid references public.platforms(id) on delete set null,
  question text not null,
  answer text not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.legal_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  body text not null default '',
  version int not null default 1,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null,                          -- PUBLIC settings (src/types/models.ts SiteSettings)
  private jsonb not null default '{}'::jsonb,   -- admin-only: notification emails, fraud thresholds
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  type public.data_request_type not null,
  email citext not null,
  details text,
  status public.data_request_status not null default 'received',
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role not null default 'staff',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  diff jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers on every table
do $$
declare t text;
begin
  foreach t in array array['platforms','categories','services','packages','currencies','orders','leads',
    'banners','testimonials','faqs','legal_pages','site_settings','data_requests','admin_users','audit_log']
  loop
    execute format('create trigger set_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;
