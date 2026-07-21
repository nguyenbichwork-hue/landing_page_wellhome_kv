import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import Home from './pages/Home.jsx'
import Contact from './pages/Contact.jsx'
import Checkout from './pages/Checkout.jsx'
import Admin from './pages/Admin.jsx'

function ScrollTop() {
  const { pathname } = useLocation()
  // Bọc {} — KHÔNG trả giá trị của scrollTo ra useEffect (Chrome mới trả Promise
  // khi html có scroll-behavior:smooth → React coi là cleanup → crash "destroy is not a function"
  // khi điều hướng SPA → trắng trang, phải F5). Bọc lại để effect trả về undefined.
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
