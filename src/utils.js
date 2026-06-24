export const formatVND = (n) =>
  (n || 0).toLocaleString('vi-VN') + 'đ'

export const slug = (s) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// Placeholder ảnh khi sản phẩm chưa có ảnh từ Haravan
export const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#E3F2FD"/><text x="50%" y="50%" font-family="sans-serif" font-size="22" fill="#90CAF9" text-anchor="middle" dy=".3em">Đang cập nhật ảnh</text></svg>`
  )

export const productImage = (p, i = 0) =>
  (p.images && p.images[i]) || PLACEHOLDER

// Trích các đoạn mô tả/thông số gọn từ body_html của Haravan
export function parseDescription(html) {
  if (!html) return { sections: [] }
  if (typeof window === 'undefined') return { sections: [] }
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const sections = []
  let current = { title: '', items: [], paras: [] }
  doc.body.childNodes.forEach((node) => {
    if (node.nodeType !== 1) return
    const tag = node.tagName.toLowerCase()
    const text = node.textContent.trim()
    if (!text) return
    if (tag === 'p' && node.querySelector('strong') && text.length < 80 && !text.includes('.')) {
      if (current.title || current.items.length || current.paras.length) sections.push(current)
      current = { title: text, items: [], paras: [] }
    } else if (tag === 'ul' || tag === 'ol') {
      node.querySelectorAll('li').forEach((li) => {
        const t = li.textContent.trim()
        if (t) current.items.push(t)
      })
    } else if (tag === 'p') {
      current.paras.push(text)
    }
  })
  if (current.title || current.items.length || current.paras.length) sections.push(current)
  // bỏ phần "Giá bán" để tránh lộ giá Haravan (đã có giá KOL)
  sections.forEach((s) => {
    s.items = s.items.filter((it) => !/giá bán/i.test(it))
  })
  return { sections }
}
