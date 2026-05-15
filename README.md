# ezlab QA Bug Reporter

노션 이슈 보드에 버그 티켓을 빠르게 등록하는 QA 전용 웹 폼.

## 기능

- 노션 페이지 URL 입력 → 이슈 보드 DB 자동 탐색
- 버그 제목 / 심각도 / 재현 환경 / 재현 단계 / 기대 결과 / 실제 결과 입력
- 제출 시 노션 DB에 이슈 페이지 자동 생성

## 로컬 실행

```bash
NOTION_TOKEN=<your_token> node server.js
# → http://localhost:8787
```

## 배포

Vercel에 연결된 저장소에 푸시하면 자동 배포.  
API 엔드포인트는 `/api/` 디렉터리의 서버리스 함수로 동작.

## 환경 변수

| 변수 | 설명 |
|------|------|
| `NOTION_TOKEN` | Notion Integration 시크릿 키 |
| `PORT` | 로컬 서버 포트 (기본값: 8787) |
