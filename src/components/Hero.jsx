import { Icon } from './Icons.jsx'
import { WARRANTY } from '../config.js'
import heroBanner from '../assets/hero-banner.jpg'

export default function Hero({ products, goShop }) {
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

        <div className="hero-banner-wrap">
          <img className="hero-banner-img" src={heroBanner} alt="WellHome × Nguyễn Phạm Khánh Vân — Gia dụng chính hãng Tefal, Bosch, Smeg" />
        </div>
      </div>
    </section>
  )
}
