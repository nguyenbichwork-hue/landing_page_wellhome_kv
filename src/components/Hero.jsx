import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from './Icons.jsx'
import { WARRANTY } from '../config.js'
import { productImage } from '../utils.js'

export default function Hero({ products, onOpen, goShop }) {
  // Chỉ lấy sản phẩm ĐÃ CÓ trên web (có ảnh) làm showcase
  const showItems = useMemo(() =>
    products.filter((p) => p.images.length)
      .sort((a, b) => (/deal/i.test(b.badge) - /deal/i.test(a.badge)) || b.discountPct - a.discountPct)
      .slice(0, 12)
  , [products])

  const perView = 3
  const slides = Math.max(1, Math.ceil(showItems.length / perView))
  const [slide, setSlide] = useState(0)
  const timer = useRef(null)
  useEffect(() => {
    if (slides <= 1) return
    timer.current = setInterval(() => setSlide((s) => (s + 1) % slides), 3800)
    return () => clearInterval(timer.current)
  }, [slides])
  const go = (d) => setSlide((s) => (s + d + slides) % slides)

  const view = showItems.length
    ? Array.from({ length: perView }, (_, i) => showItems[(slide * perView + i) % showItems.length])
    : []

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

        {view.length > 0 && (
          <div className="hero-showcase">
            <div className="hs-panels">
              {view.map((p, i) => (
                <div className="hs-panel" key={p ? p.id + '-' + i : i} onClick={() => p && onOpen(p)}>
                  {p && <img className="hs-banner" src={productImage(p)} alt={p.name} />}
                </div>
              ))}
            </div>
            {slides > 1 && <>
              <button className="hs-nav left" onClick={() => go(-1)} aria-label="Trước">‹</button>
              <button className="hs-nav right" onClick={() => go(1)} aria-label="Sau">›</button>
              <div className="hs-dots">
                {Array.from({ length: slides }).map((_, i) => (
                  <button key={i} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)} aria-label={`Trang ${i + 1}`} />
                ))}
              </div>
            </>}
          </div>
        )}
      </div>
    </section>
  )
}
