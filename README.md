# WellHome × Tefal — Trang KOL Khánh Vân

Trang web con `khanhvan.wellhome.asia` tách riêng nguồn đơn KOL khỏi web chính, giúp minh bạch
hợp tác bán hàng với đối tác KOL. Giao diện hiện đại, tươi sáng, tông xanh biển.

- **Trang chủ**: hiển thị tất cả sản phẩm + bộ lọc (Hãng, Nhóm sản phẩm, Khoảng giá), tìm kiếm, sắp xếp.
- **Xem nhanh sản phẩm**: bấm vào sản phẩm → mở cửa sổ nhỏ (modal) đầy đủ ảnh, mô tả, thông số, thêm giỏ, mua ngay.
- **Giỏ hàng** + **Trang thanh toán riêng**: thu thông tin khách → ghi đơn **real-time về Google Sheet**.
- **Liên hệ**: thông tin công ty WellHome + bản đồ.

Giá hiển thị lấy từ file KOL (cột **KOL ON POST**), còn ảnh / mô tả / thông số lấy tự động từ Haravan
(API wellhome.asia) — **không lấy giá Haravan**.

---

## 1. Chạy thử trên máy

```bash
npm install
npm run dev
# mở http://localhost:5173
```

Build production:
```bash
npm run build      # ra thư mục dist/
npm run preview    # xem thử bản build
```

---

## 2. Cập nhật danh sách sản phẩm

Dữ liệu sản phẩm đã được build sẵn vào `src/data/products.json`. Khi file KOL trên Google Sheet
thay đổi (đổi giá, thêm SP, bổ sung Bosch/Smeg), chạy lại:

```bash
npm run data
```

Lệnh này:
1. Tải SP từ Haravan (`scripts/fetch-haravan.mjs`) → `.cache/haravan-products.json`
2. Đọc file KOL đã publish, đối chiếu với Haravan theo mã/model → `src/data/products.json`
   (`scripts/build-data.mjs`)

> **Thêm Bosch / Smeg sau này:** sửa dòng cuối `scripts/fetch-haravan.mjs` (hoặc chạy
> `node scripts/fetch-haravan.mjs Tefal,Bosch,Smeg`) và đảm bảo file Google Sheet có thêm
> các dòng Bosch/Smeg (cùng cấu trúc cột). Sau đó `node scripts/build-data.mjs`.
> Link CSV nguồn được cấu hình trong `scripts/build-data.mjs` / `.cache/kol.csv`.

Sản phẩm không tìm thấy trên Haravan (vd dòng TRENDY, DuraRock) sẽ hiển thị **ảnh placeholder**
nhưng vẫn mua được — bạn có thể bổ sung ảnh thủ công sau.

---

## 3. Kết nối Google Sheet ghi đơn KOL (BẮT BUỘC để nhận đơn)

Web ghi đơn qua **serverless `api/order.js` ngay trên Vercel** (cùng domain, không lỗi CORS,
chịu tải tốt khi đông đơn). Cần một **Service Account** của Google để ghi vào Sheet:

1. **Tạo Service Account** (làm 1 lần):
   - Vào https://console.cloud.google.com → tạo project (hoặc dùng project có sẵn).
   - Bật **Google Sheets API** (APIs & Services → Enable APIs → Google Sheets API).
   - IAM & Admin → **Service Accounts** → *Create* → tạo xong vào **Keys → Add key → JSON** để tải file key.
   - Mở file JSON, lấy 2 giá trị: `client_email` và `private_key`.
2. **Chuẩn bị Sheet**:
   - Tạo Google Sheet thống kê đơn, thêm 1 tab tên **`Đơn KOL`**.
   - **Chia sẻ Sheet** cho `client_email` ở trên với quyền **Editor**.
   - Lấy **SHEET_ID** từ URL: `docs.google.com/spreadsheets/d/`**`<SHEET_ID>`**`/edit`.
3. **Đặt biến môi trường trên Vercel** (Settings → Environment Variables):

   | Biến | Bắt buộc | Giá trị |
   |---|---|---|
   | `SHEET_ID` | ✅ | ID của Google Sheet |
   | `GOOGLE_SA_EMAIL` | ✅ | `client_email` trong file JSON |
   | `GOOGLE_SA_PRIVATE_KEY` | ✅ | `private_key` (dán nguyên, gồm cả `\n`) |
   | `SHEET_TAB` | — | Tên tab, mặc định `Đơn KOL` |
   | `ALERT_EMAIL` | — | Email nhận cảnh báo khi ghi đơn lỗi |
   | `RESEND_API_KEY` | — | API key [Resend](https://resend.com) để gửi email cảnh báo |
   | `NOTIFY_ALL` | — | `1` để nhận email cho **mọi** đơn |

4. Redeploy. Xong — mỗi đơn tự thêm 1 dòng vào Sheet; nếu ghi lỗi sẽ gửi email cảnh báo kèm chi tiết đơn để nhập tay.

> **Phương án thay thế (không cần Service Account / API key):** dùng **Apps Script** trong `apps-script/Code.gs`
> — dán vào Sheet → đặt `ALERT_EMAIL` ở đầu file → Deploy Web app (Anyone) → copy URL `.../exec`
> → đặt biến `VITE_ORDER_ENDPOINT = <URL exec>` trên Vercel. Apps Script gửi email qua chính Gmail của bạn (không cần Resend).
> Đổi lại: chịu tải kém hơn serverless khi nhiều đơn dồn dập.

### Nút Zalo / chat ở trang thanh toán
Sửa link Zalo thật của shop qua biến `VITE_ZALO_URL` (hoặc `ZALO_URL` trong `src/config.js`),
ví dụ `https://zalo.me/0901234567`. Để trống sẽ ẩn nút.

---

## 4. Triển khai lên Vercel + subdomain

1. Push code lên GitHub (đã có sẵn) hoặc `vercel --prod`.
2. Trên Vercel: project tự nhận **Vite** + serverless trong thư mục `api/`.
3. **Settings → Environment Variables**: thêm các biến ở mục 3 (và `VITE_ZALO_URL`).
4. Deploy. (`vercel.json` rewrite SPA nhưng **chừa `/api/`** cho serverless.)
5. **Settings → Domains**: thêm `khanhvan.wellhome.asia`.
6. DNS của `wellhome.asia` thêm bản ghi:
   ```
   CNAME   khanhvan   →   cname.vercel-dns.com
   ```

---

## 5. Bước tiếp theo (Haravan)

Theo thống nhất, hiện đơn được ghi thẳng về Google Sheet. Khi cần **đẩy đơn lên Haravan**
(để Haravan theo dõi & gắn nhãn đơn KOL), có thể bổ sung sau bằng:
- Tạo đơn qua API Haravan kèm `note`/`tags` = `KOL-KHANHVAN`, hoặc
- Dùng mã giảm giá KOL trên Haravan để vừa áp đúng giá KOL vừa tự gắn nhãn.

Mã KOL hiện cấu hình trong `src/config.js` (`KOL.code = "KHANHVAN"`) — đã đính kèm vào mỗi đơn.

---

## Cấu trúc thư mục

```
src/
  config.js            # KOL, công ty, endpoint đơn hàng, nhãn nhóm SP
  utils.js             # format tiền, parse mô tả Haravan
  cart.jsx             # giỏ hàng (Context + localStorage)
  data/products.json   # SP đã build (Sheet + Haravan)
  data/provinces.js    # 34 tỉnh/thành
  components/          # Header, Footer, ProductCard, ProductModal, CartDrawer, Icons
  pages/              # Home, Contact, Checkout
scripts/
  fetch-haravan.mjs    # tải SP từ Haravan
  build-data.mjs       # đối chiếu Sheet ↔ Haravan → products.json
apps-script/Code.gs    # web app ghi đơn về Google Sheet
```
