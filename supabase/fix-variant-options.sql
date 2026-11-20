-- Re-link every product variant to its real Size and Color, taken from its SKU.
--   SKU-CAR-0001-BLK-XL  →  Color = Black, Size = XL
-- Currently all 600 rows in product_variant_options point to "M" + "Burgundy".
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.

begin;

-- 1) The SKUs use a "ROS" (rose) color that has no option yet — add it.
insert into public.variant_options (attribute_id, value)
select a.attribute_id, 'Rose'
from public.variant_attributes a
where a.name = 'Color'
  and not exists (
    select 1 from public.variant_options o
    where o.attribute_id = a.attribute_id and o.value = 'Rose'
  );

-- 2) Work out the correct Size and Color option for every variant.
create temporary table correct_links on commit drop as
with parsed as (
  -- Color and size are always the last two parts of the SKU
  -- (T-shirt SKUs contain an extra dash: SKU-T-S-0013-BLK-XL).
  select v.variant_id,
         (regexp_match(v.sku, '-([A-Z]+)-([A-Z]+)$'))[1] as color_code,  -- BLK / WHT / ROS
         (regexp_match(v.sku, '-([A-Z]+)-([A-Z]+)$'))[2] as size_code    -- M / L / XL
  from public.product_variants v
),
color_map(code, value) as (
  values ('BLK', 'Black'), ('WHT', 'White'), ('ROS', 'Rose')
)
select p.variant_id, o.option_id
from parsed p
join color_map cm on cm.code = p.color_code
join public.variant_options o on o.value = cm.value
join public.variant_attributes a on a.attribute_id = o.attribute_id and a.name = 'Color'
union all
select p.variant_id, o.option_id
from parsed p
join public.variant_options o on o.value = p.size_code
join public.variant_attributes a on a.attribute_id = o.attribute_id and a.name = 'Size';

-- 3) Replace the links only for variants we could parse.
delete from public.product_variant_options pvo
using (select distinct variant_id from correct_links) c
where pvo.variant_id = c.variant_id;

insert into public.product_variant_options (variant_id, option_id)
select variant_id, option_id from correct_links;

commit;

-- Check: every variant should now have exactly 2 options (1 color + 1 size).
select options_per_variant, count(*) as variants
from (
  select v.variant_id, count(pvo.option_id) as options_per_variant
  from public.product_variants v
  left join public.product_variant_options pvo on pvo.variant_id = v.variant_id
  group by v.variant_id
) t
group by options_per_variant;
