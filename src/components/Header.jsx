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
          <BrandMark size={32} />
          <span className="brand-logo">
            <span className="wh">WellHome</span>
            <span className="x">×</span>
            <span className="tf">Tefal</span>
          </span>
          <span className="brand-kol">KOL<b>{KOL.name}</b></span>
        </NavLink>

        <nav className="nav">
          <NavLink to="/" end>Trang chủ</NavLink>
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
