import { NavLink } from 'react-router-dom'
import { Icon, BrandMark } from './Icons.jsx'
import { useCart } from '../cart.jsx'
import { KOL } from '../config.js'

export default function Header() {
  const { count, setOpen } = useCart()
  return (
    <header className="header">
      <div className="wrap header-inner">
        <NavLink to="/" className="brand">
          <BrandMark size={42} />
          <div className="brand-text">
            <div className="brand-line1">
              <span className="wh">WellHome</span>
              <span className="x">✕</span>
              <span className="kvn">{KOL.fullName}</span>
            </div>
            <div className="brand-line2">{KOL.tagline}</div>
          </div>
        </NavLink>

        <nav className="nav">
          <NavLink to="/" end>Trang chủ</NavLink>
          <a href="/#san-pham">Sản phẩm</a>
          <a href="/#sale" className="nav-sale">Sale sốc</a>
          <NavLink to="/lien-he">Liên hệ</NavLink>
          <button className="cart-btn" onClick={() => setOpen(true)} aria-label="Giỏ hàng">
            <Icon name="cart" size={22} />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
        </nav>
      </div>
    </header>
  )
}
