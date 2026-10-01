# 쓰다보니 작가가 너무 많아 — 응원 메시지 · 박수

응원 글과 박수를 **Upstash 저장소**에 보관합니다.
북내면 사이트와 **같은 무료 저장소(upstash-kv-byzantium-brush)를 나눠 씁니다.**
서랍 이름이 달라 글이 섞이지 않습니다.

```
upstash-kv-byzantium-brush
 ├─ letters:v1                ← 북내면 이야기 우체통
 ├─ toomuchauthor:cheers:v1   ← 경수중 응원 글
 ├─ toomuchauthor:hidden:v1   ← 경수중 숨긴 응원
 └─ toomuchauthor:claps:v1    ← 경수중 박수 수
```

## 파일
- `index.html` — 사이트 (응원 남기기·박수가 `/api/cheers` 로 저장됨)
- `admin.html` — 응원 관리 (숨기기·다시 보이기·삭제·박수 0으로·엑셀로 내려받기)
- `api/cheers.js` — 저장·불러오기 서버 기능
- `package.json`

## 올리는 법
1. 이 폴더의 `index.html`, `admin.html`, `package.json`, `api` 폴더를 경수중 GitHub 저장소 **맨 위(루트)** 에 올립니다 (같은 이름 파일은 교체)
2. Vercel 경수중(toomuchauthor) 프로젝트 → Environment Variables 에
   - `KV_REST_API_URL`, `KV_REST_API_TOKEN` 이 있어야 합니다 (저장소 연결 시 자동 생성)
     없으면 저장소 화면 → Connect to Project ▾ → **Connect to this project**
   - `ADMIN_TOKEN` = 관리자 비밀번호 (이미 있음)
3. Deployments → 최신 배포 ⋯ → **Redeploy**
4. `https://(경수중 주소)/admin.html` 에서 비밀번호로 들어가 확인

## 관리
- **숨기기**: 사이트에서만 가려집니다. 언제든 '다시 보이기' 가능
- **삭제**: 저장소에서 완전히 지웁니다 (되돌릴 수 없음)
- **엑셀로 내려받기**: 전체 응원과 박수 수를 엑셀에서 바로 열리는 파일로 저장
- 1분에 응원 5개·박수 30번까지만 받아 장난을 막고, 욕설은 자동으로 거릅니다
