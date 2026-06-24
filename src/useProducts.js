import { useEffect, useState } from 'react'
import bundled from './data/products.json'

// Chuẩn hoá 1 sản phẩm (từ sheet hoặc bundled) về cùng shape.
function normalize(p) {
  return {
    id: p.id || p.cmmf,
    cmmf: p.cmmf,
    name: p.name,
    brand: (p.brand || 'TEFAL').toUpperCase(),
    category: p.category || 'Khác',
    rspPrice: +p.rspPrice || 0,
    kolPrice: +p.kolPrice || 0,
    discountPct: +p.discountPct || 0,
    stock: +p.stock || 0,
    badge: p.badge || '',
    haravanId: p.haravanId || null,
    handle: p.handle || null,
    variantId: p.variantId || null,
    images: Array.isArray(p.images) ? p.images : (p.images ? String(p.images).split('|').filter(Boolean) : []),
    productType: p.productType || p.category || '',
    descriptionHtml: p.descriptionHtml || '',
    matched: p.matched !== false,
  }
}

const BUNDLED = bundled.map(normalize)

// Hook: trả về danh sách SP. Hiển thị ngay dữ liệu sẵn có, rồi cập nhật từ /api/products nếu có.
export function useProducts() {
  const [products, setProducts] = useState(BUNDLED)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetch('/api/products')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return
        const arr = Array.isArray(d) ? d : (d && Array.isArray(d.products) ? d.products : null)
        if (arr && arr.length) setProducts(arr.map(normalize))
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  return { products, loading }
}
