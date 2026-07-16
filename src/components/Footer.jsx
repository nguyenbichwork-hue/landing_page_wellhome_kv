import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Icon } from './Icons.jsx'
import { COMPANY, KOL, getCampMeta, campSlugFromPath } from '../config.js'

// Footer kiểu hannaholala.com: nền TRẮNG, chữ đen/ghi, viền trên mảnh.
// 16/07: nội dung footer SỬA ĐƯỢC trong Landing Studio (landing_pages.footer)
// — trang camp đọc từ meta, không có thì dùng mặc định COMPANY.
export default function Footer() {
  const [camp, setCamp] = useState(() => (campSlugFromPath(window.location.pathname) ? getCampMeta() : null))
  useEffect(() => {
    const fn = () => setCamp(campSlugFromPath(window.location.pathname) ? getCampMeta() : null)
    window.addEventListener('wh-camp-meta', fn)
    window.addEventListener('popstate', fn)
    return () => { window.removeEventListener('wh-camp-meta', fn); window.removeEventListener('popstate', fn) }
  }, [])
  const f = camp?.footer || {}
  const kol = camp?.kol_name || KOL.fullName

  return (
    <footer className="footer">
      <div className="wrap footer-top">
        <div>
          <div className="f-brand">WELLHOME</div>
          <p>
            <b style={{ color: '#111' }}>WellHome đồng hành cùng {kol}</b>
            {' — '}{f.mo_ta || 'đồ gia dụng Tefal · Bosch · Smeg chính hãng với giá ưu đãi độc quyền. Hợp tác minh bạch cùng WellHome Việt Nam.'}
          </p>
          <p style={{ fontSize: 12.5, color: '#8A8F98' }}>{f.copyright || COMPANY.copyright}</p>
        </div>

        <div>
          <h4>Liên kết</h4>
          <NavLink to="/" className="f-link">Trang chủ</NavLink>
          <NavLink to="/lien-he" className="f-link">Liên hệ</NavLink>
          <a className="f-link" href="https://wellhome.asia" target="_blank" rel="noreferrer">WellHome.asia</a>
        </div>

        <div>
          <h4>Thông tin liên hệ</h4>
          <div className="f-contact"><Icon name="pin" size={18} className="ic" /><span>{f.dia_chi || COMPANY.address}</span></div>
          <div className="f-contact"><Icon name="phone" size={18} className="ic" /><span>Hotline: {f.hotline || COMPANY.hotline}</span></div>
          <div className="f-contact"><Icon name="mail" size={18} className="ic" /><span>{f.email || COMPANY.email}</span></div>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>{f.copyright || COMPANY.copyright}</span>
        <span>Chịu trách nhiệm nội dung: {f.chiu_trach_nhiem || COMPANY.contentResponsibility}</span>
      </div>
    </footer>
  )
}
