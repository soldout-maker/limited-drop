# CLAUDE.md

한정 수량 드롭 판매 서비스. 2인 개발 Monorepo (pnpm workspace + Turborepo).
팀원 OS: Windows / macOS 혼용 — 스크립트와 훅은 OS에 의존하지 않게 작성합니다 (bash/PowerShell 전용 문법 대신 Node).

## 현재 단계

**초기 세팅 직후. 기능은 아직 구현되지 않았습니다.** 요청받지 않은 기능, API, DB 스키마를 먼저 만들지 않습니다.

## 가장 중요한 규칙: 미결정 기술을 임의로 확정하지 않는다

- 기술 선택 전에 [docs/decisions.md](docs/decisions.md)를 확인합니다.
- 상태가 `결정 필요`인 항목(ORM, DB, 테스트, 상태관리, Redis, Queue, 인증, 결제, 실시간, 배포)과 관련된 **의존성 추가, 코드 작성, 스키마 설계를 하지 않습니다.** 필요하면 사용자에게 먼저 결정을 요청하고, 선택지와 trade-off를 제시합니다.
- 결정이 나면 `/decision` 스킬로 decisions.md를 갱신합니다.
- 서비스 정책(대기열 규칙, 재고, 결제 실패 처리 등)은 추측해서 정하지 않고 묻습니다.

## 구조

```text
apps/web      Next.js 16 (App Router) — 사용자/판매자 화면
apps/api      NestJS 12 — REST API (현재 AppModule만 있음)
apps/worker   비동기 작업 진입점 (Queue 미결정, 현재 빈 파일)
packages/types   공유 타입 @limited-drop/types (tsc로 dist 빌드 → 앱에서 import)
packages/config  공유 tsconfig 프리셋 + ESLint flat config
```

- 패키지 이름: `@limited-drop/<name>`
- 앱 간 공유 타입은 앱끼리 직접 import하지 말고 `packages/types`를 거칩니다.
- tsconfig/ESLint 규칙 변경은 `packages/config` 한 곳에서 합니다.

## 명령어

```bash
pnpm install
pnpm dev | build | lint | typecheck      # turbo로 전체 실행
pnpm format | format:check               # prettier
pnpm --filter @limited-drop/api <script> # 패키지 하나만
```

- `pnpm test`는 **아직 없습니다** (테스트 전략 미결정, D-004). 없는 명령을 만들지 않습니다.
- 변경 후에는 `pnpm lint && pnpm typecheck && pnpm build`로 확인합니다.
- **Windows + 스마트 앱 컨트롤 환경에서는 `turbo.exe`가 차단됩니다** (`spawn UNKNOWN`). 이때는 `pnpm -r run <task>`로 대신 실행합니다.
- pnpm 11은 의존성의 build script를 기본 차단합니다. 새 의존성이 build script를 필요로 하면 `pnpm-workspace.yaml`의 `allowBuilds`에 추가합니다.

## 버전 주의 (D-002)

- TypeScript는 **6.0.x**, ESLint는 **9.x**로 고정 — 최신 메이저(TS 7, ESLint 10)는 typescript-eslint / eslint-config-next와 호환되지 않습니다. 업그레이드하지 않습니다.
- TS 6에서는 `types` 기본값이 `[]`입니다. Node 타입이 필요하면 tsconfig에 `"types": ["node"]`가 있어야 합니다.

## 코드 스타일

- TypeScript strict. `any` 금지(ESLint error) → `unknown` + type guard.
- 타입 import는 `import type` (ESLint가 강제).
- 포맷은 Prettier에 맡깁니다 (PostToolUse 훅이 수정한 파일을 자동 포맷).
- 주석은 "왜"가 코드로 드러나지 않을 때만 씁니다.

## Git / 협업 (자세히: [docs/workflow.md](docs/workflow.md))

Git Flow 유사 전략:

```text
기본:  develop → feat/* → PR → develop → QA → main(release PR) → 배포
긴급:  main → hotfix/* → PR → main → 긴급 배포, 이후 develop에도 반영 (방법은 D-015 결정 필요)
```

- **`main`, `develop` 직접 commit/push 금지** — guard 훅이 차단합니다. force push, `--no-verify`도 차단됩니다.
- 새 브랜치는 `feat|fix|refactor|chore|docs|test/<desc>`는 **`develop`에서**, `hotfix/<desc>`는 **`main`에서** 분기합니다. 분기 전 `git pull`.
- `fix/*`(개발 중 버그)와 `hotfix/*`(운영 긴급 버그)를 구분합니다.
- PR base: 일반 작업 → `develop`, `hotfix/*` → `main`. **`main`으로 일반 작업 PR을 만들지 않습니다.**
- 커밋: Conventional Commits `type(scope): 설명` (설명은 한국어), 논리적 변경 단위로.
- 커밋 메시지와 PR 본문에 `Co-Authored-By`나 "Generated with Claude Code" 같은 attribution 문구를 넣지 않습니다 (`.claude/settings.json`의 `attribution` 설정으로도 꺼 둠).
- PR: 템플릿 5개 섹션 작성, 상대방 review 후 merge (혼자 merge 금지). `/pr` 스킬 사용.
- 흐름: 티켓(무엇을/왜) → 작업(어떻게, PR 단위) → QA(요구사항대로 되는가) → 완료. `/ticket` 스킬 사용.

## 보안

- `.env` 파일은 읽거나 수정하지 않습니다 (훅이 차단). 새 환경변수는 `.env.example`에 키만 추가합니다.
- secret / credential을 코드, 커밋, 로그에 넣지 않습니다.

## Claude Code 구성 (`.claude/`)

| 종류     | 이름               | 역할                                                                       |
| -------- | ------------------ | -------------------------------------------------------------------------- |
| 스킬     | `/ticket`          | 티켓 / 작업 / QA 이슈 초안 작성 및 생성                                    |
| 스킬     | `/pr`              | 검사 실행 → 템플릿대로 PR 생성                                             |
| 스킬     | `/decision`        | docs/decisions.md 항목 추가/갱신                                           |
| 에이전트 | `code-reviewer`    | 팀 규칙 기준으로 diff/PR 리뷰 (읽기 전용)                                  |
| 훅       | `hooks/guard.mjs`  | main/develop 직접 push·commit, force push, `--no-verify`, `.env` 접근 차단 |
| 훅       | `hooks/format.mjs` | Claude가 수정한 파일에 Prettier 적용                                       |

개인 설정은 `.claude/settings.local.json`, 개인 메모는 `CLAUDE.local.md`에 둡니다 (gitignore됨).
