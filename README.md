# 동네가 품절됐다 (Limited Drop)

동네 빵집 · 떡집 사장님이 **정해진 시각에 한정 수량을 여는 "드롭"**을 등록하면, 손님은 **대기열**에 줄을 서고 순번이 되면 **5분 안에 결제**한 뒤 **픽업 QR**로 매장에서 받아 가는 서비스입니다.

```text
드롭 등록(사장님) → 오픈 · 대기열 → 입장(5분 구매 권한) → 결제 → 픽업 QR
```

## 현재 개발 단계

**🚧 프로젝트 초기 세팅 단계**

- 개발 환경과 협업 규칙을 구성했습니다.
- 기능(로그인, 드롭, 대기열, 결제 등)은 **아직 구현하지 않았습니다.**
- 주요 기술 결정은 아직 진행 중입니다 → [docs/decisions.md](./docs/decisions.md)

### 로드맵 (8주, 아이디어 기획서 기준)

| 단계  | 기간  | 목표                                                              |
| ----- | ----- | ----------------------------------------------------------------- |
| 0단계 | 준비  | 개발 환경 · 협업 규칙 · 기술 스택 결정 (**진행 중**)              |
| 1단계 | 1~3주 | **MVP**: 드롭 등록 → 대기열 → 결제 → 픽업 QR이 한 번에 동작       |
| 2단계 | 4~5주 | 지도 · 지역 필터, 실시간 품절 표시, 사장님 대시보드, 봇 방지, AEO |
| 3단계 | 6~8주 | 알림, 동시 접속 1,000명 부하 테스트, 동네 빵집 1~2곳 시범 드롭    |

기획 내용(문제 정의, 핵심 기능, 성과 지표)은 노션 「아이디어 기획서」 페이지에 있습니다.

## 기술 스택

| 영역           | 기술                       | 상태                                  |
| -------------- | -------------------------- | ------------------------------------- |
| 언어           | TypeScript (strict)        | 확정                                  |
| Frontend       | Next.js (App Router)       | 확정 (방향)                           |
| Backend        | NestJS, REST API           | 확정 (방향)                           |
| Monorepo       | pnpm workspace + Turborepo | pnpm: 확정 / Turborepo: **초기 선택** |
| Lint / Format  | ESLint + Prettier          | **초기 선택** (세부 규칙은 변경 가능) |
| CI             | GitHub Actions             | **초기 선택**                         |
| ORM / DB       | Drizzle vs Prisma / —      | **결정 필요** (회의)                  |
| Redis / Queue  | Redis + BullMQ             | 초기 제안                             |
| 실시간         | SSE                        | 초기 제안                             |
| 결제           | 토스페이먼츠               | 초기 제안                             |
| 상태관리 (web) | TanStack Query + Zustand   | 초기 제안                             |
| 테스트         | —                          | **결정 필요**                         |
| 인증 / 배포    | —                          | **결정 필요**                         |

`초기 제안`은 기획 단계의 계획이며 아직 설치하지 않았습니다. 버전과 선택 이유는 [docs/decisions.md](./docs/decisions.md)에 있습니다.

## 프로젝트 구조

```text
.
├─ apps/
│  ├─ web/        # Next.js — 사용자 / 판매자 화면 (추후 관리자)
│  ├─ api/        # NestJS — REST API (인증, 드롭, 대기열, 주문, 결제, 픽업 등)
│  └─ worker/     # 비동기 작업 (결제 미완료 처리, 알림 등) — 현재 빈 진입점
├─ packages/
│  ├─ types/      # 앱 간 공유 타입 (@limited-drop/types)
│  └─ config/     # 공유 tsconfig / ESLint 설정 (@limited-drop/config)
├─ docs/
│  ├─ decisions.md  # 기술 결정 기록 + 서비스 정책 질문
│  ├─ workflow.md   # 협업 규칙 (티켓→작업→QA, Git, PR)
│  └─ conventions.md # 개발 컨벤션 (이름, TS, API, 리뷰 규칙 등)
├─ .claude/         # Claude Code 공유 설정 (스킬 / 에이전트 / 훅) — CLAUDE.md 참고
├─ .github/
│  ├─ workflows/ci.yml
│  ├─ ISSUE_TEMPLATE/   # 티켓 / 작업 / QA
│  └─ pull_request_template.md
├─ package.json
├─ pnpm-workspace.yaml
├─ turbo.json
├─ tsconfig.json
└─ CLAUDE.md         # Claude Code용 프로젝트 안내
```

## 로컬 실행 방법

### 요구 사항

- Node.js 24 (`.nvmrc`) — macOS는 `nvm use` 또는 `fnm use`로 맞추면 편합니다
- pnpm 11 — `corepack enable` 후 사용하거나 `npm i -g pnpm` (버전은 `package.json`의 `packageManager`를 따름)
- 개발 OS: Windows / macOS 혼용. 줄바꿈은 `.gitattributes`로 LF 고정

### 설치 및 실행

```bash
git clone https://github.com/soldout-maker/limited-drop.git
cd limited-drop
git switch develop     # 개발은 develop 기준

pnpm install
cp .env.example .env   # 필요 시 값 수정

pnpm dev               # web(3000) / api(4000) / worker 동시 실행
```

특정 앱만 실행:

```bash
pnpm --filter @limited-drop/web dev
pnpm --filter @limited-drop/api dev
pnpm --filter @limited-drop/worker dev
```

### 주요 명령어

| 명령                | 설명                      |
| ------------------- | ------------------------- |
| `pnpm dev`          | 전체 개발 서버 실행       |
| `pnpm build`        | 전체 빌드                 |
| `pnpm lint`         | ESLint 검사               |
| `pnpm typecheck`    | TypeScript 타입 검사      |
| `pnpm format`       | Prettier로 전체 포맷 적용 |
| `pnpm format:check` | 포맷 검사 (CI에서 사용)   |

> `pnpm test`는 테스트 전략이 결정된 뒤 추가합니다 ([D-004](./docs/decisions.md#d-004-테스트-전략-및-도구)).

> **Windows 사용자:** 스마트 앱 컨트롤이 켜져 있으면 `turbo.exe`가 차단되어 `pnpm dev/build/lint/typecheck`가 `spawn UNKNOWN` 오류로 실패합니다. 이 경우 `pnpm -r run build`처럼 pnpm으로 직접 실행하세요. (`dev`는 `pnpm -r --parallel run dev`)

## 환경변수

- `.env`는 Git에 올리지 않습니다. `.env.example`을 복사해서 사용합니다.
- 새 환경변수를 추가하면 **`.env.example`에도 키를 추가**합니다 (값은 비워 둠).
- 실제 secret이나 credential은 절대 커밋하지 않습니다.

| 변수           | 사용처      | 상태                     |
| -------------- | ----------- | ------------------------ |
| `API_PORT`     | api         | 사용 중 (기본값 4000)    |
| `DATABASE_URL` | api         | 추후 확정 (D-003, D-008) |
| `REDIS_URL`    | api, worker | 추후 확정 (D-006)        |
| `JWT_SECRET`   | api         | 추후 확정 (D-009)        |

토스페이먼츠 · 카카오 · 공공데이터 키 자리도 `.env.example`에 주석으로 있습니다. 실제 키는 팀 비밀값 공유 방법(D-025)으로 받습니다.

## 협업 규칙

자세한 내용은 [docs/workflow.md](./docs/workflow.md)를 참고하세요.

### 개발 흐름: 티켓 → 작업 → QA → 완료

- **티켓** = 무엇을, 왜 만들어야 하는가 (사용자 요구사항)
- **작업** = 그것을 구현하려면 무엇을 해야 하는가 (PR 하나 크기)
- **QA** = 요구사항대로 제대로 동작하는가

GitHub Issues 템플릿(티켓 / 작업 / QA)과 [Projects 보드](https://github.com/orgs/soldout-maker/projects/1)(`Backlog → In Progress → Review → QA → Done`)를 사용합니다.

### Git / Branch (Git Flow 유사)

| 브랜치                                              | 역할                        | 분기      | PR 대상                     |
| --------------------------------------------------- | --------------------------- | --------- | --------------------------- |
| `main`                                              | 배포 브랜치, 항상 안정 상태 | —         | —                           |
| `develop`                                           | 개발 통합, QA 기준          | `main`    | `main` (릴리스)             |
| `feat/` `fix/` `refactor/` `chore/` `docs/` `test/` | 기능 / 일반 작업            | `develop` | `develop`                   |
| `hotfix/`                                           | 운영(main) 긴급 버그        | `main`    | `main` → `develop`에도 반영 |

```text
기본:   develop → feat/* → PR → develop → QA → main → 배포
긴급:   main → hotfix/* → PR → main → 긴급 배포 (+ develop에도 반영)
```

- **`main`, `develop`에 직접 commit / push 금지** — 모든 변경은 PR로
- `fix/*` = 개발 중 버그, `hotfix/*` = 운영 중 긴급 버그
- 브랜치 하나에는 작업 목적 하나

### Commit

```text
type(scope): 설명

feat(drop): 드롭 생성 API 구현
fix(queue): 대기열 순번 계산 오류 수정
```

### Pull Request

- 템플릿 작성: 작업 내용 / 변경 이유 / 구현 내용 / 테스트·확인 / 관련 티켓
- **상대방 review 후 merge** — 혼자 merge하지 않음, CI 통과 필수
- base 브랜치 확인: 일반 작업은 `develop`, `hotfix/*`만 `main`
- PR은 작게 유지

### 코드 스타일

자세한 규칙은 **[docs/conventions.md](./docs/conventions.md)** (용어 사전, API 형식, 기획 약속 규칙 포함)를 참고하세요.

- TypeScript strict mode, `any` 금지 (ESLint error) → `unknown` + type guard
- 파일 이름: 컴포넌트 `PascalCase.tsx`, 그 외 `kebab-case`
- 시간은 UTC, 금액은 원 단위 정수, 정책 숫자는 `packages/types`에서만
- 포맷은 Prettier에 맡김 (VS Code 저장 시 자동 포맷 — 권장 확장은 `.vscode/extensions.json`)

## 문서

| 문서                                         | 내용                                            | 위치              |
| -------------------------------------------- | ----------------------------------------------- | ----------------- |
| [docs/conventions.md](./docs/conventions.md) | 개발 컨벤션 (정본)                              | GitHub            |
| [docs/workflow.md](./docs/workflow.md)       | 티켓 → 작업 → QA, 브랜치 · 커밋 · PR, 협업 루틴 | GitHub            |
| [docs/decisions.md](./docs/decisions.md)     | 기술 결정 기록, 서비스 정책 질문                | GitHub            |
| 기획서, 회의록                               | 기획과 논의 기록                                | 노션 (품절메이커) |
