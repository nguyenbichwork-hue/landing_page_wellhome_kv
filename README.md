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

1. Tạo (hoặc mở) Google Sheet dùng để thống kê đơn KOL.
2. Vào **Tiện ích mở rộng → Apps Script**.
3. Dán toàn bộ nội dung file `apps-script/Code.gs` vào, **Lưu**.
4. Chọn hàm `setupHeaders` → **Run** một lần (cấp quyền khi được hỏi) để tạo dòng tiêu đề.
5. Bấm **Deploy → New deployment → Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
6. Copy **URL dạng `.../exec`**.
7. Dán URL đó vào một trong hai nơi:
   - `src/config.js` → biến `ORDER_ENDPOINT`, **hoặc**
   - Biến môi trường `VITE_ORDER_ENDPOINT` trên Vercel (khuyến nghị).

Từ đó, mỗi đơn khách đặt sẽ tự thêm 1 dòng vào Sheet: thời gian, mã đơn, KOL, khách hàng, SĐT,
địa chỉ, sản phẩm, số lượng, tổng tiền, phương thức thanh toán, trạng thái...

---

## 4. Triển khai lên Vercel + subdomain

1. Push code lên GitHub (hoặc dùng Vercel CLI: `vercel`).
2. Trên Vercel: **Import Project** → framework tự nhận **Vite**.
3. **Settings → Environment Variables**: thêm `VITE_ORDER_ENDPOINT` = URL Apps Script ở bước 3.
4. Deploy. (`vercel.json` đã cấu hình rewrite cho SPA — các trang con không bị 404 khi F5.)
5. **Settings → Domains**: thêm `khanhvan.wellhome.asia`.
6. Tại nhà cung cấp DNS của `wellhome.asia`, thêm bản ghi:
   ```
   CNAME   khanhvan   →   cname.vercel-dns.com
   ```
   Chờ DNS cập nhật là xong.

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
