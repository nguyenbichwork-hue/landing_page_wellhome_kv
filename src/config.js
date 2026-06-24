// ====== CẤU HÌNH TRANG KOL ======
// Thông tin KOL (subdomain khanhvan.wellhome.asia)
export const KOL = {
  name: 'Khánh Vân',
  code: 'KHANHVAN',          // mã KOL gắn vào mỗi đơn để thống kê
  campaign: 'Tefal x Khánh Vân 2026',
}

// URL Google Apps Script Web App nhận đơn hàng và ghi vào Google Sheet.
// >>> Sau khi deploy Apps Script (xem apps-script/Code.gs), dán URL /exec vào đây
//     hoặc đặt biến môi trường VITE_ORDER_ENDPOINT khi build trên Vercel.
export const ORDER_ENDPOINT =
  import.meta.env.VITE_ORDER_ENDPOINT ||
  'https://script.google.com/macros/s/PASTE_YOUR_DEPLOYMENT_ID/exec'

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
