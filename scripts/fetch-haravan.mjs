// Fetch all Tefal/Bosch/Smeg products from Haravan, cache locally.
import fs from 'node:fs';
const TOKEN = process.env.HARAVAN_TOKEN;
if (!TOKEN) {
  console.error('Thiếu HARAVAN_TOKEN. Chạy: HARAVAN_TOKEN=xxx node scripts/fetch-haravan.mjs Tefal');
  process.exit(1);
}
const BASE = 'https://apis.haravan.com/com';
const H = { Authorization: `Bearer ${TOKEN}` };

async function fetchVendor(vendor) {
  let all = [], page = 1;
  while (true) {
    const url = `${BASE}/products.json?limit=50&page=${page}&vendor=${encodeURIComponent(vendor)}`;
    const r = await fetch(url, { headers: H });
    if (!r.ok) { console.error(vendor, 'page', page, r.status); break; }
    const d = await r.json();
    const items = d.products || [];
    all.push(...items);
    process.stderr.write(`  ${vendor} page ${page}: ${items.length} (total ${all.length})\n`);
    if (items.length < 50) break;
    page++;
  }
  return all;
}

const vendors = (process.argv[2] || 'Tefal').split(',');
let out = [];
for (const v of vendors) out.push(...await fetchVendor(v));
// Slim down to needed fields
const slim = out.map(p => ({
  id: p.id, handle: p.handle, title: p.title, vendor: p.vendor,
  product_type: p.product_type, tags: p.tags, body_html: p.body_html,
  images: (p.images||[]).map(i => i.src),
  variants: (p.variants||[]).map(v => ({ id: v.id, sku: v.sku, barcode: v.barcode, price: v.price, compare_at_price: v.compare_at_price, inventory_quantity: v.inventory_quantity, title: v.title })),
}));
fs.writeFileSync('.cache/haravan-products.json', JSON.stringify(slim, null, 0));
console.error(`Saved ${slim.length} products to .cache/haravan-products.json`);
