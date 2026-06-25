import { useNavigate } from 'react-router-dom'
import { Icon } from './Icons.jsx'
import { useCart } from '../cart.jsx'
import { formatVND, PLACEHOLDER } from '../utils.js'

export default function CartDrawer() {
  const { items, open, setOpen, setQty, remove, total, savings } = useCart()
  const navigate = useNavigate()
  if (!open) return null

  const goCheckout = () => { setOpen(false); navigate('/thanh-toan') }

  return (
    <>
      <div className="drawer-overlay" onClick={() => setOpen(false)} />
      <aside className="drawer">
        <div className="drawer-head">
          <h3><Icon name="cart" size={20} /> Giỏ hàng {items.length > 0 && `(${items.length})`}</h3>
          <button className="ci-remove" onClick={() => setOpen(false)} aria-label="Đóng"><Icon name="close" /></button>
        </div>

        {items.length === 0 ? (
          <div className="drawer-empty">
            <div className="big">🛒</div>
            <p>Giỏ hàng đang trống.<br />Khám phá các sản phẩm Tefal ưu đãi nhé!</p>
            <button className="btn btn-primary" onClick={() => setOpen(false)} style={{ marginTop: 14 }}>Tiếp tục mua sắm</button>
          </div>
        ) : (
          <>
            <div className="drawer-body">
              {items.map((it) => (
                <div className="cart-item" key={it.id}>
                  <img src={it.image || PLACEHOLDER} alt={it.name} />
                  <div className="ci-body">
                    <div className="ci-name">{it.name}</div>
                    <div className="ci-price">{formatVND(it.price)}</div>
                    <div className="ci-row">
                      <div className="qty-mini">
                        <button onClick={() => setQty(it.id, it.qty - 1)}><Icon name="minus" size={14} /></button>
                        <span>{it.qty}</span>
                        <button onClick={() => setQty(it.id, it.qty + 1)} disabled={it.stock > 0 && it.qty >= it.stock}><Icon name="plus" size={14} /></button>
                      </div>
                      <button className="ci-remove" onClick={() => remove(it.id)} aria-label="Xóa"><Icon name="trash" size={17} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="drawer-foot">
              {savings > 0 && (
                <div className="save-note">🎉 Bạn đang tiết kiệm {formatVND(savings)} so với giá gốc!</div>
              )}
              <div className="row total"><span>Tổng cộng</span><span className="v">{formatVND(total)}</span></div>
              <button className="btn btn-accent btn-block btn-lg" onClick={goCheckout}>
                Tiến hành thanh toán <Icon name="arrow" size={18} />
              </button>
              <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setOpen(false)}>
                Tiếp tục mua sắm
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
