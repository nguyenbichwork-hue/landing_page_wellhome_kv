// GET /api/products -> danh sách sản phẩm đang bán (đọc từ tab "Sản phẩm").
// Nếu chưa cấu hình / tab trống -> trả [] để web tự dùng dữ liệu đóng gói sẵn.
import { configured, getAccessToken, readProducts } from './_sheets.js'

let cache = { at: 0, data: null }
const TTL = 45000

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120')
  if (!configured()) return res.status(200).json([])
  try {
    if (cache.data && Date.now() - cache.at < TTL) return res.status(200).json(cache.data)
    const token = await getAccessToken()
    const list = await readProducts(token, false)
    cache = { at: Date.now(), data: list }
    return res.status(200).json(list)
  } catch (e) {
    return res.status(200).json(cache.data || [])
  }
}
