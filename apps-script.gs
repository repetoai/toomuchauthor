/**
 * 「쓰다보니 작가가 너무 많아」 응원 저장용 Apps Script
 * 구글 시트에서 [확장 프로그램 > Apps Script]를 열고 이 코드를 붙여넣은 뒤
 * [배포 > 새 배포 > 웹 앱] (실행: 나 / 액세스: 모든 사용자)로 배포하세요.
 * 배포 후 나오는 웹 앱 URL을 HTML의 API_URL에 넣으면 됩니다.
 *
 * 시트 구성 (자동 생성됨)
 *  - claps    : B1 셀에 박수 누적 수
 *  - messages : A 날짜 | B 이름 | C 내용 | D 숨김
 *    D열에 아무 글자나(예: x) 적으면 그 응원은 사이트에서 사라집니다.
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    var claps = ss.getSheetByName('claps') || ss.insertSheet('claps');
    var msgs = ss.getSheetByName('messages') || ss.insertSheet('messages');
    if (claps.getLastRow() === 0) claps.appendRow(['박수', 0]);
    if (msgs.getLastRow() === 0) msgs.appendRow(['날짜', '이름', '내용', '숨김']);

    if (p.action === 'clap') {
      var n = Math.min(50, Math.max(1, parseInt(p.n || '1', 10) || 1));
      var cell = claps.getRange('B1');
      cell.setValue((Number(cell.getValue()) || 0) + n);
    }
    if (p.action === 'msg' && p.t) {
      var text = String(p.t).replace(/\s+/g, ' ').trim().slice(0, 60);
      var name = String(p.name || '').trim().slice(0, 10);
      if (text) msgs.appendRow([new Date(), name, text, '']);
    }

    var total = Number(claps.getRange('B1').getValue()) || 0;
    var last = msgs.getLastRow();
    var rows = last > 1 ? msgs.getRange(2, 1, last - 1, 4).getValues() : [];
    var out = rows
      .filter(function (r) { return r[2] && !String(r[3]).trim(); })
      .slice(-100).reverse()
      .map(function (r) {
        return { d: Utilities.formatDate(new Date(r[0]), 'Asia/Seoul', 'M.d'), n: String(r[1]), t: String(r[2]) };
      });
    return ContentService.createTextOutput(JSON.stringify({ claps: total, msgs: out }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
