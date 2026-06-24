import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const CartCtx = createContext(null)
const KEY = 'kv_cart_v1'

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
  })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.id === product.id)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], qty: next[i].qty + qty }
        return next
      }
      return [...prev, {
        id: product.id,
        cmmf: product.cmmf,
        name: product.name,
        price: product.kolPrice,
        rsp: product.rspPrice,
        image: (product.images && product.images[0]) || '',
        variantId: product.variantId,
        qty,
      }]
    })
    setOpen(true)
  }, [])

  const setQty = useCallback((id, qty) => {
    setItems((prev) =>
      prev.flatMap((x) => (x.id === id ? (qty <= 0 ? [] : [{ ...x, qty }]) : [x]))
    )
  }, [])

  const remove = useCallback((id) => setItems((p) => p.filter((x) => x.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])

  const count = items.reduce((s, x) => s + x.qty, 0)
  const total = items.reduce((s, x) => s + x.price * x.qty, 0)
  const savings = items.reduce((s, x) => s + Math.max(0, (x.rsp - x.price)) * x.qty, 0)

  return (
    <CartCtx.Provider value={{ items, count, total, savings, add, setQty, remove, clear, open, setOpen }}>
      {children}
    </CartCtx.Provider>
  )
}

export const useCart = () => useContext(CartCtx)
