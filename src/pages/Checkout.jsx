import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icons.jsx'
import { useCart } from '../cart.jsx'
import { formatVND, PLACEHOLDER } from '../utils.js'
import { PROVINCES } from '../data/provinces.js'
import { ORDER_ENDPOINT, KOL, COMPANY, ZALO_URL, BANK } from '../config.js'

const transferContent = (code) => (code || '').replace(/[^a-zA-Z0-9]/g, '')

// Màn hình chuyển khoản: VietQR + chi tiết TK + tự xác nhận thanh toán qua SePay
function BankPayment({ done }) {
  const content = transferContent(done.orderCode)
  const qr = `https://img.vietqr.io/image/${BANK.bankBin}-${BANK.accountNo}-compact2.png`
    + `?amount=${done.total}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(BANK.accountName)}`
  const [paid, setPaid] = useState(false)
  const [copied, setCopied] = useState('')
  const timer = useRef(null)

  useEffect(() => {
    if (paid) return
    const check = async () => {
      try {
        const r = await fetch(`/api/order-status?code=${encodeURIComponent(done.orderCode)}`)
        if (r.ok) { const j = await r.json(); if (j && j.paid) setPaid(true) }
      } catch (_) { /* bỏ qua */ }
    }
    timer.current = setInterval(check, 5000)
    check()
    return () => clearInterval(timer.current)
  }, [paid, done.orderCode])

  const copy = (val, key) => {
    navigator.clipboard?.writeText(val).then(() => { setCopied(key); setTimeout(() => setCopied(''), 1500) })
  }
  const Row = ({ label, value, k }) => (
    <div className="qr-row">
      <span className="ql">{label}</span>
      <span className="qv">{value}
        <button type="button" className="qcopy" onClick={() => copy(value, k)} aria-label="Sao chép">
          {copied === k ? <Icon name="check" size={15} /> : <Icon name="bag" size={14} />}
        </button>
      </span>
    </div>
  )

  if (paid) {
    return (
      <div className="wrap checkout">
        <div className="success">
          <div className="ring"><Icon name="check" size={46} /></div>
          <h2>Đã thanh toán thành công! 🎉</h2>
          <p>WellHome đã nhận được chuyển khoản cho đơn <b>{done.orderCode}</b>.</p>
          <div className="order-code">Mã đơn: {done.orderCode}</div>
          <p>Số tiền: <b style={{ color: 'var(--tefal)', fontSize: 18 }}>{formatVND(done.total)}</b></p>
          <p style={{ marginTop: 14 }}>Nhân viên sẽ sớm liên hệ giao hàng. Cảm ơn bạn đã mua sắm cùng KOL {KOL.name}!</p>
          <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: 22 }}>
            <Icon name="bag" size={18} /> Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="wrap checkout">
      <div className="qr-pay">
        <div className="qr-head">
          <h2>Quét mã để thanh toán</h2>
          <p>Đơn <b>{done.orderCode}</b> đã được ghi nhận. Vui lòng chuyển khoản để hoàn tất.</p>
        </div>
        <div className="qr-grid">
          <div className="qr-left">
            <div className="qr-box"><img src={qr} alt="VietQR thanh toán" /></div>
            <div className="qr-banklogos">Napas 247 · MB · VietQR</div>
          </div>
          <div className="qr-right">
            <Row label="Ngân hàng" value={BANK.bankName} k="bank" />
            <Row label="Chủ tài khoản" value={BANK.accountName} k="name" />
            <Row label="Số tài khoản" value={BANK.accountNo} k="acc" />
            <Row label="Số tiền" value={formatVND(done.total)} k="amt" />
            <Row label="Nội dung CK" value={content} k="ct" />
            <div className="qr-warn">
              ⚠️ Vui lòng <b>giữ nguyên nội dung {content}</b> khi chuyển khoản để hệ thống tự xác nhận thanh toán.
            </div>
          </div>
        </div>
        <div className="qr-status">
          <span className="spin" /> Đang chờ thanh toán... (tự cập nhật khi nhận được tiền)
        </div>
        <div className="co-help" style={{ marginTop: 4 }}>
          Đã chuyển khoản nhưng chưa cập nhật?
          {ZALO_URL && <a href={ZALO_URL} target="_blank" rel="noreferrer" className="co-zalo-link">Chat Zalo</a>}
          <span>·</span>
          <a href={`tel:${COMPANY.hotline.replace(/\s/g, '')}`} className="co-zalo-link">{COMPANY.hotline}</a>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Link to="/" style={{ color: 'var(--muted)', fontWeight: 600 }}>← Về trang chủ</Link>
        </div>
      </div>
    </div>
  )
}

const PAY_METHODS = [
  { id: 'BANK', emoji: '🏦', title: 'Chuyển khoản qua ngân hàng', desc: 'Quét mã QR thanh toán — tự xác nhận ngay khi nhận tiền', status: 'Chờ chuyển khoản' },
  { id: 'COD', emoji: '💵', title: 'Thanh toán khi giao hàng (COD)', desc: 'Thanh toán tiền mặt khi nhận sản phẩm', status: 'Chưa thu (COD)' },
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
  const [f, setF] = useState({ name: '', phone: '', email: '', province: '', ward: '', street: '', note: '' })
  // Bản đồ Phường/Xã theo Tỉnh — tải động khi vào trang để không phình bundle chính (file ~68KB)
  const [wardsMap, setWardsMap] = useState(null)
  const [pay, setPay] = useState('BANK')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)
  const [failed, setFailed] = useState(false)
  const [stockErr, setStockErr] = useState('')
  // Sinh mã đơn 1 lần khi vào trang -> chống ghi trùng khi khách bấm/thử lại nhiều lần (idempotency)
  const [orderCode] = useState(genOrderCode)

  const set = (k) => (e) => { setF((s) => ({ ...s, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: '' })) }
  // Đổi Tỉnh -> reset Phường/Xã đã chọn (danh sách phụ thuộc tỉnh)
  const setProvince = (e) => {
    const province = e.target.value
    setF((s) => ({ ...s, province, ward: '' }))
    setErrors((er) => ({ ...er, province: '', ward: '' }))
  }

  // Tải bản đồ Phường/Xã 1 lần khi vào trang
  useEffect(() => {
    let on = true
    import('../data/wards.js').then((m) => { if (on) setWardsMap(m.WARDS) })
    return () => { on = false }
  }, [])

  const wardOptions = (wardsMap && f.province && wardsMap[f.province]) || []

  // Gửi đơn với retry + kiểm tra phản hồi thật.
  // Serverless cùng domain (/api/...) -> gửi JSON. Apps Script (khác domain) -> text/plain để tránh preflight.
  const sameOrigin = ORDER_ENDPOINT.startsWith('/')
  async function postOrder(payload, tries = 3) {
    let last = { ok: false, error: '' }
    for (let i = 0; i < tries; i++) {
      try {
        const r = await fetch(ORDER_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': sameOrigin ? 'application/json' : 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow',
        })
        let j = null
        try { j = await r.clone().json() } catch (_) { /* phản hồi không phải JSON */ }
        // Hết tồn kho -> dừng ngay, không thử lại (đây là từ chối có chủ đích).
        if (r.status === 409 || (j && j.outOfStock)) {
          return { ok: false, outOfStock: true, error: (j && j.error) || 'Một số sản phẩm đã hết hàng.' }
        }
        if (r.ok && !(j && j.ok === false)) return { ok: true }
        last = { ok: false, error: (j && j.error) || ('HTTP ' + r.status) }
      } catch (err) {
        last = { ok: false, error: String(err) }
        console.warn(`order post attempt ${i + 1} failed`, err)
      }
      if (i < tries - 1) await new Promise((res) => setTimeout(res, 800 * (i + 1)))
    }
    return last
  }

  const validate = () => {
    const er = {}
    if (!f.name.trim()) er.name = 'Vui lòng nhập họ tên'
    if (!/^0\d{9,10}$/.test(f.phone.replace(/\s/g, ''))) er.phone = 'Số điện thoại không hợp lệ'
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) er.email = 'Email không hợp lệ'
    if (!f.province) er.province = 'Vui lòng chọn tỉnh/thành'
    if (!f.ward) er.ward = 'Vui lòng chọn phường/xã'
    if (!f.street.trim()) er.street = 'Vui lòng nhập số nhà, tên đường'
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
    setStockErr('')
    const method = PAY_METHODS.find((m) => m.id === pay)
    const fullAddress = [f.street, f.ward, f.province].filter(Boolean).join(', ')
    const payload = {
      orderCode,
      kol: KOL.name,
      kolCode: KOL.code,
      campaign: KOL.campaign,
      createdAt: new Date().toISOString(),
      customer: {
        name: f.name, phone: f.phone.replace(/\s/g, ''), email: f.email,
        street: f.street, ward: f.ward, district: '', province: f.province,
        address: fullAddress, note: f.note,
      },
      payment: method?.title,
      paymentCode: pay,
      paymentStatus: method?.status,
      items: items.map((it) => ({
        id: it.id, cmmf: it.cmmf, name: it.name, brand: it.brand || 'TEFAL',
        price: it.price, qty: it.qty, lineTotal: it.price * it.qty,
        discount: Math.max(0, (it.rsp || 0) - it.price) * it.qty,
        variantId: it.variantId,
      })),
      itemCount: items.reduce((s, x) => s + x.qty, 0),
      subtotal: total,
      savings,
      total,
      source: 'khanhvan.wellhome.asia',
    }

    const res = await postOrder(payload)
    setSubmitting(false)

    if (res.ok) {
      setDone({ orderCode, total: payload.total, name: f.name, payment: payload.payment, paymentCode: pay })
      clear()
    } else if (res.outOfStock) {
      // Hết tồn kho: báo rõ, giữ giỏ để khách giảm số lượng. Không hiện nút "Thử lại".
      setStockErr(res.error || 'Một số sản phẩm đã hết hàng. Vui lòng giảm số lượng.')
      document.querySelector('.co-fail')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      // KHÔNG báo thành công giả. Giữ giỏ hàng để không mất đơn, hiện hotline để khách chốt đơn.
      setFailed(true)
      document.querySelector('.co-fail')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (done) {
    if (done.paymentCode === 'BANK') return <BankPayment done={done} />
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

            <div className="grid2">
              <div className={`field ${errors.province ? 'err' : ''}`}>
                <label>Tỉnh / Thành phố <span className="req">*</span></label>
                <select value={f.province} onChange={setProvince}>
                  <option value="">— Chọn tỉnh / thành —</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                {errors.province && <div className="msg">{errors.province}</div>}
              </div>
              <div className={`field ${errors.ward ? 'err' : ''}`}>
                <label>Phường / Xã <span className="req">*</span></label>
                <select value={f.ward} onChange={set('ward')} disabled={!f.province || !wardsMap}>
                  <option value="">
                    {!f.province
                      ? '— Chọn tỉnh / thành trước —'
                      : !wardsMap
                        ? 'Đang tải danh sách...'
                        : '— Chọn phường / xã —'}
                  </option>
                  {wardOptions.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
                {errors.ward && <div className="msg">{errors.ward}</div>}
              </div>
            </div>

            <div className={`field ${errors.street ? 'err' : ''}`}>
              <label>Số nhà, tên đường <span className="req">*</span></label>
              <input value={f.street} onChange={set('street')} placeholder="VD: 1014 Phạm Văn Đồng" />
              {errors.street && <div className="msg">{errors.street}</div>}
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

          {stockErr && (
            <div className="co-fail">
              <b>⚠️ Không đủ tồn kho</b>
              <span>{stockErr}</span>
              <span>Vui lòng quay lại giỏ hàng giảm số lượng rồi đặt lại.</span>
            </div>
          )}

          {failed && (
            <div className="co-fail">
              <b>⚠️ Chưa gửi được đơn tự động.</b>
              <span>Đừng lo, giỏ hàng của bạn vẫn được giữ. Vui lòng bấm <b>Thử lại</b>, hoặc liên hệ ngay để được chốt đơn:</span>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <a href={`tel:${COMPANY.hotline.replace(/\s/g, '')}`} className="btn btn-primary" style={{ flex: 1 }}>
                  <Icon name="phone" size={16} /> Gọi hotline
                </a>
                {ZALO_URL && (
                  <a href={ZALO_URL} target="_blank" rel="noreferrer" className="btn btn-zalo" style={{ flex: 1 }}>
                    <Icon name="mail" size={16} /> Chat Zalo
                  </a>
                )}
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-accent btn-block btn-lg" disabled={submitting} style={{ marginTop: 6 }}>
            {submitting ? 'Đang gửi đơn...' : failed ? <>Thử lại đặt hàng <Icon name="arrow" size={18} /></> : <>Đặt hàng ngay <Icon name="arrow" size={18} /></>}
          </button>
          <div className="trust-row"><Icon name="shield" size={15} /> Thông tin của bạn được bảo mật an toàn</div>

          {ZALO_URL && (
            <div className="co-help">
              Cần hỗ trợ đặt hàng?
              <a href={ZALO_URL} target="_blank" rel="noreferrer" className="co-zalo-link">Chat Zalo</a>
              <span>·</span>
              <a href={`tel:${COMPANY.hotline.replace(/\s/g, '')}`} className="co-zalo-link">{COMPANY.hotline}</a>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
