// Tiện ích dùng chung cho các endpoint thao tác Google Sheet (file _ không phải route).
import crypto from 'node:crypto'

export const SHEET_ID = process.env.SHEET_ID
export const SA_EMAIL = process.env.GOOGLE_SA_EMAIL
export const SA_KEY = (process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n')
export const TAB = process.env.SHEET_TAB || 'Đơn KOL'
export const PAID_TEXT = 'Đã thanh toán'
const STATUS_COL = 'J'   // Trạng thái thanh toán
const CODE_COL = 'K'     // Mã đơn hàng

export const configured = () => !!(SHEET_ID && SA_EMAIL && SA_KEY)
export const norm = (s) => (s == null ? '' : String(s)).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

export async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(JSON.stringify({
    iss: SA_EMAIL, scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  }))
  const sig = b64url(crypto.createSign('RSA-SHA256').update(`${header}.${claim}`).sign(SA_KEY))
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${header}.${claim}.${sig}`,
  })
  const j = await r.json()
  if (!j.access_token) throw new Error('OAuth thất bại: ' + JSON.stringify(j))
  return j.access_token
}

async function getValues(token, range) {
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) throw new Error('read ' + r.status + ': ' + (await r.text()))
  return (await r.json()).values || []
}

// Tìm theo mã đơn chính xác (dùng cho poll trạng thái). Trả {rows:[{row,status}], paid}
export async function findOrder(token, orderCode) {
  const target = norm(orderCode)
  if (!target) return { rows: [], paid: false }
  const vals = await getValues(token, `${TAB}!${STATUS_COL}2:${CODE_COL}`)  // [status, code]
  const rows = []
  vals.forEach((r, i) => { if (norm(r[1]) === target) rows.push({ row: i + 2, status: r[0] || '' }) })
  const paid = rows.length > 0 && rows.some((x) => norm(x.status).includes(norm(PAID_TEXT)))
  return { rows, paid }
}

// Tìm đơn có mã NẰM TRONG nội dung chuyển khoản (dùng cho webhook SePay). Trả {rows, code}
export async function matchByContent(token, content) {
  const nc = norm(content)
  if (!nc) return { rows: [], code: null }
  const vals = await getValues(token, `${TAB}!${STATUS_COL}2:${CODE_COL}`)
  const rows = []; let code = null
  vals.forEach((r, i) => {
    const ncode = norm(r[1])
    if (ncode && ncode.length >= 6 && nc.includes(ncode)) { rows.push({ row: i + 2, status: r[0] || '' }); code = r[1] }
  })
  return { rows, code }
}

export async function markPaid(token, rowNumbers, note) {
  const text = PAID_TEXT + (note ? ' — ' + note : '')
  const data = rowNumbers.map((rn) => ({ range: `${TAB}!${STATUS_COL}${rn}`, values: [[text]] }))
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`, {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
  })
  if (!r.ok) throw new Error('update ' + r.status + ': ' + (await r.text()))
}

// ===== KHO SẢN PHẨM (tab "Sản phẩm") =====
export const PROD_TAB = process.env.PRODUCT_TAB || 'Sản phẩm'
export const PROD_HEADERS = ['id', 'brand', 'name', 'category', 'rspPrice', 'kolPrice', 'discountPct',
  'stock', 'badge', 'haravanId', 'handle', 'variantId', 'images', 'descriptionHtml', 'matched', 'active']

const rowToProduct = (r) => ({
  id: r[0], brand: (r[1] || 'TEFAL'), name: r[2], category: r[3],
  rspPrice: +r[4] || 0, kolPrice: +r[5] || 0, discountPct: +r[6] || 0, stock: +r[7] || 0,
  badge: r[8] || '', haravanId: r[9] || null, handle: r[10] || null, variantId: r[11] || null,
  images: (r[12] || '').split('|').filter(Boolean), descriptionHtml: r[13] || '',
  matched: String(r[14]) !== 'false', active: String(r[15] || 'true') !== 'false',
})
const productToRow = (p) => [
  p.id || p.cmmf, (p.brand || 'TEFAL').toUpperCase(), p.name || '', p.category || '',
  +p.rspPrice || 0, +p.kolPrice || 0, +p.discountPct || 0, +p.stock || 0, p.badge || '',
  p.haravanId || '', p.handle || '', p.variantId || '',
  (Array.isArray(p.images) ? p.images.join('|') : (p.images || '')), p.descriptionHtml || '',
  p.matched === false ? 'false' : 'true', p.active === false ? 'false' : 'true',
]

export async function ensureProductHeaders(token) {
  const range = encodeURIComponent(`${PROD_TAB}!A1:P1`)
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=RAW`, {
    method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [PROD_HEADERS] }),
  })
  if (!r.ok) throw new Error('header lỗi ' + r.status + ': ' + (await r.text()))
}

// Đọc toàn bộ SP. all=true để lấy cả SP đã ẩn (cho admin).
export async function readProducts(token, all = false) {
  const range = encodeURIComponent(`${PROD_TAB}!A2:P`)
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) {
    if (r.status === 400) return []   // tab chưa tồn tại
    throw new Error('read SP lỗi ' + r.status)
  }
  const vals = (await r.json()).values || []
  return vals.filter((row) => row[0]).map(rowToProduct).filter((p) => all || p.active)
}

// Thêm/cập nhật danh sách SP (khớp theo id). Trả {added, updated}.
export async function upsertProducts(token, products) {
  await ensureProductHeaders(token)
  const idRange = encodeURIComponent(`${PROD_TAB}!A2:A`)
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${idRange}`,
    { headers: { Authorization: `Bearer ${token}` } })
  const ids = (r.ok ? (await r.json()).values || [] : [])
  const idToRow = {}; ids.forEach((x, i) => { if (x[0]) idToRow[String(x[0])] = i + 2 })
  let nextRow = 2 + ids.length
  const data = []; let added = 0, updated = 0
  for (const p of products) {
    const key = String(p.id || p.cmmf)
    const row = productToRow(p)
    const at = idToRow[key]
    if (at) { data.push({ range: `${PROD_TAB}!A${at}:P${at}`, values: [row] }); updated++ }
    else { data.push({ range: `${PROD_TAB}!A${nextRow}:P${nextRow}`, values: [row] }); idToRow[key] = nextRow; nextRow++; added++ }
  }
  if (data.length) {
    const u = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data }),
    })
    if (!u.ok) throw new Error('upsert lỗi ' + u.status + ': ' + (await u.text()))
  }
  return { added, updated }
}

// Ẩn (xóa mềm) 1 SP theo id.
export async function setProductActive(token, id, active) {
  const idRange = encodeURIComponent(`${PROD_TAB}!A2:A`)
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${idRange}`,
    { headers: { Authorization: `Bearer ${token}` } })
  const ids = (r.ok ? (await r.json()).values || [] : [])
  let row = -1; ids.forEach((x, i) => { if (String(x[0]) === String(id)) row = i + 2 })
  if (row < 0) return false
  const u = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(`${PROD_TAB}!P${row}`)}?valueInputOption=RAW`, {
    method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [[active ? 'true' : 'false']] }),
  })
  return u.ok
}
