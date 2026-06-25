import { Icon } from './Icons.jsx'
import { useCart } from '../cart.jsx'
import { formatVND, productImage } from '../utils.js'
import { categoryLabel } from '../config.js'

export default function ProductCard({ product, onOpen }) {
  const { add } = useCart()
  const isHot = /deal/i.test(product.badge || '')
  const soldOut = (+product.stock || 0) <= 0
  return (
    <article className="card" onClick={() => onOpen(product)}>
      <div className="card-media">
        {product.discountPct > 0 && (
          <div className="disc-badge">-{product.discountPct}%<small>GIẢM</small></div>
        )}
        {soldOut && <div className="soldout-badge">Hết hàng</div>}
        <img src={productImage(product)} alt={product.name} loading="lazy" />
        <div className="card-quick">Xem nhanh sản phẩm</div>
      </div>
      <div className="card-body">
        <div className="card-cat">{categoryLabel(product.category)}</div>
        {isHot && <span className="deal-tag"><Icon name="spark" size={11} /> Deal sốc</span>}
        <h3 className="card-title">{product.name}</h3>
        <div className="card-foot">
          <div className="price-wrap">
            <div className="now">{formatVND(product.kolPrice)}</div>
            {product.rspPrice > product.kolPrice && (
              <span className="was">{formatVND(product.rspPrice)}</span>
            )}
          </div>
          <button
            className="add-mini"
            aria-label="Thêm vào giỏ"
            disabled={soldOut}
            onClick={(e) => { e.stopPropagation(); if (!soldOut) add(product, 1) }}
          >
            <Icon name="plus" size={20} />
          </button>
        </div>
      </div>
    </article>
  )
}
