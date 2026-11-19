# 개발 컨벤션

**동네가 품절됐다** · 2인 풀스택 팀

코드를 **어떻게** 쓸지에 대한 팀 약속입니다. Git / PR / 이슈 흐름은 [workflow.md](./workflow.md), 기술 선택은 [decisions.md](./decisions.md)를 봅니다.

- **이 문서가 정본입니다.** 노션의 「개발 컨벤션」 초안(11/14)과 저장소 초안을 합친 문서이며, 노션에는 요약과 링크만 둡니다.
- 항목마다 상태를 표시합니다.
  - `초기 제안`: 일단 이렇게 쓰고, 불편하면 PR로 바꿉니다.
  - `결정 필요`: 아직 쓰지 않습니다. 관련 코드를 쓰기 전에 함께 정합니다 ([decisions.md](./decisions.md)).
  - `도구`: ESLint / Prettier / TypeScript가 자동으로 검사합니다.
- 규칙에 없는 상황이 생기면 둘이 정하고 **이 문서에 한 줄 추가**합니다.

---

## 0. 기본 원칙

- **핵심 흐름 먼저**: 드롭 등록 → 대기열 → 결제 → 픽업 QR이 한 번에 도는 MVP를 먼저 완성하고, 부가 기능은 그다음에 붙입니다.
- **스펙 먼저, 코드 나중**: API는 스펙과 공유 타입을 먼저 합의한 뒤 구현합니다 (방식은 D-019).
- **혼자 merge하지 않는다**: `main`, `develop`에는 PR과 상대 리뷰를 거쳐서만 들어갑니다.
- **기획서의 약속은 코드 규칙으로 지킨다**: 초과 판매 0건, 5분 구매 권한, 1인 한도 → [11장](#11-기획서-약속을-지키는-코드-규칙-초기-제안)

## 1. 폴더 구조 `초기 제안`

```text
apps/
  web/      # Next.js (App Router) — 손님 · 사장님 · 관리자 화면
  api/      # NestJS — REST API (+ 실시간: D-011)
  worker/   # 백그라운드 작업 — 미결제 재고 복구 등 (큐: D-007)
packages/
  types/    # 프론트 · 백 공유 타입 (DTO, 상태값, 에러 코드, 정책 상수)
  config/   # tsconfig, ESLint 공통 설정
```

**api — NestJS 모듈은 도메인 단위, 이름은 복수형** (NestJS 관례)

```text
apps/api/src/
├─ main.ts
├─ app.module.ts
├─ common/          # 여러 도메인이 같이 쓰는 guard, filter, interceptor
└─ modules/
   ├─ auth/  users/  stores/  queue/  orders/
   ├─ payments/  pickup/  map/  insights/
   └─ drops/                  # 예시
      ├─ drops.module.ts
      ├─ drops.controller.ts   # HTTP 요청 / 응답만 (얇게)
      ├─ drops.service.ts      # 비즈니스 로직, 상태 변경
      ├─ dto/create-drop.dto.ts
      └─ entities/             # 또는 schema/ (ORM 결정 후, D-003)
```

**web — 라우트는 역할별 route group**

```text
apps/web/
├─ app/
│  ├─ (customer)/...            # 손님: /drops, /drops/[id], /map, /me/orders
│  ├─ (seller)/seller/...       # 사장님: /seller/drops, /seller/orders, /seller/dashboard
│  └─ (admin)/admin/...         # 관리자 (후순위)
├─ components/                  # 여러 화면이 같이 쓰는 UI
├─ features/<domain>/           # 특정 도메인 전용 컴포넌트 · 훅
└─ lib/                         # API 클라이언트, 유틸
```

- 기본은 Server Component. 상호작용이 필요한 컴포넌트만 `'use client'`.
- 기능별 모듈 · 화면 · 담당은 [13장](#13-기능별-모듈--화면--담당) 표를 봅니다.

## 2. 이름 짓기 `초기 제안`

**코드**

| 대상                   | 규칙                            | 예시                                              |
| ---------------------- | ------------------------------- | ------------------------------------------------- |
| 변수, 함수             | `camelCase`                     | `remainingQty`, `createDrop`                      |
| 클래스, 컴포넌트, 타입 | `PascalCase` (`I` 접두사 없음)  | `DropService`, `QueueStatus` (❌ `IDrop`)         |
| 상수, 상태값           | `UPPER_SNAKE_CASE`              | `MAX_PER_USER`, `OrderStatus.PAID`                |
| boolean                | `is` / `has` / `can`으로 시작   | `isSoldOut`, `hasPickedUp`                        |
| 함수                   | 동사로 시작                     | `getDrop`, `reserveStock`, `releaseExpiredOrders` |
| 이벤트 핸들러          | props는 `on~`, 구현은 `handle~` | `onSubmit={handleSubmit}`                         |

**파일**

| 대상                | 규칙             | 예시                                        |
| ------------------- | ---------------- | ------------------------------------------- |
| React 컴포넌트 파일 | `PascalCase.tsx` | `DropCard.tsx`                              |
| 그 외 파일, 폴더    | `kebab-case`     | `use-queue-rank.ts`, `api-client.ts`        |
| NestJS 파일         | NestJS 기본 규칙 | `drops.controller.ts`, `create-drop.dto.ts` |
| Next.js 예약 파일   | Next.js 규칙     | `page.tsx`, `layout.tsx`, `route.ts`        |

> ⚠️ **파일 이름 대소문자만 바꿀 때는 `git mv`를 씁니다.** macOS · Windows는 대소문자를 구분하지 않고 CI(Linux)는 구분해서, 그냥 이름을 바꾸면 로컬에서는 멀쩡하고 CI에서만 import가 깨집니다.
>
> ```bash
> git mv dropCard.tsx DropCard.tsx
> ```

**DB** `결정 필요 후 적용` (ORM · DB 결정: D-003, D-008)

- 테이블: 복수형 `snake_case` — `users`, `stores`, `drops`, `pickup_slots`, `orders`
- 컬럼: `snake_case` — `open_at`, `per_user_limit`, `created_at`
- 모든 테이블에 `id`, `created_at`, `updated_at`
- 접미사: 시간 `_at`, 수량 `_qty`, 금액 `_amount`
- DB의 `snake_case`는 백엔드 안에서만 씁니다. API JSON은 `camelCase`.

**Redis 키** `결정 필요 후 적용` (D-006)

- `도메인:식별자:세부` 형식 — `queue:{dropId}`, `admit:{dropId}:{userId}`, `stock:{dropId}`, `bought:{dropId}`

## 3. TypeScript `초기 제안`

`도구` strict 모드, `any` 금지, `import type` 강제, 사용하지 않는 변수 금지.

| 규칙                                 | 이유                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `any` 대신 `unknown` + 타입 가드     | 외부 입력(API 응답, `JSON.parse`)의 타입은 믿지 않는다                 |
| `as` 타입 단언은 최소화              | 컴파일러를 속이는 것이라 버그를 숨긴다                                 |
| non-null 단언 `!` 금지               | `null`이 실제로 오면 런타임 에러                                       |
| 객체 타입은 `type`을 기본으로        | 하나로 통일. 클래스가 구현할 계약 등 필요한 곳만 `interface`           |
| export하는 함수는 반환 타입을 적는다 | 공개 API가 의도치 않게 바뀌는 것을 막는다 (React 컴포넌트는 생략 가능) |

**상태값 · 에러 코드 정의 방식** — `packages/types`에 `as const` 객체로 정의합니다. 쓰는 쪽은 `OrderStatus.PAID`처럼 enum과 똑같이 쓰고, 타입은 문자열 유니온이 됩니다. TypeScript `enum`은 쓰지 않습니다 (JSON 값과 타입이 따로 놀고, 빌드 결과물에 코드가 생김).

```ts
// packages/types/src/order.ts
export const OrderStatus = {
  RESERVED: 'RESERVED',
  PAID: 'PAID',
  PICKED_UP: 'PICKED_UP',
  EXPIRED: 'EXPIRED',
  CANCELED: 'CANCELED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

// 사용
if (order.status === OrderStatus.PAID) { ... }
```

- **`null` vs `undefined`**: 함수 안의 "값이 없음"은 `undefined`(선택적 속성 `?:`), API JSON의 "명시적으로 비어 있음"은 `null`. JSON에는 `undefined`가 없어서 키가 사라지기 때문입니다.

## 4. import `초기 제안`

순서 (그룹 사이 빈 줄 하나):

```ts
import { readFileSync } from 'node:fs'; // 1. Node 내장 (node: 접두사)

import { Injectable } from '@nestjs/common'; // 2. 외부 패키지

import { OrderStatus } from '@limited-drop/types'; // 3. 워크스페이스 패키지

import { DropsRepository } from './drops.repository'; // 4. 상대 경로
```

- 다른 앱의 파일을 직접 import하지 않습니다 (`apps/web` → `apps/api` ❌). 공유할 것은 `packages/types`로 옮깁니다.
- 경로 별칭(`@/`)은 필요해지면 도입합니다. barrel(`index.ts` 재export)은 패키지 진입점에만 둡니다.

## 5. API 규칙 `초기 제안` (D-017)

**URL**

- REST, 기본 경로 `/api/v1`
- 복수 명사 + kebab-case: `GET /api/v1/drops`, `POST /api/v1/stores/{storeId}/drops`, `POST /api/v1/drops/{dropId}/queue`
- 판매자 전용은 `/api/v1/seller/...`, 관리자 전용은 `/api/v1/admin/...`
- 동작은 HTTP 메서드로 (`POST /drops` ✅, `POST /create-drop` ❌)
- JSON 필드, 쿼리 파라미터는 `camelCase`

**응답 형식**

```text
// 성공
{ "data": { ... } }
// 목록
{ "data": [ ... ], "meta": { "page": 1, "size": 20, "total": 57 } }
// 실패
{ "error": { "code": "DROP_SOLD_OUT", "message": "이미 품절된 드롭입니다." } }
```

**HTTP 상태 코드**

| 코드 | 언제        | 코드 | 언제                          |
| ---- | ----------- | ---- | ----------------------------- |
| 200  | 조회, 수정  | 403  | 권한 없음 (입장 없이 구매 등) |
| 201  | 생성        | 404  | 없음                          |
| 400  | 입력 오류   | 409  | 충돌 (품절, 중복 구매)        |
| 401  | 로그인 필요 | 429  | 요청 과다 (봇 방지)           |

**에러 코드** — `packages/types`에 모아 둡니다 (3장 방식). 영어 `UPPER_SNAKE_CASE`, 사용자 메시지는 한국어.
`DROP_NOT_OPEN`, `DROP_SOLD_OUT`, `QUEUE_NOT_ADMITTED`, `PER_USER_LIMIT_EXCEEDED`, `PAYMENT_FAILED` …

**값 표현**

| 값   | 규칙                                                                            | 이유                                                  |
| ---- | ------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 시간 | 서버 · DB 모두 **UTC로 저장**, ISO 8601 문자열로 주고받기, 화면에서만 한국 시간 | 오픈 시각이 서비스의 핵심. 시간대가 섞이면 9시간 오차 |
| 금액 | **원 단위 정수** (소수 금지)                                                    | `0.1 + 0.2 !== 0.3`. 금액 오차는 결제 사고            |
| ID   | 문자열로 다루기                                                                 | 숫자 ID든 UUID든 프론트 코드가 바뀌지 않게            |

**스펙 공유** — 새 API는 구현 전에 스펙(Swagger)에 먼저 추가하고 상대에게 공유합니다 (D-019).

## 6. 상태값 (공유) `초기 제안`

`packages/types`에 3장 방식으로 정의하고 프론트 · 백이 같은 값을 씁니다.

- **UserRole**: `CUSTOMER`, `SELLER`, `ADMIN`
- **DropStatus**: `SCHEDULED` → `OPEN` → `SOLD_OUT` / `CLOSED`
- **OrderStatus**: `RESERVED` → `PAID` → `PICKED_UP`, 그리고 `EXPIRED`(미결제), `CANCELED`, `NO_SHOW`(미수령)

**상태 변경 규칙**

- 상태를 바꾸는 코드는 **각 도메인 service 한 곳**에서만 처리합니다.
- 결제 웹훅과 만료 작업이 동시에 같은 주문을 바꿀 수 있습니다. **"현재 상태가 `RESERVED`일 때만 바꾼다"는 조건부 업데이트**로 둘 중 하나만 성공하게 합니다.

## 7. 정책 숫자는 한 곳에서 `초기 제안`

기획서의 숫자는 `packages/types/src/policy.ts`에 상수로 모으고, **코드에 숫자를 직접 쓰지 않습니다.**

```text
ADMISSION_TTL_SEC = 300; // 입장 후 5분 구매 권한
PICKUP_SLOT_MINUTES = 30; // 픽업 시간대 단위
FREE_DROP_COUNT = 3; // 첫 3회 수수료 무료
COMMISSION_RATE = 0.03; // 판매수수료 3%
REFERRAL_COMMISSION_RATE = 0.02; // 추천 시 2%
REFERRAL_MONTHS = 3; // 추천 할인 기간
ADMIT_PER_SEC = 미정; // 1초에 몇 명 입장
DEFAULT_PER_USER_LIMIT = 미정; // 1인 한도 기본값
NO_SHOW_AFTER_MINUTES = 미정; // 픽업 마감 후 몇 분에 미수령 처리
```

- 비율(`COMMISSION_RATE`)로 금액을 계산할 때는 **반올림 규칙을 정하고**(예: 원 단위 내림) 계산 함수 하나로만 계산합니다. 반올림 규칙은 `결정 필요` (P-007).

## 8. 에러 처리 · 로그 `초기 제안`

- 에러를 삼키지 않습니다. `catch` 했으면 처리하거나, 정보를 더해 다시 던집니다.
- 예상한 실패(품절, 오픈 전)는 4xx + 에러 코드, 예상 못 한 실패(버그, DB 장애)는 5xx.
- **로그에 개인정보와 secret을 남기지 않습니다**: 비밀번호, 토큰, 결제 정보, 전화번호 전체. 필요하면 마스킹 (`010-****-1234`).
- `console.log`는 디버깅 후 지웁니다. 로그 라이브러리와 형식은 D-021.

## 9. 코드 스타일 · 도구

- `도구` TypeScript strict, ESLint + Prettier (`packages/config`, `.prettierrc.json` 공유)
- `도구` Prettier: 작은따옴표, 세미콜론, 들여쓰기 2칸, 한 줄 100자
- `도구` CI(GitHub Actions): PR마다 format → lint → typecheck → build (test는 D-004 결정 후 추가)
- 커밋 전 자동 lint · 포맷 (Husky + lint-staged): `초기 제안` D-013
- 주석은 "무엇"보다 **"왜"**. 특히 **동시성 · 결제 관련 코드에는 이유를 남깁니다.**
- TODO에는 이슈 번호를 붙입니다: `// TODO(#12): 미결제 재고 반환을 worker로 이동`

## 10. 환경 변수 · 보안 `초기 제안`

- `.env`는 절대 커밋하지 않습니다. `.env.example`에 **키 이름만** 적습니다.
- 실제 키(토스페이먼츠, 카카오, 공공데이터, DB)는 **팀 비밀 공유 방법**으로 따로 전달합니다 (방법은 D-025 `결정 필요`).
- **`NEXT_PUBLIC_` 접두사는 브라우저에 그대로 노출됩니다.** 노출해도 되는 값에만 붙입니다.
- 필요한 환경 변수가 없으면 앱이 시작할 때 바로 실패하게 합니다 (검증 방법은 D-018과 함께).
- 의존성 추가는 쓰는 패키지에만 (`pnpm --filter @limited-drop/api add <pkg>`). `결정 필요` 기술의 라이브러리는 결정 전에 설치하지 않습니다.
- `pnpm-lock.yaml` 충돌은 직접 고치지 않고, 대상 브랜치를 merge한 뒤 `pnpm install`로 재생성합니다.

## 11. 기획서 약속을 지키는 코드 규칙 `초기 제안`

기획서의 약속(초과 판매 0건, 5분 구매 권한, 1인 제한, AI 검색 노출)이 코드에서 깨지지 않게 하는 규칙입니다. 구현 기술(Redis 구조 등)은 [decisions.md](./decisions.md)의 결정을 따릅니다.

- **재고 차감은 한 곳에서만**: `reserveStock()` 함수 하나로만 차감합니다. 다른 코드에서 수량을 직접 빼지 않습니다. (원자적 차감 방식: D-006 — 기획안은 Redis Lua 스크립트)
- **입장 없이 구매 금지**: 입장(Admission)이 없는 주문 요청은 403 `QUEUE_NOT_ADMITTED`로 거절합니다.
- **1인 한도는 두 번 확인**: 빠른 저장소(Redis)에서 한 번, DB에서 드롭별 사용자 주문 수로 한 번 더 확인합니다.
- **결제는 멱등하게**: 결제 승인 · 웹훅은 멱등키로 처리해, 같은 결제가 두 번 와도 한 번만 반영합니다.
- **오픈은 서버 시간으로**: 화면 카운트다운은 서버 시간을 받아 보정하고, 열렸는지 판단은 서버가 합니다. 사용자 PC 시계는 믿지 않습니다.
- **지도 데이터와 입점 가게 분리**: 공공데이터는 `places`, 입점 가게는 `stores`. 입점하면 `stores.place_id`로 연결합니다. 프랜차이즈 제외 목록은 설정 파일(`franchise-blocklist.json`)로 관리합니다.
- **AEO 페이지**: 가게 · 드롭 공개 페이지는 서버 렌더링하고, JSON-LD(`LocalBusiness`, `Product`, `Offer`)와 FAQ를 넣습니다. URL은 사람이 읽을 수 있는 slug (`/stores/yeonnam-bakery`).
- **개인정보 최소 노출**: 사장님 화면에서 손님 전화번호는 가운데를 가립니다 (`010-****-1234`).

## 12. 도메인 용어 사전 (기획서 → 코드)

기획서의 말과 코드 이름을 하나로 맞춥니다. **같은 개념을 다른 이름으로 부르지 않습니다.** 새 개념이 생기면 여기에 추가합니다.

| 기획서 용어           | 코드 이름                     | 뜻                                                   |
| --------------------- | ----------------------------- | ---------------------------------------------------- |
| 동네 빵집 (입점 가게) | `Store` / `stores`            | 우리 플랫폼에 가입한 가게                            |
| 지도 속 가게          | `Place` / `places`            | 공공데이터에서 가져온 개인 빵집 · 떡집 (미입점 포함) |
| 사장님                | `SELLER`                      | 가게를 운영하는 판매자                               |
| 손님                  | `CUSTOMER`                    | 구매자                                               |
| 드롭                  | `Drop` / `drops`              | 정해진 시각에 한정 수량을 여는 판매 단위             |
| 대기열                | `Queue`                       | 오픈 시각에 접속 순서대로 세우는 줄                  |
| 순번                  | `rank`                        | 내 앞에 몇 명이 남았는지                             |
| 입장 (5분 구매 권한)  | `Admission`                   | 순번이 됐을 때 받는 구매 권한                        |
| 재고 선점             | `OrderStatus.RESERVED`        | 결제 전 수량을 잡아 둔 상태                          |
| 픽업 시간대           | `PickupSlot` / `pickup_slots` | 30분 단위 픽업 구간과 인원 한도                      |
| 픽업 QR               | `pickupCode`                  | 주문마다 발급하는 픽업 확인 코드                     |
| 1인 구매 한도         | `perUserLimit`                | 드롭당 1인 최대 수량                                 |
| 품절                  | `DropStatus.SOLD_OUT`         | 남은 수량 0                                          |
| 미수령                | `OrderStatus.NO_SHOW`         | 픽업 마감까지 안 온 주문                             |
| 다음 드롭 수량 추천   | `DropInsight`                 | 완판 시간 · 대기 인원으로 다음 수량 계산             |
| 래플                  | `Raffle`                      | 응모 · 추첨 판매 (3단계)                             |
| 추천 할인             | `Referral`                    | 가게 간 추천으로 수수료 인하                         |

## 13. 기능별 모듈 · 화면 · 담당

| 기능 (기획서)              | API 모듈           | 화면 경로                         | 담당 | 브랜치 예                 |
| -------------------------- | ------------------ | --------------------------------- | ---- | ------------------------- |
| 회원가입 · 로그인          | `auth`, `users`    | `/login`, `/signup`               | 운영 | `feat/auth-signup`        |
| 가게 생성                  | `stores`           | `/seller/store`                   | 운영 | `feat/store-create`       |
| 드롭 생성 · 관리           | `drops`            | `/seller/drops`                   | 운영 | `feat/drop-create`        |
| 드롭 목록 · 상세           | `drops`            | `/drops`, `/drops/[id]`           | 구매 | `feat/drop-detail`        |
| 대기열 · 순번              | `queue`            | `/drops/[id]/queue`               | 구매 | `feat/queue-entry`        |
| 재고 선점 · 주문           | `orders`           | `/drops/[id]/checkout`            | 구매 | `feat/order-reserve`      |
| 결제                       | `payments`         | `/checkout/success`               | 구매 | `feat/payment`            |
| 미결제 자동 복구           | `apps/worker`      | -                                 | 구매 | `feat/expire-reservation` |
| 픽업 QR 발급               | `pickup`           | `/me/orders`                      | 구매 | `feat/pickup-qr`          |
| 픽업 처리 · 주문 목록      | `pickup`, `orders` | `/seller/orders`                  | 운영 | `feat/seller-orders`      |
| 대시보드 · 수량 추천       | `insights`         | `/seller/dashboard`               | 운영 | `feat/seller-dashboard`   |
| 동네 빵집 지도 · 지역 필터 | `map`              | `/map`                            | 운영 | `feat/map-region-filter`  |
| AEO 드롭 · 가게 페이지     | web SSR            | `/stores/[slug]`, `/drops/[slug]` | 운영 | `feat/aeo-pages`          |
| 봇 방지                    | `common/guards`    | -                                 | 운영 | `feat/rate-limit`         |

- **담당 영역**: 구매 도메인(대기열 · 재고 · 결제 · 손님 화면) / 운영 도메인(인증 · 사장님 페이지 · 지도 · AEO · 인프라). **누가 어느 쪽을 맡을지는 `결정 필요`**. 상대 영역을 고칠 땐 미리 말합니다.
- 브랜치 예시의 기술 이름(`-sse`, `-toss` 등)은 기술이 확정되면 붙입니다.

## 14. 리뷰 문화 `초기 제안`

approval이 필수라서 **리뷰가 늦으면 상대방 작업이 멈춥니다.**

- **리뷰는 24시간 안에.** 바쁘면 "내일 볼게"라도 남깁니다.
- **PR은 작게**: 변경 400줄 이내를 목표로 합니다 (lockfile, 자동 생성 파일 제외). 브랜치는 2~3일 안에 merge할 수 있는 크기로.
- **코멘트 머리말**:

| 머리말   | 의미                                         |
| -------- | -------------------------------------------- |
| `[필수]` | merge 전에 꼭 고칠 것 (버그, 보안, 요구사항) |
| `[제안]` | 고치면 좋지만 작성자 판단                    |
| `[질문]` | 이해가 안 되는 부분                          |
| `[사소]` | 취향 차이. 무시해도 됨                       |

- 코드를 이야기하지, 사람을 비판하지 않습니다. 좋은 부분도 한 줄 남깁니다.
