// ---------------------------------------------------------------
// Site configuration — edit these values to match your Supabase project.
// ---------------------------------------------------------------

// Base project URL (without /rest/v1)
export const SUPABASE_URL = 'https://qznpgtfdfnsnyxxcqlga.supabase.co';

// Supabase Dashboard → Project Settings → API → "anon" / "publishable" key.
// This key is meant to be used in the browser; protect data with RLS policies.
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6bnBndGZkZm5zbnl4eGNxbGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxNTI2MTcsImV4cCI6MjExMDcyODYxN30.bmmxO1lg-3wCSzMl-Wqf8Ba3fxXogpwZkIeH35zwfN4';

// Name of the table holding your products.
export const PRODUCTS_TABLE = 'products';

// Currency used to display prices.
export const CURRENCY = 'USD';
export const LOCALE = 'en-US';

// Folder holding product images when the database stores only file names
// (e.g. "fashion_01.jpg"). Full URLs (http...) are used as-is.
export const IMAGE_BASE_PATH = 'products/';

// Column names the site looks for, in order of preference.
// If your table uses a different column name, add it to the matching list.
export const FIELD_MAP = {
  id:          ['product_id', 'id'],
  name:        ['name', 'title', 'product_name'],
  price:       ['base_price', 'price', 'unit_price', 'amount'],
  image:       ['image_url', 'image', 'img', 'thumbnail', 'photo', 'image_path', 'image_name'],
  category:    ['category', 'category_name', 'type', 'product_type'],
  description: ['description', 'desc', 'details'],
  stock:       ['stock', 'stock_quantity', 'quantity', 'inventory'],
};
