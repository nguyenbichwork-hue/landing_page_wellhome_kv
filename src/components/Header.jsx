import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { Icon, BrandMark } from './Icons.jsx'
import { useCart } from '../cart.jsx'
import { KOL } from '../config.js'

export default function Header() {
  const { count, setOpen } = useCart()
  const [menu, setMenu] = useState(false)
  const close = () => setMenu(false)

  return (
    <header className="header">
      <div className="wrap header-inner">
        <NavLink to="/" className="brand" onClick={close}>
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

        <nav className={`nav ${menu ? 'open' : ''}`}>
          <NavLink to="/" end onClick={close}>Trang chủ</NavLink>
          <a href="/#san-pham" onClick={close}>Sản phẩm</a>
          <a href="/#sale" className="nav-sale" onClick={close}>Sale sốc</a>
          <NavLink to="/lien-he" onClick={close}>Liên hệ</NavLink>
        </nav>

        <div className="header-actions">
          <button className="cart-btn" onClick={() => setOpen(true)} aria-label="Giỏ hàng">
            <Icon name="cart" size={22} />
            {count > 0 && <span className="cart-badge">{count}</span>}
          </button>
          <button className="nav-toggle" onClick={() => setMenu((m) => !m)} aria-label="Mở menu" aria-expanded={menu}>
            <Icon name={menu ? 'close' : 'menu'} size={24} />
          </button>
        </div>
      </div>
      {menu && <button className="nav-backdrop" aria-label="Đóng menu" onClick={close} />}
    </header>
  )
}
