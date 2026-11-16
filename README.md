# Limited Drop

한정 수량 상품을 정해진 시간에 오픈하고, 대기열 → 주문 → 결제 → 픽업까지 이어지는 **한정 드롭 판매 서비스**입니다.

## 현재 개발 단계

**🚧 프로젝트 초기 세팅 단계**

- 개발 환경과 협업 규칙을 구성했습니다.
- 기능(로그인, 드롭, 대기열, 결제 등)은 **아직 구현하지 않았습니다.**
- 주요 기술 결정은 아직 진행 중입니다 → [docs/decisions.md](./docs/decisions.md)

## 기술 스택

| 영역                 | 기술                       | 상태                                  |
| -------------------- | -------------------------- | ------------------------------------- |
| 언어                 | TypeScript (strict)        | 확정                                  |
| Frontend             | Next.js (App Router)       | 확정 (방향)                           |
| Backend              | NestJS, REST API           | 확정 (방향)                           |
| Monorepo             | pnpm workspace + Turborepo | pnpm: 확정 / Turborepo: **초기 선택** |
| Lint / Format        | ESLint + Prettier          | **초기 선택** (세부 규칙은 변경 가능) |
| CI                   | GitHub Actions             | **초기 선택**                         |
| ORM / DB             | —                          | **결정 필요**                         |
| Redis / Queue        | —                          | **결정 필요**                         |
| 상태관리 (web)       | —                          | **결정 필요**                         |
| 테스트               | —                          | **결정 필요**                         |
| 인증 / 결제 / 실시간 | —                          | **결정 필요**                         |
| 배포                 | —                          | **결정 필요**                         |

버전과 선택 이유는 [docs/decisions.md](./docs/decisions.md)에 있습니다.

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
│  ├─ decisions.md  # 기술 결정 기록 (결정 필요 / 초기 선택 / 확정)
│  └─ workflow.md   # 협업 규칙 (티켓→작업→QA, Git, PR)
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

## 협업 규칙

자세한 내용은 [docs/workflow.md](./docs/workflow.md)를 참고하세요.

### 개발 흐름: 티켓 → 작업 → QA → 완료

- **티켓** = 무엇을, 왜 만들어야 하는가 (사용자 요구사항)
- **작업** = 그것을 구현하려면 무엇을 해야 하는가 (PR 하나 크기)
- **QA** = 요구사항대로 제대로 동작하는가

GitHub Issues 템플릿(티켓 / 작업 / QA)과 Projects 보드(`Backlog → In Progress → Review → QA → Done`)를 사용합니다.

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

- TypeScript strict mode
- `any` 금지 (ESLint error) → `unknown` + type guard 사용
- 포맷은 Prettier에 맡김 (VS Code 저장 시 자동 포맷 — 권장 확장은 `.vscode/extensions.json`)
- 불필요한 주석은 최소화
