// API quản trị: thêm/sửa/xóa SP + import hàng loạt từ file Sheet (định dạng KOL).
// Xác thực: Google ID token (email = admin@khomes.com.vn) HOẶC passcode (header x-admin-pass = ADMIN_PASSCODE).
import { configured, getAccessToken, readProducts, upsertProducts, setProductActive } from './_sheets.js'
import { importFromCsv, fetchVendor, matchOne, classifyCategory } from './_haravan.js'

export const config = { maxDuration: 60 }

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@khomes.com.vn').toLowerCase()
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || ''
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || ''

async function authOK(req) {
  const pass = req.headers['x-admin-pass']
  if (ADMIN_PASSCODE && pass && pass === ADMIN_PASSCODE) return { ok: true, via: 'passcode' }
  const auth = req.headers['authorization'] || ''
  const m = auth.match(/^Bearer (.+)$/)
  if (m) {
    try {
      const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(m[1]))
      if (r.ok) {
        const info = await r.json()
        const audOk = !GOOGLE_CLIENT_ID || info.aud === GOOGLE_CLIENT_ID
        if (info.email && info.email.toLowerCase() === ADMIN_EMAIL && info.email_verified !== 'false' && audOk) {
          return { ok: true, via: 'google', email: info.email }
        }
      }
    } catch (_) { /* ignore */ }
  }
  return { ok: false }
}

// Lấy CSV từ link Google Sheet (đã publish / share xem được)
function sheetCsvUrl(url) {
  const id = (url.match(/\/d\/([a-zA-Z0-9-_]+)/) || [])[1]
  const gid = (url.match(/[?#&]gid=(\d+)/) || [])[1] || '0'
  if (!id) return null
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-pass')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' })

  const auth = await authOK(req)
  if (!auth.ok) return res.status(401).json({ ok: false, error: 'Không có quyền (đăng nhập admin hoặc nhập đúng mã quản trị).' })
  if (!configured()) return res.status(500).json({ ok: false, error: 'Chưa cấu hình Google Sheet (thiếu biến môi trường).' })

  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }
  body = body || {}
  const action = body.action

  try {
    const token = await getAccessToken()

    if (action === 'list') {
      const products = await readProducts(token, true)
      return res.status(200).json({ ok: true, products })
    }

    if (action === 'save') {
      const p = body.product || {}
      if (!p.cmmf && !p.id) return res.status(400).json({ ok: false, error: 'Thiếu mã SP' })
      if (p.rspPrice && p.kolPrice && !p.discountPct) p.discountPct = Math.round((1 - p.kolPrice / p.rspPrice) * 100)
      if (!p.category && p.name) p.category = classifyCategory(p.name)
      const r = await upsertProducts(token, [{ ...p, id: p.id || p.cmmf }])
      return res.status(200).json({ ok: true, ...r })
    }

    if (action === 'delete') {
      const okd = await setProductActive(token, body.id, false)
      return res.status(200).json({ ok: okd })
    }

    if (action === 'import') {
      let csv = body.csv
      if (!csv && body.sheetUrl) {
        const u = sheetCsvUrl(body.sheetUrl)
        if (!u) return res.status(400).json({ ok: false, error: 'Link Google Sheet không hợp lệ' })
        const r = await fetch(u, { redirect: 'follow' })
        if (!r.ok) return res.status(400).json({ ok: false, error: 'Không tải được Sheet (hãy mở quyền xem công khai). HTTP ' + r.status })
        csv = await r.text()
      }
      if (!csv) return res.status(400).json({ ok: false, error: 'Thiếu dữ liệu (link sheet hoặc CSV)' })
      const { products, matched, total } = await importFromCsv(csv)
      if (!total) return res.status(400).json({ ok: false, error: 'Không đọc được sản phẩm nào từ file (kiểm tra cột CMMF/ITEM NAME).' })
      const r = await upsertProducts(token, products)
      return res.status(200).json({ ok: true, total, matched, ...r })
    }

    if (action === 'enrich') {
      const brand = (body.brand || '').toUpperCase()
      const all = await readProducts(token, true)
      const targets = all.filter((p) => (!brand || p.brand === brand) && (!p.images || !p.images.length))
      if (!targets.length) return res.status(200).json({ ok: true, updated: 0, note: 'Không có SP nào cần lấy ảnh' })
      const vendors = [...new Set(targets.map((p) => p.brand))]
      const cache = {}
      for (const b of vendors) { try { cache[b] = await fetchVendor(b.charAt(0) + b.slice(1).toLowerCase()) } catch { cache[b] = [] } }
      const updates = []
      for (const p of targets) {
        const h = matchOne(p.cmmf || p.id, p.name, cache[p.brand] || [])
        if (h) updates.push({ ...p, haravanId: h.id, handle: h.handle, variantId: h.variants?.[0]?.id || null, images: h.images, descriptionHtml: h.body_html, matched: true })
      }
      if (updates.length) await upsertProducts(token, updates)
      return res.status(200).json({ ok: true, updated: updates.length, checked: targets.length })
    }

    return res.status(400).json({ ok: false, error: 'action không hợp lệ' })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) })
  }
}
