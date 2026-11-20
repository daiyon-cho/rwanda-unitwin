// Cart page.
import { getCart, updateQty, removeFromCart, cartTotal, clearCart } from './cart.js';
import { esc, formatPrice, toast } from './ui.js';

const list = document.getElementById('cart-items');
const summary = document.getElementById('cart-summary');

function render() {
  const items = getCart();
  if (!items.length) {
    list.innerHTML = '<div class="state"><h2>Your cart is empty</h2><a class="btn" href="index.html">Continue shopping</a></div>';
    summary.hidden = true;
    return;
  }
  summary.hidden = false;
  list.innerHTML = items.map((i) => `
    <div class="cart-row" data-key="${esc(i.key)}">
      <img src="${esc(i.image)}" alt="">
      <div class="cart-row-info">
        <a href="product.html?id=${encodeURIComponent(i.id)}">${esc(i.name)}</a>
        ${i.variantLabel ? `<span class="variant-label">${esc(i.variantLabel)}</span>` : ''}
        <span class="muted">${formatPrice(i.price)}</span>
      </div>
      <input type="number" min="1" value="${i.qty}" aria-label="Quantity for ${esc(i.name)}" data-qty>
      <span class="cart-row-total">${formatPrice(i.price * i.qty)}</span>
      <button class="icon-btn" data-remove aria-label="Remove ${esc(i.name)}">✕</button>
    </div>`).join('');
  document.getElementById('cart-total').textContent = formatPrice(cartTotal());
}

list.addEventListener('change', (e) => {
  if (!e.target.matches('[data-qty]')) return;
  const key = e.target.closest('.cart-row').dataset.key;
  updateQty(key, Math.max(parseInt(e.target.value, 10) || 1, 1));
  render();
});

list.addEventListener('click', (e) => {
  if (!e.target.closest('[data-remove]')) return;
  removeFromCart(e.target.closest('.cart-row').dataset.key);
  render();
});

document.getElementById('checkout-btn').addEventListener('click', () => {
  // Placeholder: real checkout (orders table + payment) comes in a later step.
  toast('Thank you! Your order has been placed (demo).');
  clearCart();
  render();
});

render();
