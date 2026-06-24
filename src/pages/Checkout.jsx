import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icons.jsx'
import { useCart } from '../cart.jsx'
import { formatVND, PLACEHOLDER } from '../utils.js'
import { PROVINCES } from '../data/provinces.js'
import { ORDER_ENDPOINT, KOL, COMPANY } from '../config.js'

const PAY_METHODS = [
  { id: 'COD', emoji: '💵', title: 'Thanh toán khi nhận hàng (COD)', desc: 'Thanh toán tiền mặt khi nhận sản phẩm' },
  { id: 'BANK', emoji: '🏦', title: 'Chuyển khoản ngân hàng', desc: 'Nhân viên gửi thông tin chuyển khoản sau khi đặt' },
]

function genOrderCode() {
  const t = new Date()
  const p = (n) => String(n).padStart(2, '0')
  const rnd = Math.floor(1000 + Math.random() * 9000)
  return `KV${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}-${rnd}`
}

export default function Checkout() {
  const { items, total, savings, clear } = useCart()
  const navigate = useNavigate()
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '', province: '', note: '' })
  const [pay, setPay] = useState('COD')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const [failed, setFailed] = useState(false)
  // Sinh mã đơn 1 lần khi vào trang -> chống ghi trùng khi khách bấm/thử lại nhiều lần (idempotency)
  const [orderCode] = useState(genOrderCode)

  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: '' })) }

  // Gửi đơn với retry + kiểm tra phản hồi thật từ Apps Script
  async function postOrder(payload, tries = 3) {
    for (let i = 0; i < tries; i++) {
      try {
        const r = await fetch(ORDER_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow',
        })
        if (r.ok) {
          try { const j = await r.json(); if (j && j.ok === false) throw new Error(j.error || 'server') } catch (_) { /* phản hồi không JSON nhưng HTTP ok -> coi như nhận */ }
          return true
        }
      } catch (err) {
        console.warn(`order post attempt ${i + 1} failed`, err)
      }
      if (i < tries - 1) await new Promise((res) => setTimeout(res, 800 * (i + 1)))
    }
    return false
  }

  const validate = () => {
    const er = {}
    if (!f.name.trim()) er.name = 'Vui lòng nhập họ tên'
    if (!/^0\d{9,10}$/.test(f.phone.replace(/\s/g, ''))) er.phone = 'Số điện thoại không hợp lệ'
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) er.email = 'Email không hợp lệ'
    if (!f.address.trim()) er.address = 'Vui lòng nhập địa chỉ'
    if (!f.province) er.province = 'Vui lòng chọn tỉnh/thành'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      document.querySelector('.field.err')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    setFailed(false)
    const payload = {
      orderCode,
      kol: KOL.name,
      kolCode: KOL.code,
      createdAt: new Date().toISOString(),
      customer: { ...f, phone: f.phone.replace(/\s/g, '') },
      payment: PAY_METHODS.find((m) => m.id === pay)?.title,
      paymentCode: pay,
      items: items.map((it) => ({
        cmmf: it.cmmf, name: it.name, price: it.price, qty: it.qty, lineTotal: it.price * it.qty,
        variantId: it.variantId,
      })),
      itemCount: items.reduce((s, x) => s + x.qty, 0),
      subtotal: total,
      savings,
      total,
      source: 'khanhvan.wellhome.asia',
    }

    const ok = await postOrder(payload)
    setSubmitting(false)

    if (ok) {
      setDone({ orderCode, total: payload.total, name: f.name, payment: payload.payment })
      clear()
    } else {
      // KHÔNG báo thành công giả. Giữ giỏ hàng để không mất đơn, hiện hotline để khách chốt đơn.
      setFailed(true)
      document.querySelector('.co-fail')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (done) {
    return (
      <div className="wrap checkout">
        <div className="success">
          <div className="ring"><Icon name="check" size={46} /></div>
          <h2>Đặt hàng thành công! 🎉</h2>
          <p>Cảm ơn <b>{done.name}</b> đã mua sắm cùng KOL {KOL.name}.</p>
          <div className="order-code">Mã đơn: {done.orderCode}</div>
          <p>Tổng thanh toán: <b style={{ color: 'var(--tefal)', fontSize: 18 }}>{formatVND(done.total)}</b></p>
          <p>Hình thức: {done.payment}</p>
          <p style={{ marginTop: 14 }}>Nhân viên WellHome sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng. Mọi thắc mắc xin gọi <b>{COMPANY.hotline}</b>.</p>
          <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: 22 }}>
            <Icon name="bag" size={18} /> Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="wrap checkout">
        <div className="empty" style={{ background: '#fff', borderRadius: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div className="big">🛒</div>
          <h2 style={{ margin: '0 0 8px' }}>Giỏ hàng trống</h2>
          <p>Bạn chưa có sản phẩm nào để thanh toán.</p>
          <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: 14 }}>Khám phá sản phẩm</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap checkout">
      <div className="section-head" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 28 }}>Thanh toán</h2>
          <p>Hoàn tất thông tin để đặt hàng — đơn của bạn sẽ được KOL {KOL.name} ghi nhận riêng.</p>
        </div>
        <Link to="/" style={{ color: 'var(--sky-600)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          ← Tiếp tục mua sắm
        </Link>
      </div>

      <form className="checkout-grid" onSubmit={submit}>
        <div>
          <div className="co-card">
            <h3><Icon name="truck" size={20} /> Thông tin giao hàng</h3>
            <p className="sub">Vui lòng điền chính xác để nhận hàng nhanh nhất.</p>

            <div className={`field ${errors.name ? 'err' : ''}`}>
              <label>Họ và tên <span className="req">*</span></label>
              <input value={f.name} onChange={set('name')} placeholder="Nguyễn Văn A" />
              {errors.name && <div className="msg">{errors.name}</div>}
            </div>

            <div className="grid2">
              <div className={`field ${errors.phone ? 'err' : ''}`}>
                <label>Số điện thoại <span className="req">*</span></label>
                <input value={f.phone} onChange={set('phone')} placeholder="0901234567" inputMode="tel" />
                {errors.phone && <div className="msg">{errors.phone}</div>}
              </div>
              <div className={`field ${errors.email ? 'err' : ''}`}>
                <label>Email</label>
                <input value={f.email} onChange={set('email')} placeholder="email@example.com" inputMode="email" />
                {errors.email && <div className="msg">{errors.email}</div>}
              </div>
            </div>

            <div className={`field ${errors.province ? 'err' : ''}`}>
              <label>Tỉnh / Thành phố <span className="req">*</span></label>
              <select value={f.province} onChange={set('province')}>
                <option value="">— Chọn tỉnh / thành —</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.province && <div className="msg">{errors.province}</div>}
            </div>

            <div className={`field ${errors.address ? 'err' : ''}`}>
              <label>Địa chỉ nhận hàng <span className="req">*</span></label>
              <input value={f.address} onChange={set('address')} placeholder="Số nhà, đường, phường/xã, quận/huyện" />
              {errors.address && <div className="msg">{errors.address}</div>}
            </div>

            <div className="field">
              <label>Ghi chú đơn hàng</label>
              <textarea rows="2" value={f.note} onChange={set('note')} placeholder="Thời gian giao, yêu cầu khác..." />
            </div>
          </div>

          <div className="co-card">
            <h3><Icon name="shield" size={20} /> Phương thức thanh toán</h3>
            <p className="sub">Chọn cách thanh toán phù hợp với bạn.</p>
            <div className="pay-options">
              {PAY_METHODS.map((m) => (
                <label key={m.id} className={`pay-opt ${pay === m.id ? 'active' : ''}`}>
                  <span className="radio" />
                  <input type="radio" name="pay" value={m.id} checked={pay === m.id}
                    onChange={() => setPay(m.id)} style={{ display: 'none' }} />
                  <span className="emoji">{m.emoji}</span>
                  <span>
                    <div className="pi">{m.title}</div>
                    <div className="pd">{m.desc}</div>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="co-card summary">
          <h3><Icon name="bag" size={20} /> Đơn hàng ({items.length})</h3>
          <div style={{ marginTop: 14 }}>
            {items.map((it) => (
              <div className="sum-item" key={it.id}>
                <img src={it.image || PLACEHOLDER} alt={it.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="si-name">{it.name}</div>
                  <div className="si-meta">SL: {it.qty} × {formatVND(it.price)}</div>
                </div>
                <div className="si-price">{formatVND(it.price * it.qty)}</div>
              </div>
            ))}
          </div>

          <div className="sum-rows">
            <div className="row"><span>Tạm tính</span><span>{formatVND(total)}</span></div>
            {savings > 0 && <div className="row" style={{ color: 'var(--ok)' }}><span>Tiết kiệm</span><span>-{formatVND(savings)}</span></div>}
            <div className="row"><span>Phí vận chuyển</span><span style={{ color: 'var(--ok)', fontWeight: 600 }}>Miễn phí</span></div>
            <div className="row total"><span>Tổng cộng</span><span className="v">{formatVND(total)}</span></div>
          </div>

          {failed && (
            <div className="co-fail">
              <b>⚠️ Chưa gửi được đơn tự động.</b>
              <span>Đừng lo, giỏ hàng của bạn vẫn được giữ. Vui lòng bấm <b>Thử lại</b> hoặc gọi ngay hotline để được chốt đơn:</span>
              <a href={`tel:${COMPANY.hotline.replace(/\s/g, '')}`} className="btn btn-primary btn-block" style={{ marginTop: 4 }}>
                <Icon name="phone" size={17} /> Gọi {COMPANY.hotline}
              </a>
            </div>
          )}

          <button type="submit" className="btn btn-accent btn-block btn-lg" disabled={submitting} style={{ marginTop: 6 }}>
            {submitting ? 'Đang gửi đơn...' : failed ? <>Thử lại đặt hàng <Icon name="arrow" size={18} /></> : <>Đặt hàng ngay <Icon name="arrow" size={18} /></>}
          </button>
          <div className="trust-row"><Icon name="shield" size={15} /> Thông tin của bạn được bảo mật an toàn</div>
        </div>
      </form>
    </div>
  )
}
