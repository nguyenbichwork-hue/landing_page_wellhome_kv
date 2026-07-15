import { Icon } from './Icons.jsx'
import { WARRANTY } from '../config.js'
import heroBanner from '../assets/hero-banner.jpg'

export default function Hero({ products, goShop, camp }) {
  const perks = [
    { icon: 'star', big: `${products.length}+`, text: 'sản phẩm ưu đãi', c: 'p1' },
    { icon: 'shield', big: '', text: WARRANTY, c: 'p2' },
    { icon: 'truck', big: 'Miễn phí', text: 'Giao hàng & lắp đặt', c: 'p3' },
    { icon: 'check', big: '', text: 'Chính hãng 100%', c: 'p4' },
  ]

  return (
    <section className="hero">
      <div className="wrap hero-inner">
        <div className="hero-copy">
          <span className="hero-eyebrow"><span className="dot" /> {camp?.kol_name ? `✨ ${camp.kol_name.toUpperCase()} • CHÍNH HÃNG` : 'CHÍNH HÃNG • GIÁ TỐT NHẤT'}</span>
          {camp
            ? <h1>{camp.title}<br /><span className="grad">{camp.tagline || 'giá ưu đãi riêng cho bạn'}</span></h1>
            : <h1>Gia dụng chính hãng<br /><span className="grad">giá ưu đãi riêng cho bạn</span></h1>}
          <p className="lead">
            Sản phẩm chính hãng 100% từ <b>Tefal – Bosch – Smeg</b>. Giao hàng & lắp đặt miễn phí,
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

        <div className="hero-banner-wrap">
          {camp && !camp.hero_url ? (
            /* Trang camp CHƯA đặt ảnh hero → khối gradient trung tính (không dùng ảnh KOL khác) */
            <div className="hero-banner-img" style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,#0284C7,#38BDF8)', color: '#fff', minHeight: 320,
              borderRadius: 24, textAlign: 'center', padding: 24,
            }}>
              <div style={{ fontSize: 44 }}>🛍️</div>
              <div style={{ fontWeight: 900, fontSize: 24, marginTop: 8 }}>{camp.title}</div>
              {camp.kol_name && <div style={{ opacity: .9, marginTop: 6, fontWeight: 700 }}>✨ cùng {camp.kol_name}</div>}
            </div>
          ) : (
            <img className="hero-banner-img" src={camp?.hero_url || heroBanner} alt="WellHome — Gia dụng chính hãng" />
          )}
        </div>
      </div>
    </section>
  )
}
