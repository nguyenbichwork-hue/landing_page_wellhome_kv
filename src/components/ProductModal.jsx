import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icons.jsx'
import { useCart } from '../cart.jsx'
import { formatVND, parseDescription, PLACEHOLDER } from '../utils.js'
import { categoryLabel, PERKS } from '../config.js'

export default function ProductModal({ product, onClose }) {
  const { add, setOpen } = useCart()
  const navigate = useNavigate()
  const [active, setActive] = useState(0)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', h)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', h) }
  }, [onClose])

  const imgs = product.images && product.images.length ? product.images : [PLACEHOLDER]
  const desc = useMemo(() => parseDescription(product.descriptionHtml), [product])
  const save = product.rspPrice - product.kolPrice
  const isHot = /deal/i.test(product.badge || '')
  const stock = +product.stock || 0
  const soldOut = stock <= 0
  const maxQ = stock > 0 ? stock : 1

  const buyNow = () => { add(product, qty); setOpen(false); onClose(); navigate('/thanh-toan') }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Đóng"><Icon name="close" /></button>

        <div className="modal-scroll">
          <div className="modal-gallery">
            <div className="modal-main-img">
              <img src={imgs[active] || PLACEHOLDER} alt={product.name} />
            </div>
            {imgs.length > 1 && (
              <div className="modal-thumbs">
                {imgs.slice(0, 10).map((src, i) => (
                  <button key={i} className={i === active ? 'active' : ''} onClick={() => setActive(i)}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="modal-info">
            <div className="cat">{categoryLabel(product.category)}{isHot && <span className="deal-tag" style={{ marginLeft: 8, marginBottom: 0 }}><Icon name="spark" size={11} /> Deal sốc</span>}</div>
            <h2>{product.name}</h2>
            <div className="code">Mã SP: {product.cmmf} · {product.brand}</div>

            <div className="modal-price">
              <span className="now">{formatVND(product.kolPrice)}</span>
              {product.rspPrice > product.kolPrice && <span className="was">{formatVND(product.rspPrice)}</span>}
              {save > 0 && <span className="save">Tiết kiệm {formatVND(save)}</span>}
            </div>
            <div className="modal-stock" style={soldOut ? { color: 'var(--tefal)' } : {}}>
              {soldOut ? '✕ Tạm hết hàng' : (stock <= 5 ? `● Chỉ còn ${stock} sản phẩm` : '● Còn hàng — sẵn sàng giao')}
            </div>

            <div className="modal-perks">
              {PERKS.map((p) => (
                <span className="mp" key={p.text}><Icon name={p.icon} size={15} />{p.text}</span>
              ))}
            </div>

            {desc.sections.length > 0 && (
              <div className="desc">
                {desc.sections.map((s, i) => (
                  <div key={i}>
                    {s.title && <h4><Icon name="check" size={15} />{s.title}</h4>}
                    {s.paras.map((p, j) => <p key={j}>{p}</p>)}
                    {s.items.length > 0 && (
                      <ul>{s.items.map((it, j) => <li key={j}>{it}</li>)}</ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-actionbar">
          <div className="qty">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Giảm"><Icon name="minus" size={15} /></button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => Math.min(maxQ, q + 1))} disabled={soldOut || qty >= maxQ} aria-label="Tăng"><Icon name="plus" size={15} /></button>
          </div>
          <button className="btn btn-ghost" disabled={soldOut} onClick={() => { add(product, qty); onClose() }}>
            <Icon name="cart" size={17} /> Thêm giỏ
          </button>
          <button className="btn btn-accent" disabled={soldOut} onClick={buyNow}>
            {soldOut ? 'Hết hàng' : <>Mua ngay <Icon name="arrow" size={17} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
