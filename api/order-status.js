// GET /api/order-status?code=KV...  -> { ok, paid, found }
// Màn hình chuyển khoản gọi định kỳ để biết khi nào tiền về (SePay đã xác nhận).
import { configured, getAccessToken, findOrder } from './_sheets.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
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
