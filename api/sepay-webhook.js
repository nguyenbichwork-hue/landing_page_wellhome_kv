// POST /api/sepay-webhook  — SePay gọi khi có giao dịch ngân hàng.
// Khớp nội dung CK với mã đơn -> đổi "Trạng thái thanh toán" thành "Đã thanh toán".
//
// Cấu hình trên SePay (sepay.vn > Webhooks):
//   - URL: https://<domain>/api/sepay-webhook
//   - Tạo API Key, đặt vào biến môi trường Vercel: SEPAY_API_KEY
//   - SePay gửi header: Authorization: Apikey <SEPAY_API_KEY>
import { configured, getAccessToken, matchByContent, markPaid } from './_sheets.js'

const SEPAY_API_KEY = process.env.SEPAY_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'method' })

  // Xác thực API key (nếu đã đặt SEPAY_API_KEY)
  if (SEPAY_API_KEY) {
    const auth = req.headers['authorization'] || req.headers['Authorization'] || ''
    if (auth !== `Apikey ${SEPAY_API_KEY}`) return res.status(401).json({ success: false, error: 'unauthorized' })
  }

  let data = req.body
  if (typeof data === 'string') { try { data = JSON.parse(data) } catch { data = {} } }
  data = data || {}

  // Chỉ xử lý tiền VÀO
  if (String(data.transferType || '').toLowerCase() !== 'in') {
    return res.status(200).json({ success: true, skipped: 'not incoming' })
  }
  const content = data.content || data.description || data.code || ''
  if (!configured()) return res.status(500).json({ success: false, error: 'Chưa cấu hình Google Sheet' })

  try {
    const token = await getAccessToken()
    const { rows, code } = await matchByContent(token, content)
    if (!rows.length) return res.status(200).json({ success: true, matched: false })
    const note = `SePay ${data.referenceCode || ''} ${Number(data.transferAmount || 0).toLocaleString('vi-VN')}đ`.trim()
    await markPaid(token, rows.map((r) => r.row), note)
    return res.status(200).json({ success: true, matched: true, orderCode: code, rows: rows.length })
  } catch (e) {
    return res.status(500).json({ success: false, error: String(e) })
  }
}
