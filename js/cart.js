// Shopping cart stored in localStorage.
// Each line is one product + variant (e.g. "Wool Cardigan — Black / M").
const KEY = 'shop.cart.v1';

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY));
    if (!Array.isArray(data)) return [];
    // Older cart lines have no key: fall back to the product id.
    return data.map((i) => ({ ...i, key: i.key ?? String(i.id) }));
  } catch {
    return [];
  }
}

function write(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  document.dispatchEvent(new CustomEvent('cart:change', { detail: items }));
}

export function lineKey(productId, variantId) {
  return variantId ? `${productId}:${variantId}` : String(productId);
}

// variant (optional): { id, label, price }
export function addToCart(product, qty = 1, variant = null) {
  const items = read();
  const key = lineKey(product.id, variant?.id);
  const existing = items.find((i) => i.key === key);
  if (existing) {
    existing.qty += qty;
  } else {
    items.push({
      key,
      id: product.id,
      variantId: variant?.id ?? null,
      variantLabel: variant?.label ?? '',
      name: product.name,
      price: variant?.price ?? product.price,
      image: product.image,
      qty,
    });
  }
  write(items);
}

export function getCart() {
  return read();
}

export function updateQty(key, qty) {
  let items = read();
  if (qty <= 0) {
    items = items.filter((i) => i.key !== key);
  } else {
    const item = items.find((i) => i.key === key);
    if (item) item.qty = qty;
  }
  write(items);
}

export function removeFromCart(key) {
  updateQty(key, 0);
}

export function clearCart() {
  write([]);
}

export function cartCount() {
  return read().reduce((n, i) => n + i.qty, 0);
}

export function cartTotal() {
  return read().reduce((sum, i) => sum + i.price * i.qty, 0);
}
