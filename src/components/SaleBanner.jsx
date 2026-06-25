import { useEffect, useState } from 'react'
import { formatVND, productImage } from '../utils.js'
import { brandLabel } from '../config.js'

const SLOT = 3 * 3600 * 1000   // đồng hồ đếm ngược trong đúng 3 giờ rồi reset
const ROTATE = 4000            // tự lướt: 4 giây đổi 1 sản phẩm DEAL SỐC

export default function SaleBanner({ deals, onOpen }) {
  const [now, setNow] = useState(() => Date.now())
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // tự động lướt qua các sản phẩm có tag DEAL SỐC
  useEffect(() => {
    if (!deals || deals.length <= 1) return
    const t = setInterval(() => setIdx((i) => (i + 1) % deals.length), ROTATE)
    return () => clearInterval(t)
  }, [deals])

  if (!deals || !deals.length) return null
  const pos = idx % deals.length
  const deal = deals[pos]

  const slotEnd = (Math.floor(now / SLOT) + 1) * SLOT   // thời điểm kết thúc slot 3 giờ hiện tại
  let diff = Math.max(0, slotEnd - now)
  const h = Math.floor(diff / 3600000); diff -= h * 3600000
  const m = Math.floor(diff / 60000); diff -= m * 60000
  const s = Math.floor(diff / 1000)
  const pad = (x) => String(x).padStart(2, '0')
  const units = [[pad(h), 'GIỜ'], [pad(m), 'PHÚT'], [pad(s), 'GIÂY']]

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

        <div className="sb-midwrap">
          <div className="sb-mid" key={deal.id} onClick={() => onOpen(deal)}>
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
          {deals.length > 1 && (
            <div className="sb-dots">
              {deals.map((d, i) => (
                <button key={d.id} className={i === pos ? 'on' : ''} onClick={() => setIdx(i)} aria-label={`Sản phẩm ${i + 1}`} />
              ))}
            </div>
          )}
        </div>

        <div className="sb-right">
          <div className="sb-end">KẾT THÚC SAU</div>
          <div className="sb-clock">
            {units.map(([v, l], i) => (
              <div className="sb-unit" key={l}>
                <div className="sb-num">{v}</div>
                <div className="sb-lbl">{l}</div>
                {i < 2 && <span className="sb-colon">:</span>}
              </div>
            ))}
          </div>
          <div className="sb-limit">🔥 Số lượng có hạn: 1 deal duy nhất!</div>
        </div>
      </section>
    </div>
  )
}
