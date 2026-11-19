# 개발 컨벤션 (초안)

코드를 **어떻게** 쓸지에 대한 팀 약속입니다. Git / PR / 이슈 흐름은 [workflow.md](./workflow.md), 기술 선택은 [decisions.md](./decisions.md)를 봅니다.

- 이 문서는 **초안**입니다. 항목마다 상태를 표시합니다.
  - `초기 제안`: 일단 이렇게 쓰고, 불편하면 PR로 바꿉니다.
  - `결정 필요`: 아직 쓰지 않습니다. 관련 코드를 쓰기 전에 함께 정합니다.
- 도구(ESLint / Prettier / TypeScript)가 자동으로 검사하는 규칙은 표시해 둡니다. 나머지는 리뷰에서 확인합니다.
- 규칙보다 **일관성**이 중요합니다. 규칙이 없는 부분은 주변 코드의 방식을 따릅니다.

---

## 1. 이름 짓기 `초기 제안`

| 대상                     | 규칙                                   | 예시                                  |
| ------------------------ | -------------------------------------- | ------------------------------------- |
| 파일, 폴더               | `kebab-case`                           | `drop-card.tsx`, `create-drop.dto.ts` |
| React 컴포넌트           | `PascalCase`                           | `DropCard`                            |
| 변수, 함수               | `camelCase`                            | `remainingStock`, `getDropById`       |
| 상수 (진짜 고정값)       | `UPPER_SNAKE_CASE`                     | `MAX_QUEUE_SIZE`                      |
| 타입, 인터페이스, 클래스 | `PascalCase`, `I` 접두사 없음          | `Drop`, `DropStatus` (❌ `IDrop`)     |
| boolean                  | `is` / `has` / `can` / `should`로 시작 | `isSoldOut`, `hasTicket`              |
| 함수                     | 동사로 시작                            | `createDrop`, `calculateRank`         |
| 이벤트 핸들러            | props는 `on~`, 구현은 `handle~`        | `onSubmit={handleSubmit}`             |

- **파일 이름은 반드시 `kebab-case`** — macOS와 Windows는 파일 이름의 대소문자를 구분하지 않지만 CI(Linux)는 구분합니다. `DropCard.tsx`를 `dropCard.tsx`로 바꾸면 로컬에서는 멀쩡하고 CI에서만 import가 깨집니다. 소문자만 쓰면 이 문제가 생기지 않습니다.
- 코드의 이름(변수, 함수, 타입)은 **영어**, 주석과 문서는 **한국어**로 씁니다.
- 도메인 용어는 [7. 용어집](#7-도메인-용어집-초기-제안)의 영어 이름을 그대로 씁니다.

## 2. TypeScript `초기 제안`

**도구가 검사:** strict 모드, `any` 금지, `import type` 강제, 사용하지 않는 변수 금지.

| 규칙                                                              | 이유                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------ |
| `any` 대신 `unknown` + 타입 가드                                  | 외부 입력(API 응답, `JSON.parse`)은 타입을 믿지 않는다       |
| `as` 타입 단언은 최소화                                           | 컴파일러를 속이는 것이라 버그를 숨긴다                       |
| non-null 단언 `!` 금지                                            | `null`이 실제로 오면 런타임 에러                             |
| 객체 타입은 `type`을 기본으로                                     | 하나로 통일. 클래스가 구현할 계약 등 필요한 곳만 `interface` |
| `enum` 대신 문자열 유니온 / `as const`                            | 번들 크기, 타입 추론, JSON 직렬화가 단순                     |
| export하는 함수는 반환 타입을 적는다 (React 컴포넌트는 생략 가능) | 공개 API가 의도치 않게 바뀌는 것을 막는다                    |

```ts
// ✅ 문자열 유니온
export type DropStatus = 'scheduled' | 'open' | 'sold_out' | 'closed';

// ✅ unknown + 타입 가드
function isDrop(value: unknown): value is Drop {
  return typeof value === 'object' && value !== null && 'id' in value;
}

// ❌
const drop = response as any;
const name = drop!.name;
```

- **`null` vs `undefined`** `초기 제안`: 함수 안에서 "값이 없음"은 `undefined`(선택적 속성 `?:`)로 표현합니다. API 응답처럼 JSON으로 오가는 값에서 "명시적으로 비어 있음"은 `null`을 씁니다. JSON에는 `undefined`가 없어서 키가 사라지기 때문입니다.

## 3. import `초기 제안`

순서 (그룹 사이 빈 줄 하나):

```ts
import { readFileSync } from 'node:fs'; // 1. Node 내장 모듈 (node: 접두사)

import { Injectable } from '@nestjs/common'; // 2. 외부 패키지

import type { Drop } from '@limited-drop/types'; // 3. 워크스페이스 패키지

import { DropRepository } from './drop.repository'; // 4. 상대 경로
```

- 다른 앱의 파일을 직접 import하지 않습니다 (`apps/web` → `apps/api` ❌). 공유할 것은 `packages/types`로 옮깁니다.
- 상대 경로가 `../../../`처럼 깊어지면 구조를 다시 생각할 신호입니다. 경로 별칭(`@/`)은 필요해지면 도입합니다 (`결정 필요`).
- `index.ts`로 다시 export만 하는 barrel 파일은 패키지의 진입점(`packages/*/src/index.ts`)에만 둡니다. 앱 내부에서 남발하면 순환 참조가 생기기 쉽습니다.
- import 순서 자동 정렬은 아직 도구로 강제하지 않습니다. 불편해지면 ESLint 규칙을 추가합니다.

## 4. 폴더 구조 `초기 제안`

기능(도메인) 단위로 묶습니다. 도메인 목록과 내부 설계는 각 기능 티켓에서 정합니다.

**api (NestJS)** — NestJS 표준 구조

```text
apps/api/src/
├─ main.ts
├─ app.module.ts
├─ common/              # 여러 도메인이 같이 쓰는 필터, 가드, 유틸
└─ modules/
   └─ <domain>/         # 예: drop
      ├─ <domain>.module.ts
      ├─ <domain>.controller.ts   # HTTP 요청/응답만 담당
      ├─ <domain>.service.ts      # 비즈니스 로직
      └─ dto/                     # 요청/응답 형태
```

- 컨트롤러는 얇게: 입력을 받아 서비스에 넘기고 결과를 돌려줍니다. 로직은 서비스에 둡니다.

**web (Next.js App Router)**

```text
apps/web/
├─ app/                 # 라우트 (page.tsx, layout.tsx)
├─ components/          # 여러 화면에서 쓰는 UI 컴포넌트
├─ features/<domain>/   # 특정 도메인 전용 컴포넌트, 훅
└─ lib/                 # API 클라이언트, 유틸
```

- 기본은 Server Component, 상호작용이 필요한 컴포넌트만 `'use client'`를 붙입니다.

## 5. API 규칙 (REST)

### 5-1. URL `초기 제안`

- 리소스는 **복수형 명사 + kebab-case**: `/drops`, `/drops/:dropId/queue-entries`
- 동작은 HTTP 메서드로 표현합니다 (`POST /drops` ✅, `POST /create-drop` ❌)
- 쿼리 파라미터는 `camelCase`: `?pageSize=20`
- JSON 필드는 `camelCase`

### 5-2. 응답 / 에러 형식 `결정 필요` (D-017)

web과 api가 같은 형식을 써야 하므로 **첫 API를 만들기 전에** 정합니다. 결정되면 형식의 타입을 `packages/types`에 둡니다.

### 5-3. 값 표현 `초기 제안`

| 값        | 규칙                                                        | 이유                                                              |
| --------- | ----------------------------------------------------------- | ----------------------------------------------------------------- |
| 날짜/시간 | ISO 8601 문자열, **UTC로 저장·전송**, 화면에서만 KST로 표시 | 드롭 오픈 시각이 서비스의 핵심. 시간대가 섞이면 9시간 오차가 난다 |
| 금액      | **정수(원 단위)**. 소수 `number`로 계산하지 않는다          | `0.1 + 0.2 !== 0.3`. 금액 오차는 결제 사고                        |
| ID        | 문자열로 다룬다                                             | 숫자 ID든 UUID든 클라이언트 코드가 바뀌지 않게                    |

- **시간의 기준은 서버입니다.** 드롭 오픈, 대기열 진입 가능 여부는 서버 시각으로 판단합니다. 사용자 PC 시계는 틀릴 수 있고 조작할 수 있습니다 (카운트다운 표시용으로만 씁니다).

## 6. 에러 처리와 로그 `초기 제안`

- 에러를 삼키지 않습니다. `catch` 했으면 처리하거나, 정보를 더해 다시 던집니다.
- 사용자에게 보여줄 메시지는 한국어, 에러 코드는 영어 `UPPER_SNAKE_CASE` (예: `DROP_NOT_OPEN`, `OUT_OF_STOCK`).
- 예상한 실패(재고 없음, 오픈 전)와 예상 못 한 실패(버그, DB 장애)를 구분합니다. 예상한 실패는 4xx, 예상 못 한 실패는 5xx.
- **로그에 개인정보와 secret을 남기지 않습니다**: 전화번호, 주소, 이메일, 토큰, 결제 정보. 필요하면 마스킹합니다 (`010-****-1234`).
- `console.log`는 디버깅 후 지웁니다. 로그 라이브러리와 형식은 `결정 필요` (D-021).

## 7. 도메인 용어집 `초기 제안`

같은 개념을 web, api, 문서, 대화에서 **같은 단어**로 부릅니다. 이름이 섞이면 (드롭 / 상품 / 이벤트) 코드도 섞입니다. 새 개념이 생기면 여기에 추가합니다.

| 한국어      | 코드 이름    | 뜻 (초안 — 기획에 맞게 수정)               |
| ----------- | ------------ | ------------------------------------------ |
| 드롭        | `Drop`       | 정해진 시각에 오픈하는 한정 수량 판매 단위 |
| 판매자      | `Seller`     | 드롭을 등록하는 사용자                     |
| 매장        | `Store`      | 판매자의 매장 (픽업 장소)                  |
| 구매자      | `Buyer`      | 드롭에 참여해 구매하는 사용자              |
| 대기열      | `Queue`      | 오픈 시 구매 순서를 정하는 줄              |
| 대기열 참가 | `QueueEntry` | 구매자 한 명의 대기열 자리                 |
| 주문        | `Order`      | 구매자가 구매를 확정한 기록                |
| 결제        | `Payment`    | 주문에 대한 결제                           |
| 픽업        | `Pickup`     | 구매자가 매장에서 상품을 받는 것           |

## 8. 주석과 TODO `초기 제안`

- 주석은 **"왜"**를 씁니다. "무엇"은 코드와 이름으로 드러나게 합니다.
- TODO에는 이슈 번호를 붙입니다. 번호 없는 TODO는 잊힙니다.

```ts
// TODO(#12): 결제 미완료 주문의 재고 반환은 worker로 이동
```

## 9. 환경변수 `초기 제안`

- 이름은 `UPPER_SNAKE_CASE`, 새 변수는 `.env.example`에 **키만** 추가합니다.
- **`NEXT_PUBLIC_`으로 시작하는 변수는 브라우저에 그대로 노출됩니다.** secret에 절대 붙이지 않습니다.
- 앱 시작 시 필요한 환경변수가 없으면 바로 실패하게 합니다 (검증 방법은 D-018 검증 라이브러리와 함께 결정).

## 10. 의존성 추가 `초기 제안`

- 실제로 쓰는 패키지에만 설치합니다: `pnpm --filter @limited-drop/api add <pkg>`. 루트에는 전체 도구(turbo, prettier 등)만 둡니다.
- `결정 필요` 기술(ORM, Redis 클라이언트, 상태관리, 테스트 도구 등)의 라이브러리는 결정 전에 설치하지 않습니다.
- build script가 필요한 패키지는 `pnpm-workspace.yaml`의 `allowBuilds`에 추가합니다.
- TypeScript(6.0)와 ESLint(9)는 메이저 버전을 올리지 않습니다 (D-002).
- **`pnpm-lock.yaml` 충돌**: 직접 고치지 않습니다. 대상 브랜치를 merge한 뒤 `pnpm install`을 다시 실행해 lockfile을 재생성하고 커밋합니다.

## 11. 리뷰 문화 `초기 제안`

approval이 필수라서 **리뷰가 늦으면 상대방 작업이 멈춥니다.**

- **리뷰 응답 시간**: PR을 받으면 **하루(24시간) 안에** 리뷰하거나, 언제 볼 수 있는지 알려줍니다.
- **PR 크기**: 변경이 **400줄을 넘으면 나눌 수 있는지** 먼저 생각합니다 (lockfile, 자동 생성 파일 제외).
- **코멘트 머리말**로 중요도를 표시합니다:

| 머리말       | 의미                                     |
| ------------ | ---------------------------------------- |
| `[must]`     | 고쳐야 merge 가능 (버그, 보안, 요구사항) |
| `[suggest]`  | 제안. 작성자가 판단                      |
| `[question]` | 이해를 위한 질문                         |
| `[nit]`      | 사소한 취향. 무시해도 됨                 |

- 코드를 비판하지, 사람을 비판하지 않습니다. 좋은 부분도 한 줄 남깁니다.

## 12. 아직 정하지 않은 것

컨벤션을 쓰다 보니 정해야 할 것이 더 나왔습니다. [decisions.md](./decisions.md)에 추가했습니다.

- 기술 결정: D-017 ~ D-022 (응답 형식, 검증 라이브러리, API 계약 공유, 로컬 DB/Redis 실행, 로그, 의존성 업데이트)
- 운영 규칙: D-023 (상대방이 없을 때 긴급 hotfix 처리)
- 서비스 정책 질문: P-001 ~ P-006 (과판매 방지, 중복 결제, 공정성, 개인정보 등 — 기획 확인 필요)
