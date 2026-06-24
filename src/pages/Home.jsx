import { useMemo, useState } from 'react'
import productsData from '../data/products.json'
import ProductCard from '../components/ProductCard.jsx'
import ProductModal from '../components/ProductModal.jsx'
import { Icon } from '../components/Icons.jsx'
import { useCart } from '../cart.jsx'
import { categoryLabel, KOL, PERKS } from '../config.js'
import { formatVND, productImage } from '../utils.js'

const PRICE_PRESETS = [
  { label: 'Dưới 500k', min: 0, max: 500000 },
  { label: '500k – 1tr', min: 500000, max: 1000000 },
  { label: '1tr – 3tr', min: 1000000, max: 3000000 },
  { label: 'Trên 3tr', min: 3000000, max: Infinity },
]

export default function Home() {
  const { add } = useCart()
  const [brand, setBrand] = useState('all')
  const [cat, setCat] = useState('all')
  const [preset, setPreset] = useState(null)
  const [minP, setMinP] = useState('')
  const [maxP, setMaxP] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('featured')
  const [modal, setModal] = useState(null)
  const [filterOpen, setFilterOpen] = useState(false)

  const brands = useMemo(() => {
    const m = {}; productsData.forEach((p) => (m[p.brand] = (m[p.brand] || 0) + 1))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [])
  const cats = useMemo(() => {
    const m = {}; productsData.forEach((p) => (m[p.category] = (m[p.category] || 0) + 1))
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [])

  const list = useMemo(() => {
    let r = productsData.filter((p) => {
      if (brand !== 'all' && p.brand !== brand) return false
      if (cat !== 'all' && p.category !== cat) return false
      if (q && !p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .includes(q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))) return false
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
  }, [brand, cat, preset, minP, maxP, q, sort])

  const featured = useMemo(() =>
    [...productsData].filter((p) => p.images.length).sort((a, b) => b.discountPct - a.discountPct)[0]
  , [])

  const reset = () => { setBrand('all'); setCat('all'); setPreset(null); setMinP(''); setMaxP(''); setQ('') }
  const hasFilter = brand !== 'all' || cat !== 'all' || preset || minP || maxP || q

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <span className="hero-eyebrow"><span className="dot" /> {KOL.campaign}</span>
            <h1>Gia dụng <span className="grad">Tefal chính hãng</span><br />giá ưu đãi riêng cho bạn</h1>
            <p className="lead">
              Trang mua sắm độc quyền của KOL <b>{KOL.name}</b> cùng WellHome. Sản phẩm chính hãng 100%,
              giá tốt nhất — giao hàng & lắp đặt 0đ, bảo hành 2 năm.
            </p>
            <div className="hero-cta">
              <a href="#san-pham" className="btn btn-primary btn-lg"><Icon name="bag" size={18} /> Mua sắm ngay</a>
              <a href="#san-pham" className="btn btn-ghost btn-lg">Xem ưu đãi sốc</a>
            </div>
            <div className="hero-stats">
              <div className="s"><b>{productsData.length}+</b><span>Sản phẩm ưu đãi</span></div>
              <div className="s"><b>2 năm</b><span>Bảo hành chính hãng</span></div>
              <div className="s"><b>0đ</b><span>Giao & lắp đặt</span></div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="sun" />
            <div className="wave" />
            {featured && (
              <div className="hero-card" onClick={() => setModal(featured)} style={{ cursor: 'pointer' }}>
                {featured.discountPct > 0 && <div className="tag">-{featured.discountPct}%</div>}
                <img src={productImage(featured)} alt={featured.name} />
                <div className="t">{featured.name}</div>
                <div>
                  <span className="price">{formatVND(featured.kolPrice)}</span>
                  {featured.rspPrice > featured.kolPrice && <span className="old">{formatVND(featured.rspPrice)}</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PERKS */}
      <div className="wrap">
        <div className="perks">
          {PERKS.map((p, i) => (
            <div className={`perk b${i + 1}`} key={p.text}>
              <span className="ic"><Icon name={p.icon} size={18} /></span>{p.text}
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCTS */}
      <section className="section" id="san-pham">
        <div className="wrap">
          <div className="section-head">
            <div>
              <h2>Tất cả sản phẩm</h2>
              <p>Chọn lọc các sản phẩm Tefal tốt nhất với giá ưu đãi KOL</p>
            </div>
            <span className="count-pill">{list.length} sản phẩm</span>
          </div>

          <div className="layout">
            {/* FILTERS */}
            {filterOpen && <div className="filter-backdrop" onClick={() => setFilterOpen(false)} />}
            <aside className={`filters ${filterOpen ? 'open' : ''}`}>
              <h3><Icon name="filter" size={17} /> Bộ lọc</h3>

              <div className="fgroup">
                <div className="lbl">Hãng</div>
                <div className="chip-list">
                  <button className={`chip ${brand === 'all' ? 'active' : ''}`} onClick={() => setBrand('all')}>
                    Tất cả hãng <span className="n">{productsData.length}</span>
                  </button>
                  {brands.map(([b, n]) => (
                    <button key={b} className={`chip ${brand === b ? 'active' : ''}`} onClick={() => setBrand(b)}>
                      {b} <span className="n">{n}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="fgroup">
                <div className="lbl">Nhóm sản phẩm</div>
                <div className="chip-list">
                  <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>
                    Tất cả nhóm <span className="n">{productsData.length}</span>
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
                  <input type="number" placeholder="Từ" value={minP}
                    onChange={(e) => { setMinP(e.target.value); setPreset(null) }} />
                  <span>—</span>
                  <input type="number" placeholder="Đến" value={maxP}
                    onChange={(e) => { setMaxP(e.target.value); setPreset(null) }} />
                </div>
                <div className="price-presets">
                  {PRICE_PRESETS.map((p) => (
                    <button key={p.label} className={preset === p ? 'active' : ''}
                      onClick={() => { setPreset(preset === p ? null : p); setMinP(''); setMaxP('') }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {hasFilter && <button className="clear-filters" onClick={reset}>✕ Xóa tất cả bộ lọc</button>}
            </aside>

            {/* GRID */}
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
