// Vercel Serverless Function: nhận đơn KOL và ghi vào Google Sheet qua Service Account.
// Cùng domain với web (khanhvan.wellhome.asia/api/order) -> không lỗi CORS, chịu tải tốt hơn Apps Script.
//
// Biến môi trường cần đặt trên Vercel (Settings > Environment Variables):
//   GOOGLE_SA_EMAIL        : email service account (vd xxx@yyy.iam.gserviceaccount.com)
//   GOOGLE_SA_PRIVATE_KEY  : private key của service account (giữ nguyên \n)
//   SHEET_ID               : ID của Google Sheet thống kê đơn KOL
//   SHEET_TAB              : (tùy chọn) tên tab, mặc định "Đơn KOL"
//   ALERT_EMAIL            : (tùy chọn) email nhận cảnh báo khi ghi đơn lỗi
//   RESEND_API_KEY         : (tùy chọn) API key Resend để gửi email cảnh báo
//   NOTIFY_ALL             : (tùy chọn) "1" để gửi email cho MỌI đơn (không chỉ khi lỗi)
import crypto from 'node:crypto'

const SHEET_ID = process.env.SHEET_ID
const SA_EMAIL = process.env.GOOGLE_SA_EMAIL
const SA_KEY = (process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n')
const TAB = process.env.SHEET_TAB || 'Đơn KOL'
const ALERT_EMAIL = process.env.ALERT_EMAIL
const RESEND_API_KEY = process.env.RESEND_API_KEY
const NOTIFY_ALL = process.env.NOTIFY_ALL === '1'

const HEADERS = ['Thời gian', 'Mã đơn', 'KOL', 'Khách hàng', 'SĐT', 'Email', 'Tỉnh/Thành',
  'Địa chỉ', 'Sản phẩm', 'SL', 'Tạm tính', 'Tiết kiệm', 'Tổng tiền', 'Thanh toán', 'Ghi chú', 'Nguồn', 'Trạng thái']

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = b64url(JSON.stringify({
    iss: SA_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }))
  const sig = b64url(crypto.createSign('RSA-SHA256').update(`${header}.${claim}`).sign(SA_KEY))
  const jwt = `${header}.${claim}.${sig}`
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  })
  const j = await r.json()
  if (!j.access_token) throw new Error('OAuth thất bại: ' + JSON.stringify(j))
  return j.access_token
}

async function alreadyExists(token, orderCode) {
  if (!orderCode) return false
  const range = encodeURIComponent(`${TAB}!B2:B`)
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}`,
    { headers: { Authorization: `Bearer ${token}` } })
  if (!r.ok) return false
  const j = await r.json()
  return (j.values || []).some((row) => row[0] === orderCode)
}

async function appendRow(token, values) {
  const range = encodeURIComponent(`${TAB}!A:Q`)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: [values] }),
  })
  if (!r.ok) throw new Error('Sheets append lỗi ' + r.status + ': ' + (await r.text()))
}

async function sendEmail(subject, text) {
  if (!RESEND_API_KEY || !ALERT_EMAIL) return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Đơn KOL WellHome <onboarding@resend.dev>', to: [ALERT_EMAIL], subject, text }),
    })
  } catch (_) { /* không chặn luồng chính */ }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method === 'GET') return res.status(200).json({ ok: true, service: 'WellHome x Tefal KOL order endpoint' })
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' })

  let data = req.body
  if (typeof data === 'string') { try { data = JSON.parse(data) } catch { data = {} } }
  data = data || {}

  if (!SHEET_ID || !SA_EMAIL || !SA_KEY) {
    return res.status(500).json({ ok: false, error: 'Chưa cấu hình Google Sheet (thiếu biến môi trường).' })
  }

  const c = data.customer || {}
  const items = (data.items || [])
    .map((it) => `${it.qty}x ${it.name} (${it.cmmf}) = ${Number(it.lineTotal || 0).toLocaleString('vi-VN')}đ`)
    .join('\n')
  const row = [
    data.createdAt || new Date().toISOString(),
    data.orderCode || '', data.kol || '', c.name || '', "'" + (c.phone || ''), c.email || '',
    c.province || '', c.address || '', items, data.itemCount || 0,
    data.subtotal || 0, data.savings || 0, data.total || 0,
    data.payment || '', c.note || '', data.source || '', 'Mới',
  ]

  try {
    const token = await getAccessToken()
    if (await alreadyExists(token, data.orderCode)) {
      return res.status(200).json({ ok: true, duplicate: true, orderCode: data.orderCode })
    }
    await appendRow(token, row)
    if (NOTIFY_ALL) {
      await sendEmail(`🛒 Đơn KOL mới ${data.orderCode} — ${Number(data.total || 0).toLocaleString('vi-VN')}đ`,
        `Khách: ${c.name} - ${c.phone}\n${c.province} | ${c.address}\n\n${items}\n\nTổng: ${Number(data.total || 0).toLocaleString('vi-VN')}đ\nThanh toán: ${data.payment}`)
    }
    return res.status(200).json({ ok: true, orderCode: data.orderCode })
  } catch (err) {
    // Ghi Sheet lỗi -> gửi email cảnh báo kèm toàn bộ đơn để cứu thủ công
    await sendEmail(`⚠️ LỖI ghi đơn KOL ${data.orderCode}`,
      `Không ghi được đơn vào Sheet. Hãy nhập tay đơn này:\n\nKhách: ${c.name} - ${c.phone}\n${c.province} | ${c.address}\n\n${items}\n\nTổng: ${Number(data.total || 0).toLocaleString('vi-VN')}đ\nThanh toán: ${data.payment}\n\nLỗi: ${String(err)}`)
    return res.status(500).json({ ok: false, error: String(err) })
  }
}
