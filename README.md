# 쓰다보니 작가가 너무 많아 — 경수중학교 학생 작품집 사이트

정적 사이트 한 파일(`index.html`)로 이루어져 있습니다. 빌드 과정 없이 그대로 배포됩니다.

## 배포 (GitHub + Vercel)

1. 이 폴더 내용을 GitHub 저장소에 올립니다. `index.html`이 저장소 루트에 있어야 합니다.
2. vercel.com → Add New → Project → 해당 저장소 Import.
3. Framework Preset은 **Other**, Build Command와 Output Directory는 비워 둔 채 Deploy.
4. 이후 GitHub에 push할 때마다 자동으로 다시 배포됩니다.

## 응원·박수 누적 (구글 시트 연동)

1. 새 구글 스프레드시트 → 확장 프로그램 → Apps Script → `apps-script.gs` 내용 붙여넣기 → 저장.
2. 배포 → 새 배포 → 웹 앱 → 실행: 나 / 액세스: 모든 사용자 → 배포 → 웹 앱 URL 복사.
3. `index.html`에서 `const API_URL = '';` 를 찾아 따옴표 안에 URL을 넣고 커밋.
4. 시트의 `messages` 탭 D열에 아무 글자나 적으면 그 응원은 사이트에서 숨겨집니다.

URL을 넣지 않으면 응원과 박수는 각자 브라우저에만 저장됩니다.
