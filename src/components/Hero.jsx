import { Icon } from './Icons.jsx'
import { WARRANTY } from '../config.js'
import heroBanner from '../assets/hero-banner.jpg'

// Hero kiểu hannaholala.com: banner ảnh TRÀN VIỀN phía trên (như carousel camp
// của Hannah), dưới là khối chữ serif căn giữa + gạch ngang nhỏ + 2 nút đen/viền.
export default function Hero({ products, goShop, camp }) {
  const usps = [
    'Chính hãng 100%',
    'Miễn phí giao hàng & lắp đặt',
    WARRANTY,
    `${products.length}+ sản phẩm ưu đãi`,
  ]
  const banner = camp ? camp.hero_url : heroBanner

  return (
    <section className="hero">
      {banner && <img className="hero-full" src={banner} alt={camp?.title || 'WellHome — Gia dụng chính hãng'} />}
      <div className="hero-copy2">
        <div className="hero-eyebrow2">
          {camp?.kol_name ? `${camp.kol_name} • Chính hãng` : 'Chính hãng • Giá tốt nhất'}
        </div>
        <h1 className="hero-serif">{camp?.title || 'Gia dụng chính hãng'}</h1>
        <div className="hero-dash" />
        <p className="lead2">
          {camp?.tagline || (
            <>Sản phẩm chính hãng 100% từ <b>Tefal – Bosch – Smeg</b>. Giao hàng &amp; lắp đặt miễn phí, bảo hành linh hoạt 2–3 năm theo chính sách từng hãng.</>
          )}
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" onClick={goShop}><Icon name="bag" size={16} /> Mua sắm ngay</button>
          <a href="#sale" className="btn btn-ghost btn-lg">Xem ưu đãi hot</a>
        </div>
        <div className="hero-usp">
          {usps.map((u) => (
            <span key={u}><span className="tick">✓</span>{u}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
