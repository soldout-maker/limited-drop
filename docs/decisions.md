# 기술 결정 기록

팀이 내린(또는 내려야 할) 기술 결정을 기록합니다.
결정이 바뀌면 내용을 지우지 말고 `결정 상태`와 `결정 이유`를 갱신합니다.

**결정 상태 표기**

| 상태        | 의미                                                    |
| ----------- | ------------------------------------------------------- |
| `확정`      | 팀이 합의함                                             |
| `초기 선택` | 초기 세팅을 위해 일단 적용함. 팀 합의 시 변경할 수 있음 |
| `초기 제안` | 아직 적용하지 않았고 제안만 해 둔 상태                  |
| `결정 필요` | 아직 논의하지 않음. 관련 기능 개발 전에 결정해야 함     |

---

## 요약

| ID    | 주제                        | 상태      |
| ----- | --------------------------- | --------- |
| D-001 | Monorepo 도구 (Turborepo)   | 초기 선택 |
| D-002 | 언어 / 툴체인 버전          | 초기 선택 |
| D-003 | ORM (Prisma vs Drizzle)     | 결정 필요 |
| D-004 | 테스트 전략 및 도구         | 결정 필요 |
| D-005 | 프론트엔드 상태관리         | 결정 필요 |
| D-006 | Redis 사용 구조             | 결정 필요 |
| D-007 | Queue 구현 방식             | 결정 필요 |
| D-008 | DB 종류 및 구조             | 결정 필요 |
| D-009 | 인증 방식                   | 결정 필요 |
| D-010 | 결제 구현 방식              | 결정 필요 |
| D-011 | 실시간 통신 방식            | 결정 필요 |
| D-012 | 배포 환경                   | 결정 필요 |
| D-013 | Commit 메시지 자동 검사     | 초기 제안 |
| D-014 | ESLint / Prettier 세부 규칙 | 초기 선택 |
| D-015 | hotfix → develop 반영 방법  | 결정 필요 |
| D-016 | PR merge 방식               | 초기 제안 |

---

## D-001. Monorepo 도구

- **주제:** pnpm workspace만 쓸지, Turborepo를 함께 쓸지
- **선택지:**
  - A. pnpm workspace만 사용 (`pnpm -r run build`)
  - B. pnpm workspace + Turborepo (작업 순서, 캐시, 병렬 실행)
- **현재 제안:** B (적용됨)
- **결정 이유:** 앱이 3개(web/api/worker)이고 공유 패키지가 의존 관계를 갖기 때문에 빌드 순서 관리와 캐시가 유용함. 설정은 `turbo.json` 하나라서 제거 비용도 낮음.
- **주의:** Windows의 **스마트 앱 컨트롤(Smart App Control)** 이 켜진 PC에서는 `turbo.exe` 실행이 차단됨 (`An Application Control policy has blocked this file`). 이 경우 `pnpm -r run <task>`로 같은 작업을 실행할 수 있음. 팀원 PC에서 문제가 계속되면 A로 바꾸는 것을 고려.
- **결정 상태:** `초기 선택`

## D-002. 언어 / 툴체인 버전

- **주제:** Node / TypeScript / ESLint 버전
- **현재 적용:**
  - Node 24 (`.nvmrc`), pnpm 11
  - TypeScript **6.0.x** — TS 7이 최신이지만 typescript-eslint가 아직 지원하지 않음(`<6.1`). 반대로 `@nestjs/schematics`는 TS 6 이상이 필요.
  - ESLint **9.x** — ESLint 10이 최신이지만 `eslint-config-next`가 쓰는 플러그인들이 아직 9까지만 지원함.
  - Next.js 16, NestJS 12, React 19
- **결정 이유:** 의존성 간 peer dependency 충돌이 없는 조합. 생태계가 따라오면 TS 7 / ESLint 10으로 올릴 것.
- **결정 상태:** `초기 선택`

## D-003. ORM

- **주제:** DB 접근 도구
- **선택지:** Prisma / Drizzle / TypeORM / 기타
- **현재 제안:** 없음
- **결정 이유:** —
- **결정 상태:** `결정 필요` — DB 관련 첫 작업 전에 결정. 결정 전까지 DB 관련 코드와 의존성을 추가하지 않음.

## D-004. 테스트 전략 및 도구

- **주제:** 테스트 범위(단위/통합/E2E)와 도구
- **선택지:** Vitest / Jest (NestJS 기본) / Playwright (E2E) 등
- **현재 제안:** 없음. 현재 `test` 스크립트와 CI의 test 단계는 **일부러 추가하지 않음**.
- **결정 이유:** —
- **결정 상태:** `결정 필요` — 결정 후 각 패키지에 `test` 스크립트, `turbo.json`에 `test` 작업, CI에 `pnpm test` 단계를 추가.

## D-005. 프론트엔드 상태관리

- **주제:** 서버 상태 / 클라이언트 상태 관리
- **선택지:** TanStack Query, SWR, Zustand, Jotai, React 기본 기능만 사용 등
- **결정 상태:** `결정 필요`

## D-006. Redis 사용 구조

- **주제:** Redis를 무엇에 쓸지 (대기열, 재고 선점, 캐시, 세션 등)와 key 구조
- **결정 상태:** `결정 필요` — 대기열/재고 정책이 정해진 뒤 결정. `.env.example`의 `REDIS_URL`은 주석 처리돼 있음.

## D-007. Queue 구현 방식

- **주제:** worker가 처리할 비동기 작업의 큐
- **선택지:** BullMQ / 클라우드 큐(SQS 등) / 기타
- **결정 상태:** `결정 필요` — 현재 `apps/worker`는 빈 진입점만 있음.

## D-008. DB 종류 및 구조

- **주제:** DB 종류(PostgreSQL, MySQL 등)와 스키마
- **결정 상태:** `결정 필요` — 스키마는 도메인 정책 확정 후 설계.

## D-009. 인증 방식

- **주제:** 세션 / JWT / 소셜 로그인 / 판매자·사용자 계정 구분
- **결정 상태:** `결정 필요`

## D-010. 결제 구현 방식

- **주제:** PG사, 결제 흐름, 미결제 주문 처리 정책
- **결정 상태:** `결정 필요`

## D-011. 실시간 통신 방식

- **주제:** 대기열 순번 등 실시간 갱신 방식
- **선택지:** 폴링 / SSE / WebSocket
- **결정 상태:** `결정 필요`

## D-012. 배포 환경

- **주제:** web / api / worker / DB / Redis 배포 위치
- **결정 상태:** `결정 필요` — 결정 후 CD 워크플로를 추가. 브랜치 전략상 배포 기준 브랜치는 `main`.

## D-013. Commit 메시지 자동 검사

- **주제:** Conventional Commits를 도구로 강제할지
- **선택지:**
  - A. 문서 규칙 + 리뷰로만 관리 (현재)
  - B. commitlint + husky로 로컬에서 검사
  - C. PR 제목만 CI에서 검사 (squash merge 사용 시 충분)
- **현재 제안:** 처음에는 A로 시작하고, 규칙이 자주 깨지면 C 검토.
- **결정 상태:** `초기 제안`

## D-014. ESLint / Prettier 세부 규칙

- **현재 적용:** typescript-eslint `recommended` + `no-explicit-any: error` + `consistent-type-imports` + Prettier(작은따옴표, 세미콜론, 줄 길이 100). web은 `eslint-config-next/core-web-vitals`를 추가로 적용.
- **결정 이유:** 일반적인 기본값. 규칙 변경은 `packages/config/eslint/base.js`, `.prettierrc.json` 한 곳에서 함.
- **결정 상태:** `초기 선택`

## D-015. hotfix를 develop에 반영하는 방법

- **주제:** `hotfix/*`를 `main`에 merge한 뒤 같은 수정을 `develop`에 반영하는 방식 ([workflow.md 2장](./workflow.md#긴급-패치-흐름))
- **선택지:**
  - A. merge — `main`을 `develop`에 merge하는 PR (main 이력이 그대로 develop에 들어감)
  - B. cherry-pick — hotfix 커밋만 골라 `develop` 기준 브랜치에 적용 후 PR
- **현재 제안:** 없음 (팀 논의 필요). D-016의 merge 방식과 함께 정하는 것이 좋음.
- **결정 상태:** `결정 필요`

## D-016. PR merge 방식

- **주제:** 브랜치별 PR merge 방식
- **현재 제안:**
  - `feat/*` 등 → `develop`: Squash merge (작업 하나 = 커밋 하나, PR 제목 = 커밋 메시지)
  - `hotfix/*` → `main`: Squash merge
  - `develop` → `main` (릴리스): Merge commit — squash하면 main과 develop의 이력이 어긋나 다음 릴리스 때 충돌이 생기기 쉬움
- **결정 상태:** `초기 제안`

---

## 새 결정 추가 양식

```text
## D-0XX. 제목

- **주제:**
- **선택지:**
- **현재 제안:**
- **결정 이유:**
- **결정 상태:** 결정 필요 | 초기 제안 | 초기 선택 | 확정
```
