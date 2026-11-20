// Product listing page: search, category filter, sorting.
import { getProducts } from './api.js';
import { addToCart } from './cart.js';
import { esc, formatPrice, showError, toast } from './ui.js';

const grid = document.getElementById('product-grid');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');
const sortSelect = document.getElementById('sort');
const resultCount = document.getElementById('result-count');

let products = [];

function card(p) {
  const soldOut = p.stock !== null && p.stock <= 0;
  return `
    <article class="card">
      <a href="product.html?id=${encodeURIComponent(p.id)}" class="card-media">
        <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
        ${soldOut ? '<span class="tag">Sold out</span>' : ''}
      </a>
      <div class="card-body">
        <p class="card-category">${esc(p.category)}</p>
        <h3 class="card-title"><a href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
        <div class="card-footer">
          <span class="price">${formatPrice(p.price)}</span>
          ${p.variantCount > 0
    ? `<a class="btn btn-small" href="product.html?id=${encodeURIComponent(p.id)}">Choose options</a>`
    : `<button class="btn btn-small" data-add="${esc(p.id)}" ${soldOut ? 'disabled' : ''}>Add to cart</button>`}
        </div>
      </div>
    </article>`;
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const cat = categorySelect.value;
  let list = products.filter((p) =>
    (!cat || p.category === cat)
    && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)));

  switch (sortSelect.value) {
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    default: break;
  }

  resultCount.textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
  grid.innerHTML = list.length
    ? list.map(card).join('')
    : '<div class="state"><h2>No products found</h2><p>Try a different search or category.</p></div>';
}

function fillCategories() {
  const cats = [...new Set(products.map((p) => p.category))].sort();
  categorySelect.innerHTML = '<option value="">All categories</option>'
    + cats.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
  // Pre-select category from URL (?category=...)
  const fromUrl = new URLSearchParams(location.search).get('category');
  if (fromUrl && cats.includes(fromUrl)) categorySelect.value = fromUrl;
}

grid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  const product = products.find((p) => String(p.id) === btn.dataset.add);
  if (product) {
    addToCart(product);
    toast(`${product.name} added to cart`);
  }
});

[searchInput, categorySelect, sortSelect].forEach((el) => el.addEventListener('input', render));

(async function init() {
  try {
    products = await getProducts();
    fillCategories();
    render();
  } catch (err) {
    console.error(err);
    resultCount.textContent = '';
    showError(grid, err);
  }
}());
