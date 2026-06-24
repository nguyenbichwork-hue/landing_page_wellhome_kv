/**
 * WellHome × Tefal — KOL Khánh Vân
 * Google Apps Script Web App: nhận đơn hàng từ web khanhvan.wellhome.asia
 * và ghi vào Google Sheet theo thời gian thực.
 *
 * CÁCH DÙNG:
 *  1. Mở Google Sheet thống kê đơn KOL (tạo mới hoặc dùng sheet có sẵn).
 *  2. Tiện ích mở rộng (Extensions) > Apps Script > dán toàn bộ file này.
 *  3. Đổi SHEET_NAME nếu cần. Nhấn Run > setupHeaders 1 lần để tạo dòng tiêu đề.
 *  4. Deploy > New deployment > Web app:
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     Copy URL dạng .../exec và dán vào src/config.js (ORDER_ENDPOINT)
 *     hoặc đặt biến VITE_ORDER_ENDPOINT trên Vercel.
 */

var SHEET_NAME = 'Đơn KOL';

// Email nhận thông báo. Để '' nếu không muốn nhận mail.
var ALERT_EMAIL = '';        // vd 'admin@k-homes.vn'
var NOTIFY_ALL = true;       // true: gửi mail mọi đơn | false: chỉ gửi khi ghi lỗi

// 1 dòng / mỗi sản phẩm — khớp cấu trúc sheet mẫu KOL + thêm "Trạng thái thanh toán"
var HEADERS = [
  'Ngày đặt hàng', 'Tên người nhận', 'Số điện thoại', 'Email', 'Shipping Street',
  'Phường/Xã nhận hàng', 'Quận/Huyện nhận hàng', 'Tỉnh/TP nhận hàng', 'Phương thức thanh toán',
  'Trạng thái thanh toán', 'Mã đơn hàng', 'Hãng', 'Mã sản phẩm', 'Tên sản phẩm', 'Số lượng',
  'Giá sản phẩm', 'Số tiền giảm', 'Thành tiền', 'Tên Camp', 'Ghi chú', 'Nguồn'
];
var CODE_COL = 11;           // cột "Mã đơn hàng" (K) để chống ghi trùng

function fmtDate_(iso) {
  var d = iso ? new Date(iso) : new Date();
  return Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold')
      .setBackground('#0284C7').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function setupHeaders() {
  var sh = getSheet_();
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
    .setFontWeight('bold').setBackground('#0284C7').setFontColor('#ffffff');
  sh.setFrozenRows(1);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sh = getSheet_();
    var c = data.customer || {};

    // Chống ghi trùng: nếu mã đơn đã tồn tại (khách bấm/thử lại nhiều lần) thì bỏ qua.
    if (data.orderCode && sh.getLastRow() > 1) {
      var codes = sh.getRange(2, CODE_COL, sh.getLastRow() - 1, 1).getValues();
      for (var k = 0; k < codes.length; k++) {
        if (codes[k][0] === data.orderCode) {
          return json_({ ok: true, duplicate: true, orderCode: data.orderCode });
        }
      }
    }
    var ngay = fmtDate_(data.createdAt);
    var list = (data.items && data.items.length) ? data.items : [{}];
    var rows = list.map(function (it) {
      return [
        ngay, c.name || '', "'" + (c.phone || ''), c.email || '', c.street || '',
        c.ward || '', c.district || '', c.province || '', data.payment || '', data.paymentStatus || '',
        data.orderCode || '', it.brand || '', it.cmmf || '', it.name || '', it.qty || 0,
        it.price || 0, it.discount || 0, (it.lineTotal != null ? it.lineTotal : (it.price || 0) * (it.qty || 0)),
        data.campaign || '', c.note || '', data.source || ''
      ];
    });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);

    var itemsText = (data.items || []).map(function (it) {
      return it.qty + 'x ' + it.name + ' (' + it.cmmf + ')';
    }).join('\n');
    if (ALERT_EMAIL && NOTIFY_ALL) {
      notify_('🛒 Đơn KOL mới ' + (data.orderCode || ''),
        'Khách: ' + (c.name || '') + ' - ' + (c.phone || '') + '\nĐịa chỉ: ' + (c.address || '') + '\n\n' + itemsText +
        '\n\nTổng: ' + (data.total || 0).toLocaleString('vi-VN') + 'đ\nThanh toán: ' + (data.payment || '') + ' (' + (data.paymentStatus || '') + ')');
    }
    return json_({ ok: true, orderCode: data.orderCode });
  } catch (err) {
    if (ALERT_EMAIL) {
      notify_('⚠️ LỖI ghi đơn KOL ' + (data.orderCode || ''),
        'Không ghi được đơn vào Sheet, hãy nhập tay:\n\n' + (e && e.postData ? e.postData.contents : '') + '\n\nLỗi: ' + String(err));
    }
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function notify_(subject, body) {
  try { MailApp.sendEmail(ALERT_EMAIL, subject, body); } catch (e) { /* bỏ qua lỗi gửi mail */ }
}

function doGet() {
  return json_({ ok: true, service: 'WellHome x Tefal KOL order endpoint' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
