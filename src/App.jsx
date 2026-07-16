import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import Home from './pages/Home.jsx'
import Contact from './pages/Contact.jsx'
import Checkout from './pages/Checkout.jsx'
import Admin from './pages/Admin.jsx'
import { getCampMeta, campSlugFromPath } from './config.js'

// Tab title theo camp: "<tiêu đề camp> — Hannah Olala" (16/07 — bỏ Khánh Vân mặc định).
function TitleSync() {
  const { pathname } = useLocation()
  useEffect(() => {
    const apply = () => {
      const m = campSlugFromPath(window.location.pathname) ? getCampMeta() : null
      document.title = m?.title ? `${m.title} — Hannah Olala` : 'Hannah Olala — Ưu đãi chính hãng độc quyền'
    }
    apply()
    window.addEventListener('wh-camp-meta', apply)
    return () => window.removeEventListener('wh-camp-meta', apply)
  }, [pathname])
  return null
}

function ScrollTop() {
  const { pathname } = useLocation()
  // Bọc {} — KHÔNG trả giá trị của scrollTo ra useEffect (Chrome mới trả Promise
  // khi html có scroll-behavior:smooth → React crash "destroy is not a function").
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<Admin />} />
      </Routes>
    )
  }

  return (
    <>
      <ScrollTop />
      <TitleSync />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Landing ĐA CAMPAIGN (15/07): /c/<slug> — danh mục từ hệ Wellhome */}
          <Route path="/c/:slug" element={<Home />} />
          <Route path="/lien-he" element={<Contact />} />
          <Route path="/thanh-toan" element={<Checkout />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </>
  )
}
