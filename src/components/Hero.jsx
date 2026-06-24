import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icons.jsx'
import { BRANDS, WARRANTY } from '../config.js'
import { productImage, PLACEHOLDER } from '../utils.js'

export default function Hero({ products, onOpen, goShop }) {
  const byBrand = (k) => products.filter((p) => p.brand === k && p.images.length)
  const brandItems = useMemo(() => BRANDS.map((b) => ({ ...b, items: byBrand(b.key) })), [products])
  const slides = Math.min(5, Math.max(1, ...brandItems.map((b) => b.items.length || 1)))
  const [slide, setSlide] = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    timer.current = setInterval(() => setSlide((s) => (s + 1) % slides), 3500)
    return () => clearInterval(timer.current)
  }, [slides])
  const go = (d) => setSlide((s) => (s + d + slides) % slides)

  const perks = [
    { icon: 'star', big: `${products.length}+`, text: 'sản phẩm ưu đãi', c: 'p1' },
    { icon: 'shield', big: '', text: WARRANTY, c: 'p2' },
    { icon: 'truck', big: '0đ', text: 'Giao hàng & lắp đặt', c: 'p3' },
    { icon: 'check', big: '', text: 'Chính hãng 100%', c: 'p4' },
  ]

  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="hero-eyebrow"><span className="dot" /> CHÍNH HÃNG • GIÁ TỐT NHẤT</span>
          <h1>Gia dụng chính hãng<br /><span className="grad">giá ưu đãi riêng cho bạn</span></h1>
          <p className="lead">
            Sản phẩm chính hãng 100% từ <b>Tefal – Bosch – Smeg</b>. Giao hàng & lắp đặt 0đ,
            bảo hành linh hoạt 2–3 năm theo chính sách từng hãng.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={goShop}><Icon name="bag" size={18} /> Mua sắm ngay</button>
            <a href="#sale" className="btn btn-ghost btn-lg">🔥 Xem ưu đãi hot</a>
          </div>
          <div className="hero-perks">
            {perks.map((p) => (
              <div className={`hperk ${p.c}`} key={p.text}>
                <span className="hp-ic"><Icon name={p.icon} size={20} /></span>
                <div className="hp-txt">{p.big && <b>{p.big}</b>}<span>{p.text}</span></div>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-showcase">
          <div className="hs-panels">
            {brandItems.map((b) => {
              const prod = b.items.length ? b.items[slide % b.items.length] : null
              return (
                <div className={`hs-panel ${prod ? '' : 'empty'}`} key={b.key}
                  onClick={() => prod && onOpen(prod)} style={{ cursor: prod ? 'pointer' : 'default' }}>
                  <img className="hs-logo" src={b.logo} alt={b.label} />
                  {prod
                    ? <img className="hs-prod" src={productImage(prod)} alt={prod.name} />
                    : <div className="hs-soon"><img src={b.logo} alt="" /><span>Sắp ra mắt</span></div>}
                </div>
              )
            })}
          </div>
          <button className="hs-nav left" onClick={() => go(-1)} aria-label="Trước">‹</button>
          <button className="hs-nav right" onClick={() => go(1)} aria-label="Sau">›</button>
          <div className="hs-dots">
            {Array.from({ length: slides }).map((_, i) => (
              <button key={i} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)} aria-label={`Ảnh ${i + 1}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
