// Shared UI helpers.
import { CURRENCY, LOCALE } from './config.js';
import { cartCount } from './cart.js';

const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });
export const formatPrice = (n) => money.format(n);

// Escape text before inserting it into HTML strings (prevents XSS).
export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function updateCartBadge() {
  const badge = document.querySelector('[data-cart-count]');
  if (!badge) return;
  const n = cartCount();
  badge.textContent = n;
  badge.hidden = n === 0;
}

export function toast(message) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

export function showError(container, err) {
  container.innerHTML = `
    <div class="state state-error">
      <h2>Could not load products</h2>
      <p>${esc(err.message)}</p>
    </div>`;
}

document.addEventListener('cart:change', updateCartBadge);
window.addEventListener('storage', updateCartBadge);
updateCartBadge();
