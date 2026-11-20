// Product detail page (product.html?id=...), with color / size selection.
import { getProduct, getVariants } from './api.js';
import { addToCart } from './cart.js';
import { esc, formatPrice, showError, toast } from './ui.js';

const root = document.getElementById('product-detail');
const id = new URLSearchParams(location.search).get('id');

const ATTR_ORDER = ['Color', 'Size'];
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'One Size'];
const SWATCHES = {
  Black: '#1d1d1b', White: '#ffffff', Navy: '#1f2a4d', Grey: '#8a8a8a',
  'Olive Green': '#6b7a3a', Burgundy: '#7a1f33', Beige: '#d9c7a7', Rose: '#e3a1ac',
};

let product;
let variants = [];
let attrs = [];          // e.g. ['Color', 'Size']
let values = {};         // e.g. { Color: ['Black', 'White'], Size: ['M', 'L'] }
const selected = {};     // e.g. { Color: 'Black' }

function sortValues(attr, list) {
  if (attr !== 'Size') return list.sort();
  const rank = (v) => (SIZE_ORDER.includes(v) ? SIZE_ORDER.indexOf(v) : 99);
  return list.sort((a, b) => rank(a) - rank(b));
}

function buildOptions() {
  const names = new Set(variants.flatMap((v) => Object.keys(v.options)));
  attrs = [...names].sort((a, b) => {
    const ra = ATTR_ORDER.includes(a) ? ATTR_ORDER.indexOf(a) : 99;
    const rb = ATTR_ORDER.includes(b) ? ATTR_ORDER.indexOf(b) : 99;
    return ra - rb || a.localeCompare(b);
  });
  values = {};
  for (const a of attrs) {
    values[a] = sortValues(a, [...new Set(variants.map((v) => v.options[a]).filter(Boolean))]);
    if (values[a].length === 1) selected[a] = values[a][0]; // nothing to choose
  }
}

// Is there an in-stock variant with attr=value that also matches the other selections?
function isPossible(attr, value, ignoreOthers = false) {
  return variants.some((v) => v.available
    && v.options[attr] === value
    && (ignoreOthers || attrs.every((a) => a === attr || !selected[a] || v.options[a] === selected[a])));
}

function matchedVariant() {
  if (!attrs.every((a) => selected[a])) return null;
  return variants.find((v) => attrs.every((a) => v.options[a] === selected[a])) ?? null;
}

function optionButton(attr, value) {
  const everAvailable = isPossible(attr, value, true);
  const possible = isPossible(attr, value);
  const isSelected = selected[attr] === value;
  const cls = ['opt', attr === 'Color' ? 'opt-swatch' : 'opt-text'];
  if (isSelected) cls.push('selected');
  if (!possible) cls.push('unavailable');
  const swatch = attr === 'Color'
    ? `<span class="swatch" style="background:${SWATCHES[value] ?? '#ccc'}"></span>`
    : '';
  return `<button type="button" class="${cls.join(' ')}" data-attr="${esc(attr)}" data-value="${esc(value)}"
      aria-pressed="${isSelected}" title="${esc(value)}${everAvailable ? '' : ' (sold out)'}"
      ${everAvailable ? '' : 'disabled'}>${swatch}<span class="${attr === 'Color' ? 'sr-only' : ''}">${esc(value)}</span></button>`;
}

function renderOptions() {
  const optionsEl = document.getElementById('options');
  optionsEl.innerHTML = attrs.map((a) => `
    <fieldset class="option-group">
      <legend>${esc(a)}: <strong>${esc(selected[a] ?? '')}</strong></legend>
      <div class="option-list">${values[a].map((v) => optionButton(a, v)).join('')}</div>
    </fieldset>`).join('');

  const variant = matchedVariant();
  const price = product.price + (variant?.priceAdjustment ?? 0);
  document.getElementById('price').textContent = formatPrice(price);

  const btn = document.getElementById('add-btn');
  const missing = attrs.filter((a) => !selected[a]);
  if (missing.length) {
    btn.disabled = true;
    btn.textContent = `Select ${missing.join(' & ').toLowerCase()}`;
  } else if (!variant || !variant.available) {
    btn.disabled = true;
    btn.textContent = 'Out of stock';
  } else {
    btn.disabled = false;
    btn.textContent = 'Add to cart';
  }
}

function render() {
  document.title = `${product.name} | Kigali Threads`;
  root.innerHTML = `
    <div class="detail-media"><img src="${esc(product.image)}" alt="${esc(product.name)}"></div>
    <div class="detail-info">
      <a class="back-link" href="index.html?category=${encodeURIComponent(product.category)}">← ${esc(product.category)}</a>
      <h1>${esc(product.name)}</h1>
      <p class="price price-lg" id="price">${formatPrice(product.price)}</p>
      ${product.description ? `<p class="description">${esc(product.description)}</p>` : ''}
      <div id="options"></div>
      <div class="buy-row">
        <label class="qty">
          <span class="sr-only">Quantity</span>
          <input type="number" id="qty" min="1" max="99" value="1">
        </label>
        <button class="btn" id="add-btn">Add to cart</button>
      </div>
    </div>`;

  root.addEventListener('click', (e) => {
    const opt = e.target.closest('[data-attr]');
    if (!opt || opt.disabled) return;
    const { attr, value } = opt.dataset;
    if (selected[attr] === value && values[attr].length > 1) {
      delete selected[attr]; // click again to unselect
    } else {
      selected[attr] = value;
      // Drop other choices that don't exist together with this one.
      for (const a of attrs) {
        if (a !== attr && selected[a] && !isPossible(a, selected[a])) delete selected[a];
      }
    }
    renderOptions();
  });

  document.getElementById('add-btn').addEventListener('click', () => {
    const qty = Math.min(Math.max(parseInt(document.getElementById('qty').value, 10) || 1, 1), 99);
    const variant = matchedVariant();
    if (variants.length && !variant) return;
    const label = attrs.map((a) => selected[a]).join(' / ');
    addToCart(product, qty, variant && {
      id: variant.id, label, price: Math.round((product.price + variant.priceAdjustment) * 100) / 100,
    });
    toast(`${qty} × ${product.name}${label ? ` (${label})` : ''} added to cart`);
  });

  if (variants.length) {
    renderOptions();
  }
}

(async function init() {
  if (!id) {
    root.innerHTML = '<div class="state"><h2>No product selected</h2><a class="btn" href="index.html">Back to shop</a></div>';
    return;
  }
  try {
    [product, variants] = await Promise.all([getProduct(id), getVariants(id)]);
    if (!product) {
      root.innerHTML = '<div class="state"><h2>Product not found</h2><a class="btn" href="index.html">Back to shop</a></div>';
      return;
    }
    buildOptions();
    render();
  } catch (err) {
    console.error(err);
    showError(root, err);
  }
}());
