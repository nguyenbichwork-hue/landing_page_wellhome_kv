// ====== CẤU HÌNH TRANG KOL ======
// Thông tin KOL (subdomain khanhvan.wellhome.asia)
export const KOL = {
  name: 'Khánh Vân',
  code: 'KHANHVAN',          // mã KOL gắn vào mỗi đơn để thống kê
  campaign: 'Tefal x Khánh Vân 2026',
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
  { icon: 'shield', text: 'Bảo hành 2 năm' },
  { icon: 'truck', text: 'Giao hàng & lắp đặt 0đ' },
  { icon: 'check', text: 'Chính hãng 100%' },
]
