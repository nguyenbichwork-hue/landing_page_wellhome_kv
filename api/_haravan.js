// Khớp sản phẩm KOL với Haravan để lấy ảnh/mô tả/variant + phân loại nhóm theo tên.
// Cần biến môi trường HARAVAN_TOKEN (server-side, an toàn).
const TOKEN = process.env.HARAVAN_TOKEN
const BASE = 'https://apis.haravan.com/com'

const noDia = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')

// Phân loại nhóm SP theo TÊN (gồm cả đồ gia dụng lớn của Bosch/Smeg)
export function classifyCategory(name) {
  const n = noDia(name).toLowerCase()
  if (/tu lanh|tu dong|side by side|tu mat/.test(n)) return 'Tủ lạnh & Tủ đông'
  if (/may giat|may say(?! toc)|may say quan ao/.test(n)) return 'Máy giặt & Sấy'
  if (/may rua bat|rua chen|rua bat/.test(n)) return 'Máy rửa bát'
  if (/lo nuong|lo vi song|lo hap|lo ket hop/.test(n)) return 'Lò nướng & Vi sóng'
  if (/may hut mui|hut mui/.test(n)) return 'Máy hút mùi'
  if (/may pha (ca phe|cafe)|may ca phe/.test(n)) return 'Máy pha cà phê'
  if (/^bep |bep tu|bep dien|bep ga|bep hong ngoai|bep am|bep doi|bep ba/.test(n)) return 'Bếp'
  if (/ban ui|ixeo/.test(n)) return 'Chăm sóc quần áo'
  if (/hut bui|lau san|lau nha|\brobot\b/.test(n)) return 'Vệ sinh nhà cửa'
  if (/may xay|may ep|vat cam|xay sinh to|may danh trung/.test(n)) return 'Chế biến thực phẩm'
  if (/binh dun|sieu toc|am dun|may pha/.test(n)) return 'Đồ uống'
  if (/\bdao\b|ke dao/.test(n)) return 'Dao & Dụng cụ bếp'
  if (/noi chien|noi com|ap suat dien|multicooker|cao tan/.test(n)) return 'Nấu nướng điện'
  if (/chao|\bnoi\b|quanh/.test(n)) return 'Nồi & Chảo'
  return 'Khác'
}

const STOP = new Set(['tefal', 'bosch', 'smeg', 'cm', 'mau', 'dung', 'cho', 'bep', 'tu', 'va', 'bo', 'mon', 'inox', 'l', 'w', 'ml', '-'])
const tokens = (s) => noDia(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter((t) => t.length > 1 && !STOP.has(t))
const models = (name) => (name.toUpperCase().match(/[A-Z0-9]{5,}/g) || []).filter((t) => /[A-Z]/.test(t) && /[0-9]/.test(t) && !/^\d+(CM|W|ML|L)$/.test(t))
const sizes = (s) => [...new Set((noDia(s).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(cm|l|w|ml)\b/g) || []).map((x) => x.replace(/\s+/g, '')))]
function nameScore(a, b) {
  const A = new Set(tokens(a)), B = tokens(b)
  if (!A.size || !B.length) return 0
  let hit = 0; for (const t of B) if (A.has(t)) hit++
  return hit / Math.max(A.size, B.length)
}
function sizeAdjust(kn, hn) {
  const a = sizes(kn), b = sizes(hn)
  if (!a.length || !b.length) return 0
  return a.filter((x) => b.includes(x)).length ? 150 : -500
}

export async function fetchVendor(vendor) {
  if (!TOKEN) throw new Error('Thiếu HARAVAN_TOKEN')
  const all = []; let page = 1
  while (page <= 30) {
    const r = await fetch(`${BASE}/products.json?limit=50&page=${page}&vendor=${encodeURIComponent(vendor)}`,
      { headers: { Authorization: `Bearer ${TOKEN}` } })
    if (!r.ok) break
    const items = (await r.json()).products || []
    all.push(...items)
    if (items.length < 50) break
    page++
  }
  return all.map((p) => ({
    id: p.id, handle: p.handle, title: p.title, body_html: p.body_html,
    images: (p.images || []).map((i) => i.src),
    variants: (p.variants || []).map((v) => ({ id: v.id, sku: v.sku, barcode: v.barcode })),
  }))
}

// Khớp 1 dòng KOL {cmmf,name} với danh sách Haravan đã tải.
export function matchOne(cmmf, name, har) {
  const ms = models(name)
  let best = null
  for (const h of har) {
    let score = 0; const by = []
    const tU = (h.title || '').toUpperCase(), hU = (h.handle || '').toUpperCase()
    if (h.variants.some((v) => (v.sku || '') === cmmf || (v.barcode || '') === cmmf)) { score += 1000; by.push('code') }
    if ((h.body_html || '').includes(cmmf)) { score += 500; by.push('body') }
    for (const m of ms) { if (tU.includes(m) || hU.includes(m)) { score += 400; by.push('model'); break } }
    const ns = nameScore(h.title, name); score += ns * 300
    score += sizeAdjust(name, h.title)
    if (!best || score > best.score) best = { h, score, by, ns }
  }
  const ok = best && best.score >= 200 && (best.h.images || []).length > 0 && (best.by.length > 0 || best.ns >= 0.6)
  return ok ? best.h : null
}

// parse CSV cơ bản (xử lý dấu phẩy, xuống dòng trong ô)
export function parseCSV(t) {
  const rows = []; let row = [], cur = '', q = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += c }
    else { if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = '' } else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' } else if (c === '\r') { } else cur += c }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row) }
  return rows
}

const money = (s) => parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0

// Chuyển nội dung CSV (định dạng file KOL) -> danh sách product đã enrich từ Haravan.
export async function importFromCsv(csvText) {
  const rows = parseCSV(csvText)
  // tìm dòng tiêu đề (có CMMF / ITEM NAME)
  let hi = rows.findIndex((r) => r.join('|').toUpperCase().includes('ITEM NAME') || r.join('|').toUpperCase().includes('CMMF'))
  if (hi < 0) hi = 0
  const header = rows[hi].map((x) => (x || '').toUpperCase().trim())
  const col = (names) => header.findIndex((h) => names.some((n) => h.includes(n)))
  const ci = {
    note: col(['NOTE', 'GHI CHU']), cmmf: col(['CMMF', 'MÃ SP', 'MA SP', 'CODE']),
    name: col(['ITEM NAME', 'TÊN SP', 'TEN SP', 'TÊN SẢN PHẨM', 'PRODUCT']),
    brand: col(['BRAND', 'HÃNG', 'HANG']), cat: col(['CAT', 'NHÓM', 'NHOM']),
    rsp: col(['RSP', 'GIÁ GỐC', 'GIA GOC', 'GIÁ NIÊM']), kol: col(['KOL', 'GIÁ KOL', 'GIA KOL']),
    pct: col(['%', 'GIẢM', 'GIAM', 'DISCOUNT']), stock: col(['STOCK', 'TỒN', 'TON', 'KHO']),
  }
  const items = rows.slice(hi + 1)
    .filter((r) => (ci.cmmf >= 0 ? r[ci.cmmf] : '') && (ci.name >= 0 ? r[ci.name] : '') && String(r[ci.cmmf]).trim() && String(r[ci.name]).trim())
    .map((r) => ({
      cmmf: String(r[ci.cmmf]).trim(),
      name: String(r[ci.name]).trim(),
      brand: (ci.brand >= 0 ? String(r[ci.brand]).trim() : 'TEFAL').toUpperCase() || 'TEFAL',
      cat: ci.cat >= 0 ? String(r[ci.cat]).trim() : '',
      rspPrice: ci.rsp >= 0 ? money(r[ci.rsp]) : 0,
      kolPrice: ci.kol >= 0 ? money(r[ci.kol]) : 0,
      discountPct: ci.pct >= 0 ? money(r[ci.pct]) : 0,
      stock: ci.stock >= 0 ? (parseInt(r[ci.stock], 10) || 1) : 1,
      badge: ci.note >= 0 ? String(r[ci.note] || '').trim() : '',
    }))

  // gom theo hãng, tải Haravan mỗi hãng 1 lần
  const brands = [...new Set(items.map((i) => i.brand))]
  const cache = {}
  for (const b of brands) { try { cache[b] = await fetchVendor(b.charAt(0) + b.slice(1).toLowerCase()) } catch { cache[b] = [] } }

  const out = items.map((it) => {
    const har = cache[it.brand] || []
    const h = matchOne(it.cmmf, it.name, har)
    const disc = it.discountPct || (it.rspPrice > 0 ? Math.round((1 - it.kolPrice / it.rspPrice) * 100) : 0)
    return {
      id: it.cmmf, cmmf: it.cmmf, name: it.name, brand: it.brand,
      category: classifyCategory(it.name),
      rspPrice: it.rspPrice, kolPrice: it.kolPrice, discountPct: disc, stock: it.stock, badge: it.badge,
      haravanId: h?.id || null, handle: h?.handle || null, variantId: h?.variants?.[0]?.id || null,
      images: h?.images || [], descriptionHtml: h?.body_html || '', matched: !!h, active: true,
    }
  })
  return { products: out, matched: out.filter((p) => p.matched).length, total: out.length }
}
