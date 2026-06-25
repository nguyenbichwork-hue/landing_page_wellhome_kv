// ====== CẤU HÌNH TRANG KOL ======
// Thông tin KOL (subdomain khanhvan.wellhome.asia)
export const KOL = {
  name: 'Khánh Vân',
  fullName: 'Nguyễn Phạm Khánh Vân',
  tagline: 'Khánh Vân PR · Truyền cảm hứng từ căn bếp gia đình',
  code: 'KHANHVAN',          // mã KOL gắn vào mỗi đơn để thống kê
  campaign: 'WellHome đồng hành cùng MC Nguyễn Phạm Khánh Vân',
}

const HSTATIC = 'https://cdn.hstatic.net/themes/200000789201/1001484515/14'
// Các hãng bán trên trang. Thêm/sửa ở đây để hiện section + bộ lọc tương ứng.
export const BRANDS = [
  { key: 'TEFAL', label: 'Tefal', color: '#E2231A', logo: `${HSTATIC}/logo_tefal.png?v=255`, tagline: 'Gia dụng nhà bếp & chăm sóc nhà cửa' },
  { key: 'BOSCH', label: 'Bosch', color: '#E2001A', logo: `${HSTATIC}/logo_bosch.webp?v=255`, tagline: 'Thiết bị gia dụng cao cấp từ Đức' },
  { key: 'SMEG', label: 'Smeg', color: '#0F5E3F', logo: `${HSTATIC}/logo_smeg.jpg?v=255`, tagline: 'Đồ gia dụng thiết kế Ý sang trọng' },
]

// Bảo hành (đổi tại 1 chỗ)
export const WARRANTY = 'Bảo hành 2-3 năm'

// Quản trị: email Google được phép đăng nhập admin + (tùy chọn) Google OAuth Client ID
export const ADMIN = {
  email: 'admin@khomes.com.vn',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
}

// Nơi nhận đơn hàng. Mặc định dùng serverless cùng domain (/api/order) -> ổn định khi đông đơn.
// Có thể đổi sang URL Apps Script bằng biến môi trường VITE_ORDER_ENDPOINT khi build.
export const ORDER_ENDPOINT =
  import.meta.env.VITE_ORDER_ENDPOINT || '/api/order'

// Kênh chat dự phòng để chốt đơn (hiện ở trang thanh toán).
// >>> Thay bằng link Zalo OA / số Zalo thật của shop. Để trống ('') sẽ ẩn nút.
export const ZALO_URL =
  import.meta.env.VITE_ZALO_URL || 'https://zalo.me/0901234567'

// Tài khoản nhận chuyển khoản (VietQR) — đã kết nối SePay để tự xác nhận thanh toán.
// bankBin: mã ngân hàng theo Napuas (MBBank = 970422). Thông tin TK không phải bí mật.
export const BANK = {
  bankBin: '970422',
  bankName: 'MBBank',
  accountNo: '16106688',
  accountName: 'CONG TY TNHH WELLHOME VIET NAM',
}

// Thông tin công ty (hiển thị footer + trang liên hệ)
export const COMPANY = {
  legalName: 'CÔNG TY TNHH WELLHOME (VIỆT NAM)',
  copyright: '© 2023 CÔNG TY TNHH WELLHOME (VIỆT NAM)',
  address:
    'Phòng 5.09, Lầu 5, Tòa nhà ST Moritz, 1014 Phạm Văn Đồng, Phường Hiệp Bình Chánh, Thành phố Thủ Đức, Thành phố Hồ Chí Minh, Việt Nam',
  hotline: '028 8887 5668',
  email: 'cskh@wellhome.asia',
  contentResponsibility: 'CÔNG TY TNHH WELLHOME (VIỆT NAM)',
}

// Nhãn tiếng Việt cho các nhóm sản phẩm (cột CAT trong file)
export const CATEGORY_LABELS = {
  'COOKWARE AND BAKEWARE': 'Nồi & Chảo',
  'ELECTRICAL COOKING': 'Nấu nướng điện',
  'LINEN CARE': 'Chăm sóc quần áo',
  'FOOD PREPARATION': 'Chế biến thực phẩm',
  'KITCHENWARE AND DINNERWARE': 'Dao & Dụng cụ bếp',
  'BEVERAGE': 'Đồ uống',
  'HOME CLEANING': 'Vệ sinh nhà cửa',
}

export const categoryLabel = (c) => CATEGORY_LABELS[c] || c || 'Khác'

// Quyền lợi cố định hiển thị trên sản phẩm
export const PERKS = [
  { icon: 'shield', text: WARRANTY },
  { icon: 'truck', text: 'Giao hàng & lắp đặt miễn phí' },
  { icon: 'check', text: 'Chính hãng 100%' },
]

export const brandLabel = (k) => (BRANDS.find((b) => b.key === (k || '').toUpperCase())?.label) || k || ''
