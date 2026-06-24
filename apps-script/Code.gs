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

var HEADERS = [
  'Thời gian', 'Mã đơn', 'KOL', 'Khách hàng', 'SĐT', 'Email',
  'Tỉnh/Thành', 'Địa chỉ', 'Sản phẩm', 'SL', 'Tạm tính',
  'Tiết kiệm', 'Tổng tiền', 'Thanh toán', 'Ghi chú', 'Nguồn', 'Trạng thái'
];

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
      var codes = sh.getRange(2, 2, sh.getLastRow() - 1, 1).getValues();
      for (var k = 0; k < codes.length; k++) {
        if (codes[k][0] === data.orderCode) {
          return json_({ ok: true, duplicate: true, orderCode: data.orderCode });
        }
      }
    }
    var items = (data.items || []).map(function (it) {
      return it.qty + 'x ' + it.name + ' (' + it.cmmf + ') = ' + it.lineTotal.toLocaleString('vi-VN') + 'đ';
    }).join('\n');

    sh.appendRow([
      data.createdAt ? new Date(data.createdAt) : new Date(),
      data.orderCode || '',
      data.kol || '',
      c.name || '',
      "'" + (c.phone || ''),
      c.email || '',
      c.province || '',
      c.address || '',
      items,
      data.itemCount || 0,
      data.subtotal || 0,
      data.savings || 0,
      data.total || 0,
      data.payment || '',
      c.note || '',
      data.source || '',
      'Mới'
    ]);

    return json_({ ok: true, orderCode: data.orderCode });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, service: 'WellHome x Tefal KOL order endpoint' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
