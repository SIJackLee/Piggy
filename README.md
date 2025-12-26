## 돼지 점프 (Pig Jump)

크롬 공룡 점프 스타일을 변형한 **HTML5 Canvas 게임**입니다.

### 실행 방법

- **가장 간단**: `index.html`을 더블클릭해서 브라우저로 열기
- **권장(로컬 서버)**:

```bash
npx --yes serve .
```

그 다음 안내된 주소로 접속합니다.

### 조작

- 점프: **Space** / **↑** / **터치**
- 재시작: **R** (또는 게임오버 후 Space/↑/터치)

### 기능

- 점프/중력/장애물/충돌
- 점수/최고점수(`localStorage`)
- 시간이 지날수록 속도 증가

## (선택) Vercel + Supabase로 리더보드/최고점 공유

이 프로젝트는 Vercel의 서버리스 함수(`/api`)를 통해 Supabase에 **플레이어별 최고점수**를 저장/조회할 수 있습니다.

### 1) Supabase 테이블 생성

- `supabase/high_scores.sql` 을 Supabase SQL Editor에서 실행하세요.

### 2) Vercel 환경변수 설정

Vercel Project Settings → Environment Variables에 아래 2개를 추가합니다:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (**브라우저에 노출 금지**, Vercel 서버에서만 사용)

### 3) 동작 방식

- 점수 저장: `POST /api/score` (게임오버 시 호출)
- 리더보드 조회: `GET /api/leaderboard?top=10`

### 주의(치트/검증)

현재는 클라이언트가 보낸 점수를 그대로 저장하므로, 필요하면
서버에서 서명/검증(예: HMAC, 플레이 시간 검증 등)을 추가하는 것이 좋습니다.


