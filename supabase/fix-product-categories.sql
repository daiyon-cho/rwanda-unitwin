-- Re-link every product to the right category based on the type code in its SKU
-- (e.g. SKU-CAR-0001 → CAR → "Knitwear & Sweaters").
-- Currently all 150 rows in product_categories point to "Activewear".
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.

begin;

with sku_map(code, category_name) as (
  values
    ('CAR', 'Knitwear & Sweaters'),    -- Cardigan
    ('HOO', 'Hoodies & Sweatshirts'),  -- Hoodie
    ('T',   'Tops & T-Shirts'),        -- T-Shirt
    ('TRO', 'Pants & Trousers'),       -- Trousers
    ('JEA', 'Jeans'),                  -- Jeans
    ('BLA', 'Jackets & Coats'),        -- Blazer
    ('JAC', 'Jackets & Coats'),        -- Jacket
    ('TRE', 'Jackets & Coats'),        -- Trench Coat
    ('TOT', 'Bags & Backpacks'),       -- Tote Bag
    ('CRO', 'Bags & Backpacks'),       -- Crossbody Bag
    ('LEA', 'Belts'),                  -- Leather Belt
    ('BEA', 'Hats & Beanies'),         -- Beanie
    ('CAP', 'Hats & Beanies'),         -- Cap
    ('SCA', 'Scarves & Gloves'),       -- Scarf
    ('SUN', 'Sunglasses & Eyewear')    -- Sunglasses
),
new_links as (
  select p.product_id, c.category_id
  from public.products p
  join sku_map m   on m.code = split_part(p.sku, '-', 2)
  join public.categories c on c.name = m.category_name
)
-- Only replace links for products we can map (unmapped products keep theirs).
, deleted as (
  delete from public.product_categories pc
  using new_links nl
  where pc.product_id = nl.product_id
)
insert into public.product_categories (product_id, category_id)
select product_id, category_id from new_links;

commit;

-- Check the result: number of products per category.
select c.name, count(*) as products
from public.product_categories pc
join public.categories c on c.category_id = pc.category_id
group by c.name
order by c.name;
