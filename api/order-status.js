// GET /api/order-status?code=KV...  -> { ok, paid, found }
// Màn hình chuyển khoản gọi định kỳ để biết khi nào tiền về (SePay đã xác nhận).
import { configured, getAccessToken, findOrder, SHEET_ID, TAB } from './_sheets.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.query && req.query.debug === '1') {
    try {
      const token = await getAccessToken()
      const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(TAB + '!A1:K6')}`,
        { headers: { Authorization: `Bearer ${token}` } })
      return res.status(200).json({ ok: r.ok, tab: TAB, status: r.status, data: await r.json() })
    } catch (e) { return res.status(200).json({ ok: false, error: String(e) }) }
  }
  const code = req.query && req.query.code
  if (!code) return res.status(400).json({ ok: false, error: 'missing code' })
  if (!configured()) return res.status(200).json({ ok: true, paid: false, configured: false })
  try {
    const token = await getAccessToken()
    const { rows, paid } = await findOrder(token, code)
    return res.status(200).json({ ok: true, paid, found: rows.length > 0 })
  } catch (e) {
    // Không chặn polling: trả paid=false khi lỗi
    return res.status(200).json({ ok: false, paid: false, error: String(e) })
  }
}
