import { useMemo, useRef, useState } from 'react'
import { useProducts } from '../useProducts.js'
import ProductCard from '../components/ProductCard.jsx'
import ProductModal from '../components/ProductModal.jsx'
import Hero from '../components/Hero.jsx'
import SaleBanner from '../components/SaleBanner.jsx'
import { Icon } from '../components/Icons.jsx'
import { categoryLabel, KOL, PERKS, BRANDS, WARRANTY, brandLabel } from '../config.js'
import { formatVND, productImage } from '../utils.js'

const PRICE_PRESETS = [
  { label: 'Dưới 500k', min: 0, max: 500000 },
  { label: '500k – 1tr', min: 500000, max: 1000000 },
  { label: '1tr – 3tr', min: 1000000, max: 3000000 },
  { label: 'Trên 3tr', min: 3000000, max: Infinity },
]

const noDia = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/* ---- Hàng sản phẩm cuộn ngang (cho từng hãng) ---- */
function HScroll({ products, onOpen }) {
  const ref = useRef(null)
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 320, behavior: 'smooth' })
  return (
    <div className="hrow-wrap">
      <button className="hrow-nav left" onClick={() => scroll(-1)} aria-label="Trước">‹</button>
      <div className="hrow" ref={ref}>
        {products.map((p) => (
          <div className="hrow-item" key={p.id}><ProductCard product={p} onOpen={onOpen} /></div>
        ))}
      </div>
      <button className="hrow-nav right" onClick={() => scroll(1)} aria-label="Sau">›</button>
    </div>
  )
}

export default function Home() {
  const { products } = useProducts()
  const [modal, setModal] = useState(null)

  // bộ lọc cho khu "Tất cả sản phẩm"
  const [brand, setBrand] = useState('all')
  const [cat, setCat] = useState('all')
  const [preset, setPreset] = useState(null)
  const [minP, setMinP] = useState('')
  const [maxP, setMaxP] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('featured')
  const [filterOpen, setFilterOpen] = useState(false)
  const allRef = useRef(null)

  const byBrand = (key) => products.filter((p) => p.brand === key)
  const activeBrands = BRANDS.filter((b) => byBrand(b.key).length > 0)

  // Sale sập sàn: % giảm cao nhất trên cả 3 hãng (ưu tiên có ảnh)
  const saleProducts = useMemo(() =>
    [...products].filter((p) => p.discountPct > 0)
      .sort((a, b) => (b.images.length ? 1 : 0) - (a.images.length ? 1 : 0) || b.discountPct - a.discountPct)
      .slice(0, 12)
  , [products])

  // Banner SALE tự lướt: SP gắn tag DEAL SỐC / FLASH SALE lên đầu, rồi bù thêm SP giảm sâu nhất
  const dealProducts = useMemo(() => {
    const tagged = [...products]
      .filter((p) => p.images.length && /deal|flash|sốc/i.test(p.badge || ''))
      .sort((a, b) => b.discountPct - a.discountPct)
    const ids = new Set(tagged.map((p) => p.id))
    const fill = saleProducts.filter((p) => !ids.has(p.id))
    return [...tagged, ...fill].slice(0, 8)
  }, [products, saleProducts])

  const brands = useMemo(() => {
    const m = {}; products.forEach((p) => (m[p.brand] = (m[p.brand] || 0) + 1))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [products])
  const cats = useMemo(() => {
    const m = {}; products.forEach((p) => (m[p.category] = (m[p.category] || 0) + 1))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [products])

  const list = useMemo(() => {
    let r = products.filter((p) => {
      if (brand !== 'all' && p.brand !== brand) return false
      if (cat !== 'all' && p.category !== cat) return false
      if (q && !noDia(p.name).includes(noDia(q))) return false
      const lo = preset ? preset.min : (minP ? +minP : 0)
      const hi = preset ? preset.max : (maxP ? +maxP : Infinity)
      if (p.kolPrice < lo || p.kolPrice > hi) return false
      return true
    })
    if (sort === 'price-asc') r = [...r].sort((a, b) => a.kolPrice - b.kolPrice)
    else if (sort === 'price-desc') r = [...r].sort((a, b) => b.kolPrice - a.kolPrice)
    else if (sort === 'discount') r = [...r].sort((a, b) => b.discountPct - a.discountPct)
    else r = [...r].sort((a, b) => (/deal/i.test(b.badge) - /deal/i.test(a.badge)) || b.discountPct - a.discountPct)
    return r
  }, [products, brand, cat, preset, minP, maxP, q, sort])

  const reset = () => { setBrand('all'); setCat('all'); setPreset(null); setMinP(''); setMaxP(''); setQ('') }
  const hasFilter = brand !== 'all' || cat !== 'all' || preset || minP || maxP || q

  const showBrandAll = (key) => {
    reset(); setBrand(key)
    setTimeout(() => allRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }
  const goShop = () => allRef.current?.scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      {/* ===== HERO (3 hãng) ===== */}
      <Hero products={products} onOpen={setModal} goShop={goShop} />

      {/* ===== BANNER SALE SỐC + ĐẾM NGƯỢC ===== */}
      <SaleBanner deals={dealProducts} onOpen={setModal} />

      {/* ===== SALE SẬP SÀN ===== */}
      {saleProducts.length > 0 && (
        <section className="section sale-section" id="sale">
          <div className="wrap">
            <div className="sale-head">
              <div className="sale-title">🔥 SALE SẬP SÀN <span>Giảm sốc nhất hôm nay</span></div>
              <button className="sale-allbtn" onClick={goShop}>Xem tất cả <Icon name="arrow" size={15} /></button>
            </div>
            <HScroll products={saleProducts} onOpen={setModal} />
          </div>
        </section>
      )}

      {/* ===== TỪNG HÃNG ===== */}
      {activeBrands.map((b) => {
        const items = byBrand(b.key)
        return (
          <section className="section brand-section" key={b.key} id={`brand-${b.key.toLowerCase()}`}>
            <div className="wrap">
              <div className="section-head">
                <div className="brand-head">
                  <span className="brand-chip" style={{ '--bc': b.color }}>{b.label}</span>
                  <div>
                    <h2>{b.label}</h2>
                    <p>{b.tagline}</p>
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => showBrandAll(b.key)}>
                  Xem tất cả {items.length} SP <Icon name="arrow" size={15} />
                </button>
              </div>
              <HScroll products={items.slice(0, 8)} onOpen={setModal} />
            </div>
          </section>
        )
      })}

      {/* ===== TẤT CẢ SẢN PHẨM ===== */}
      <section className="section" id="san-pham" ref={allRef}>
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Tất cả sản phẩm</h2>
              <p>Lọc theo hãng, nhóm sản phẩm và mức giá</p>
            </div>
            <span className="count-pill">{list.length} sản phẩm</span>
          </div>

          <div className="layout">
            {filterOpen && <div className="filter-backdrop" onClick={() => setFilterOpen(false)} />}
            <aside className={`filters ${filterOpen ? 'open' : ''}`}>
              <h3><Icon name="filter" size={17} /> Bộ lọc</h3>

              <div className="fgroup">
                <div className="lbl">Hãng</div>
                <div className="chip-list">
                  <button className={`chip ${brand === 'all' ? 'active' : ''}`} onClick={() => setBrand('all')}>
                    Tất cả hãng <span className="n">{products.length}</span>
                  </button>
                  {brands.map(([bk, n]) => (
                    <button key={bk} className={`chip ${brand === bk ? 'active' : ''}`} onClick={() => setBrand(bk)}>
                      {brandLabel(bk)} <span className="n">{n}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="fgroup">
                <div className="lbl">Nhóm sản phẩm</div>
                <div className="chip-list">
                  <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>
                    Tất cả nhóm <span className="n">{products.length}</span>
                  </button>
                  {cats.map(([c, n]) => (
                    <button key={c} className={`chip ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
                      {categoryLabel(c)} <span className="n">{n}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="fgroup">
                <div className="lbl">Khoảng giá</div>
                <div className="price-inputs">
                  <input type="number" placeholder="Từ" value={minP} onChange={(e) => { setMinP(e.target.value); setPreset(null) }} />
                  <span>—</span>
                  <input type="number" placeholder="Đến" value={maxP} onChange={(e) => { setMaxP(e.target.value); setPreset(null) }} />
                </div>
                <div className="price-presets">
                  {PRICE_PRESETS.map((p) => (
                    <button key={p.label} className={preset === p ? 'active' : ''}
                      onClick={() => { setPreset(preset === p ? null : p); setMinP(''); setMaxP('') }}>{p.label}</button>
                  ))}
                </div>
              </div>

              {hasFilter && <button className="clear-filters" onClick={reset}>✕ Xóa tất cả bộ lọc</button>}
            </aside>

            <div>
              <div className="toolbar">
                <button className="btn btn-ghost filter-toggle" onClick={() => setFilterOpen(true)}>
                  <Icon name="filter" size={16} /> Lọc
                </button>
                <div className="searchbar">
                  <Icon name="search" size={18} className="ic" />
                  <input placeholder="Tìm sản phẩm..." value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="featured">Nổi bật</option>
                  <option value="discount">Giảm giá nhiều</option>
                  <option value="price-asc">Giá thấp → cao</option>
                  <option value="price-desc">Giá cao → thấp</option>
                </select>
              </div>

              {list.length === 0 ? (
                <div className="empty">
                  <div className="big">🔍</div>
                  <p>Không tìm thấy sản phẩm phù hợp.</p>
                  <button className="btn btn-primary" onClick={reset}>Xóa bộ lọc</button>
                </div>
              ) : (
                <div className="grid">
                  {list.map((p) => <ProductCard key={p.id} product={p} onOpen={setModal} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {modal && <ProductModal product={modal} onClose={() => setModal(null)} />}
    </>
  )
}
