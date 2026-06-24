import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon, BrandMark } from '../components/Icons.jsx'
import { ADMIN, BRANDS, categoryLabel, brandLabel } from '../config.js'
import { formatVND, productImage } from '../utils.js'

const LS = 'kv_admin_auth_v1'
const emptyProduct = () => ({ cmmf: '', brand: 'TEFAL', name: '', category: '', rspPrice: '', kolPrice: '', stock: 1, badge: '', images: [] })

export default function Admin() {
  const [auth, setAuth] = useState(() => { try { return JSON.parse(localStorage.getItem(LS)) } catch { return null } })
  const [pass, setPass] = useState('')
  const [authErr, setAuthErr] = useState('')
  const gsiRef = useRef(null)

  // ---- Google Sign-In ----
  useEffect(() => {
    if (auth || !ADMIN.googleClientId) return
    const id = 'gsi-script'
    const init = () => {
      if (!window.google?.accounts?.id) return
      window.google.accounts.id.initialize({
        client_id: ADMIN.googleClientId,
        callback: (resp) => onGoogle(resp.credential),
      })
      if (gsiRef.current) window.google.accounts.id.renderButton(gsiRef.current, { theme: 'filled_blue', size: 'large', width: 280, text: 'signin_with' })
    }
    if (document.getElementById(id)) init()
    else {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.id = id; s.onload = init
      document.head.appendChild(s)
    }
  }, [auth])

  function onGoogle(credential) {
    try {
      const payload = JSON.parse(atob(credential.split('.')[1]))
      if ((payload.email || '').toLowerCase() !== ADMIN.email.toLowerCase()) {
        setAuthErr(`Email ${payload.email} không có quyền. Chỉ ${ADMIN.email} mới đăng nhập được.`)
        return
      }
      const a = { type: 'google', token: credential, email: payload.email, name: payload.name }
      localStorage.setItem(LS, JSON.stringify(a)); setAuth(a); setAuthErr('')
    } catch { setAuthErr('Đăng nhập Google thất bại.') }
  }

  async function loginPass(e) {
    e.preventDefault()
    if (!pass.trim()) return
    const a = { type: 'pass', pass: pass.trim() }
    // thử gọi list để xác thực mã
    const r = await apiCall('list', {}, a)
    if (r?.ok) { localStorage.setItem(LS, JSON.stringify(a)); setAuth(a); setAuthErr('') }
    else setAuthErr(r?.error || 'Mã quản trị không đúng.')
  }

  function logout() { localStorage.removeItem(LS); setAuth(null); setPass('') }

  if (!auth) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <BrandMark size={48} />
          <h1>Quản trị WellHome KOL</h1>
          <p>Khu vực dành cho nhân viên. Đăng nhập để quản lý sản phẩm.</p>
          {ADMIN.googleClientId && <div ref={gsiRef} style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 4px' }} />}
          {ADMIN.googleClientId && <div className="admin-or">hoặc</div>}
          <form onSubmit={loginPass} className="admin-pass">
            <input type="password" placeholder="Mã quản trị" value={pass} onChange={(e) => setPass(e.target.value)} />
            <button className="btn btn-primary btn-block" type="submit">Đăng nhập</button>
          </form>
          {authErr && <div className="admin-err">{authErr}</div>}
          {!ADMIN.googleClientId && <div className="admin-hint">Đăng nhập Gmail: cấu hình <code>VITE_GOOGLE_CLIENT_ID</code>. Hoặc dùng mã quản trị (<code>ADMIN_PASSCODE</code>).</div>}
        </div>
      </div>
    )
  }
  return <AdminPanel auth={auth} onLogout={logout} />
}

// ---- gọi API admin với header xác thực ----
async function apiCall(action, payload, auth) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth.type === 'google') headers.Authorization = 'Bearer ' + auth.token
  if (auth.type === 'pass') headers['x-admin-pass'] = auth.pass
  try {
    const r = await fetch('/api/admin', { method: 'POST', headers, body: JSON.stringify({ action, ...payload }) })
    return await r.json()
  } catch (e) { return { ok: false, error: String(e) } }
}

function AdminPanel({ auth, onLogout }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [fbrand, setFbrand] = useState('all')
  const [edit, setEdit] = useState(null)        // product đang sửa (hoặc emptyProduct để thêm)
  const [toast, setToast] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importRes, setImportRes] = useState(null)

  const call = (action, payload) => apiCall(action, payload, auth)
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  async function load() {
    setLoading(true)
    const r = await call('list', {})
    if (r?.ok) setProducts(r.products || [])
    else flash(r?.error || 'Lỗi tải danh sách')
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const list = useMemo(() => products.filter((p) =>
    (fbrand === 'all' || p.brand === fbrand) &&
    (!q || (p.name + ' ' + p.cmmf).toLowerCase().includes(q.toLowerCase()))
  ), [products, q, fbrand])

  async function save(p) {
    const r = await call('save', { product: { ...p, rspPrice: +p.rspPrice || 0, kolPrice: +p.kolPrice || 0, stock: +p.stock || 0 } })
    if (r?.ok) { flash('Đã lưu sản phẩm'); setEdit(null); load() }
    else flash(r?.error || 'Lưu thất bại')
  }
  async function remove(p) {
    if (!confirm(`Ẩn sản phẩm "${p.name}"?`)) return
    const r = await call('delete', { id: p.id || p.cmmf })
    if (r?.ok) { flash('Đã ẩn sản phẩm'); load() } else flash('Xóa thất bại')
  }
  async function doImport() {
    if (!importUrl.trim()) return
    setImporting(true); setImportRes(null)
    const r = await call('import', { sheetUrl: importUrl.trim() })
    setImporting(false)
    if (r?.ok) { setImportRes(r); flash(`Đã nhập ${r.total} SP (khớp ảnh ${r.matched})`); load() }
    else flash(r?.error || 'Import thất bại')
  }
  async function doEnrich(brand) {
    flash('Đang lấy ảnh từ Haravan...')
    const r = await call('enrich', { brand })
    if (r?.ok) { flash(`Đã cập nhật ảnh cho ${r.updated} SP`); load() } else flash(r?.error || 'Lỗi')
  }

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="admin-bar-l"><BrandMark size={30} /> <b>Quản trị sản phẩm</b></div>
        <div className="admin-bar-r">
          <span className="admin-who">{auth.email || 'Quản trị viên'}</span>
          <button className="btn btn-ghost" onClick={onLogout}>Đăng xuất</button>
        </div>
      </header>

      <div className="admin-wrap">
        {/* Import hàng loạt */}
        <section className="admin-card">
          <h3><Icon name="bag" size={18} /> Nhập hàng loạt từ Google Sheet</h3>
          <p className="admin-sub">Dán link file Sheet (định dạng giống file Tefal mẫu: CMMF, ITEM NAME, BRAND, CAT, RSP, KOL...). Hệ thống tự đối chiếu Haravan lấy ảnh/mô tả. Hỗ trợ Tefal · Bosch · Smeg.</p>
          <div className="admin-import">
            <input placeholder="https://docs.google.com/spreadsheets/d/.../edit?gid=..." value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
            <button className="btn btn-primary" onClick={doImport} disabled={importing}>{importing ? 'Đang nhập...' : 'Nhập sản phẩm'}</button>
          </div>
          {importRes && <div className="admin-ok">✓ Đã nhập {importRes.total} SP — khớp ảnh Haravan: {importRes.matched} · thêm mới {importRes.added} · cập nhật {importRes.updated}</div>}
          <div className="admin-enrich">
            Lấy lại ảnh Haravan cho SP còn thiếu:
            {BRANDS.map((b) => <button key={b.key} className="chip" onClick={() => doEnrich(b.key)}>{b.label}</button>)}
          </div>
        </section>

        {/* Danh sách + thêm */}
        <section className="admin-card">
          <div className="admin-listhead">
            <h3><Icon name="filter" size={18} /> Sản phẩm ({list.length})</h3>
            <button className="btn btn-accent" onClick={() => setEdit(emptyProduct())}><Icon name="plus" size={16} /> Thêm sản phẩm</button>
          </div>
          <div className="admin-tools">
            <div className="searchbar" style={{ margin: 0, flex: 1 }}>
              <Icon name="search" size={17} className="ic" />
              <input placeholder="Tìm theo tên / mã..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="sort-select" value={fbrand} onChange={(e) => setFbrand(e.target.value)}>
              <option value="all">Tất cả hãng</option>
              {BRANDS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>

          {loading ? <div className="admin-loading">Đang tải...</div> : (
            <div className="admin-table">
              {list.map((p) => (
                <div className={`admin-row ${p.active === false ? 'hidden' : ''}`} key={p.id || p.cmmf}>
                  <img src={productImage(p)} alt="" />
                  <div className="ar-info">
                    <div className="ar-name">{p.name} {p.active === false && <span className="ar-off">(đã ẩn)</span>}</div>
                    <div className="ar-meta">{brandLabel(p.brand)} · {categoryLabel(p.category)} · mã {p.cmmf} {!p.images?.length && <span className="ar-noimg">⚠ chưa có ảnh</span>}</div>
                  </div>
                  <div className="ar-price"><b>{formatVND(p.kolPrice)}</b>{p.rspPrice > p.kolPrice && <s>{formatVND(p.rspPrice)}</s>}</div>
                  <div className="ar-act">
                    <button className="btn btn-ghost" onClick={() => setEdit({ ...p, images: p.images || [] })}>Sửa</button>
                    <button className="ar-del" onClick={() => remove(p)} title="Ẩn"><Icon name="trash" size={17} /></button>
                  </div>
                </div>
              ))}
              {!list.length && <div className="admin-loading">Chưa có sản phẩm. Dùng "Nhập hàng loạt" ở trên để thêm.</div>}
            </div>
          )}
        </section>
      </div>

      {edit && <EditModal product={edit} onClose={() => setEdit(null)} onSave={save} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function EditModal({ product, onClose, onSave }) {
  const [p, setP] = useState({ ...product, images: product.images || [] })
  const isNew = !product.name
  const set = (k) => (e) => setP((s) => ({ ...s, [k]: e.target.value }))
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="admin-edit" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><Icon name="close" /></button>
        <h2>{isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h2>
        <div className="grid2">
          <Field label="Mã SP (CMMF)"><input value={p.cmmf || ''} onChange={set('cmmf')} disabled={!isNew} /></Field>
          <Field label="Hãng"><select value={p.brand} onChange={set('brand')}>{BRANDS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}</select></Field>
        </div>
        <Field label="Tên sản phẩm"><input value={p.name || ''} onChange={set('name')} /></Field>
        <div className="grid2">
          <Field label="Nhóm SP (để trống = tự phân loại)"><input value={p.category || ''} onChange={set('category')} /></Field>
          <Field label="Nhãn (vd DEAL SỐC)"><input value={p.badge || ''} onChange={set('badge')} /></Field>
        </div>
        <div className="grid3">
          <Field label="Giá gốc (RSP)"><input type="number" value={p.rspPrice || ''} onChange={set('rspPrice')} /></Field>
          <Field label="Giá KOL"><input type="number" value={p.kolPrice || ''} onChange={set('kolPrice')} /></Field>
          <Field label="Tồn kho"><input type="number" value={p.stock ?? 1} onChange={set('stock')} /></Field>
        </div>
        <Field label="Ảnh (mỗi dòng 1 link)">
          <textarea rows="4" value={(p.images || []).join('\n')} onChange={(e) => setP((s) => ({ ...s, images: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) }))} placeholder="https://..." />
        </Field>
        <div className="admin-edit-act">
          <button className="btn btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn btn-primary" onClick={() => onSave(p)} disabled={!p.cmmf || !p.name}>Lưu</button>
        </div>
      </div>
    </div>
  )
}
const Field = ({ label, children }) => (<div className="field"><label>{label}</label>{children}</div>)
