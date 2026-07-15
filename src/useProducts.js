import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import bundled from './data/products.json'
import { SUPA, campSlugFromPath, saveCampMeta } from './config.js'

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

// Chuẩn hoá SP landing camp (RPC landing_catalog) về cùng shape với products.json.
function normalizeCamp(p) {
  return normalize({
    id: p.cmmf, cmmf: p.cmmf, name: p.name, brand: p.brand || 'TEFAL',
    category: p.category || 'Khác', rspPrice: p.rspPrice || 0, kolPrice: p.kolPrice || 0,
    discountPct: p.rspPrice > 0 ? Math.round((1 - p.kolPrice / p.rspPrice) * 100) : 0,
    stock: 99, badge: p.badge || (p.gift ? '🎁 Quà tặng kèm' : ''),
    images: p.images, descriptionHtml: [p.descriptionHtml, p.gift ? `<p><b>🎁 Quà tặng:</b> ${p.gift}</p>` : ''].filter(Boolean).join(''),
  })
}

// Hook: trả về danh sách SP. Trang camp /c/<slug> → đọc từ hệ Wellhome (landing_catalog);
// trang gốc → dữ liệu sẵn có + /api/products như cũ.
export function useProducts() {
  const { pathname } = useLocation()
  const campSlug = campSlugFromPath(pathname)
  const [products, setProducts] = useState(campSlug ? [] : BUNDLED)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!campSlug) return undefined
    let alive = true
    setLoading(true)
    fetch(`${SUPA.url}/rest/v1/rpc/landing_catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPA.anon, Authorization: `Bearer ${SUPA.anon}` },
      body: JSON.stringify({ p_slug: campSlug }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return
        if (d && d.ok) {
          saveCampMeta({ ...d.page, slug: campSlug })
          setProducts((d.products || []).map(normalizeCamp))
        } else {
          setProducts([])
        }
      })
      .catch(() => alive && setProducts([]))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [campSlug])

  useEffect(() => {
    if (campSlug) return undefined
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
  }, [campSlug])

  return { products, loading }
}
