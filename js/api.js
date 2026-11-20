// Data access layer — talks to the Supabase REST API (PostgREST) with fetch().
import {
  SUPABASE_URL, SUPABASE_ANON_KEY, PRODUCTS_TABLE, FIELD_MAP, IMAGE_BASE_PATH,
} from './config.js';

const REST_URL = `${SUPABASE_URL}/rest/v1`;

async function request(path) {
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('PASTE_')) {
    throw new Error('Supabase anon key is missing. Set SUPABASE_ANON_KEY in js/config.js.');
  }
  const res = await fetch(`${REST_URL}/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.json()).message || ''; } catch { /* ignore */ }
    throw new Error(`Request failed (${res.status}) ${detail}`.trim());
  }
  return res.json();
}

// Return the first column present in the row from a list of candidates.
function pick(row, key) {
  for (const col of FIELD_MAP[key]) {
    if (row[col] !== undefined && row[col] !== null) return row[col];
  }
  return null;
}

function resolveImage(value) {
  if (!value) return 'https://placehold.co/600x750?text=No+image';
  if (/^(https?:)?\/\//.test(value) || value.startsWith('data:')) return value;
  if (value.includes('/')) return value; // already a relative path
  return IMAGE_BASE_PATH + value;
}

// Convert a raw database row into the shape the UI uses.
export function normalize(row) {
  const price = Number(pick(row, 'price'));
  const stock = pick(row, 'stock');
  // Category comes from the joined categories table (via product_categories).
  const joined = Array.isArray(row.categories) ? row.categories[0]?.name : null;
  const category = joined ?? pick(row, 'category');
  return {
    id: pick(row, 'id'),
    name: pick(row, 'name') ?? 'Untitled product',
    price: Number.isFinite(price) ? price : 0,
    image: resolveImage(pick(row, 'image')),
    category: category != null ? String(category) : 'Other',
    description: pick(row, 'description') ?? '',
    stock: stock == null ? null : Number(stock),
    variantCount: Array.isArray(row.product_variants) ? (row.product_variants[0]?.count ?? 0) : 0,
    raw: row,
  };
}

// Variants of one product, each with its options, e.g. { Color: 'Black', Size: 'XL' }.
export async function getVariants(productId) {
  const rows = await request(
    'product_variants?select=variant_id,sku,price_adjustment,available,'
    + 'variant_options(value,variant_attributes(name))'
    + `&product_id=eq.${encodeURIComponent(productId)}`,
  );
  return rows.map((v) => {
    const options = {};
    for (const o of v.variant_options ?? []) {
      const attr = o.variant_attributes?.name;
      if (attr) options[attr] = o.value;
    }
    return {
      id: v.variant_id,
      sku: v.sku,
      priceAdjustment: Number(v.price_adjustment) || 0,
      available: v.available !== false,
      options,
    };
  });
}

const SELECT = 'select=*,categories(name),product_variants(count)';

export async function getProducts() {
  const rows = await request(`${PRODUCTS_TABLE}?${SELECT}&order=created_at.desc`);
  return rows.map(normalize);
}

export async function getProduct(id) {
  const idCol = FIELD_MAP.id[0];
  const rows = await request(
    `${PRODUCTS_TABLE}?${SELECT}&${idCol}=eq.${encodeURIComponent(id)}&limit=1`,
  );
  return rows.length ? normalize(rows[0]) : null;
}
