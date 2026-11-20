-- Row Level Security setup for the shop.
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to run more than once.
--
-- Result:
--   * Catalog tables  → anyone can READ, nobody can write with the anon key.
--   * Customer/order tables → fully private to the anon key.
--     (Customer access will be added later with Supabase Auth policies.)

-- 1) Turn RLS on for every table (with RLS on and no policy, access is denied).
alter table public.products                enable row level security;
alter table public.categories              enable row level security;
alter table public.product_categories      enable row level security;
alter table public.product_variants        enable row level security;
alter table public.variant_attributes      enable row level security;
alter table public.variant_options         enable row level security;
alter table public.product_variant_options enable row level security;
alter table public.customers               enable row level security;
alter table public.orders                  enable row level security;
alter table public.order_items             enable row level security;

-- 2) Public read-only access for the catalog.
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products"
  on public.products for select to anon, authenticated using (true);

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
  on public.categories for select to anon, authenticated using (true);

drop policy if exists "Public can read product categories" on public.product_categories;
create policy "Public can read product categories"
  on public.product_categories for select to anon, authenticated using (true);

drop policy if exists "Public can read product variants" on public.product_variants;
create policy "Public can read product variants"
  on public.product_variants for select to anon, authenticated using (true);

drop policy if exists "Public can read variant attributes" on public.variant_attributes;
create policy "Public can read variant attributes"
  on public.variant_attributes for select to anon, authenticated using (true);

drop policy if exists "Public can read variant options" on public.variant_options;
create policy "Public can read variant options"
  on public.variant_options for select to anon, authenticated using (true);

drop policy if exists "Public can read product variant options" on public.product_variant_options;
create policy "Public can read product variant options"
  on public.product_variant_options for select to anon, authenticated using (true);

-- 3) No policies for customers / orders / order_items on purpose:
--    the anon key can no longer read or modify them.
