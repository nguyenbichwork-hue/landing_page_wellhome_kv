import { NavLink } from 'react-router-dom'
import { Icon, BrandMark } from './Icons.jsx'
import { COMPANY, KOL } from '../config.js'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-top">
        <div>
          <div className="f-brand">
            <BrandMark size={32} />
            WellHome <span style={{ color: '#7DD3FC', fontWeight: 500, fontSize: 18 }}>×</span> <span style={{ color: '#FF6B5E' }}>Tefal</span>
          </div>
          <p>Trang mua sắm chính thức của KOL <b style={{ color: '#fff' }}>{KOL.name}</b> — đồ gia dụng Tefal chính hãng với giá ưu đãi độc quyền. Hợp tác minh bạch cùng WellHome Việt Nam.</p>
          <p style={{ fontSize: 12.5, color: '#8fb0db' }}>{COMPANY.copyright}</p>
        </div>

        <div>
          <h4>Liên kết</h4>
          <NavLink to="/" className="f-link">Trang chủ</NavLink>
          <NavLink to="/lien-he" className="f-link">Liên hệ</NavLink>
          <a className="f-link" href="https://wellhome.asia" target="_blank" rel="noreferrer">WellHome.asia</a>
        </div>

        <div>
          <h4>Thông tin liên hệ</h4>
          <div className="f-contact"><Icon name="pin" size={18} className="ic" /><span>{COMPANY.address}</span></div>
          <div className="f-contact"><Icon name="phone" size={18} className="ic" /><span>Hotline: {COMPANY.hotline}</span></div>
          <div className="f-contact"><Icon name="mail" size={18} className="ic" /><span>{COMPANY.email}</span></div>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>{COMPANY.copyright}</span>
        <span>Chịu trách nhiệm nội dung: {COMPANY.contentResponsibility}</span>
      </div>
    </footer>
  )
}
