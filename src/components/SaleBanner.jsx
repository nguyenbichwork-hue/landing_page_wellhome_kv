import { useEffect, useState } from 'react'
import { formatVND, productImage } from '../utils.js'
import { brandLabel } from '../config.js'

// Đếm ngược tới cuối tháng hiện tại ("đón lương về")
function endOfMonth() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59).getTime()
}

export default function SaleBanner({ deal, onOpen }) {
  const [target] = useState(endOfMonth)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!deal) return null

  let diff = Math.max(0, target - now)
  const d = Math.floor(diff / 86400000); diff -= d * 86400000
  const h = Math.floor(diff / 3600000); diff -= h * 3600000
  const m = Math.floor(diff / 60000); diff -= m * 60000
  const s = Math.floor(diff / 1000)
  const pad = (x) => String(x).padStart(2, '0')
  const units = [[pad(d), 'NGÀY'], [pad(h), 'GIỜ'], [pad(m), 'PHÚT'], [pad(s), 'GIÂY']]

  return (
    <div className="wrap">
      <section className="salebanner">
        <div className="sb-left">
          <div className="sb-flash">⚡</div>
          <div>
            <div className="sb-t1">SALE SỐC</div>
            <div className="sb-t2">LƯƠNG VỀ</div>
            <div className="sb-t3">CHỈ 1 SẢN PHẨM DUY NHẤT!</div>
          </div>
        </div>

        <div className="sb-mid" onClick={() => onOpen(deal)}>
          {deal.discountPct > 0 && <div className="sb-disc">-{deal.discountPct}%</div>}
          <img src={productImage(deal)} alt={deal.name} />
          <div className="sb-info">
            <div className="sb-brand">{brandLabel(deal.brand)}</div>
            <div className="sb-name">{deal.name}</div>
            <div className="sb-price">
              <span className="now">{formatVND(deal.kolPrice)}</span>
              {deal.rspPrice > deal.kolPrice && <span className="old">{formatVND(deal.rspPrice)}</span>}
            </div>
          </div>
        </div>

        <div className="sb-right">
          <div className="sb-end">KẾT THÚC SAU</div>
          <div className="sb-clock">
            {units.map(([v, l], i) => (
              <div className="sb-unit" key={l}>
                <div className="sb-num">{v}</div>
                <div className="sb-lbl">{l}</div>
                {i < 3 && <span className="sb-colon">:</span>}
              </div>
            ))}
          </div>
          <div className="sb-limit">🔥 Số lượng có hạn: 1 deal duy nhất!</div>
        </div>
      </section>
    </div>
  )
}
