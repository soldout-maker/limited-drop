# 협업 규칙

2인 개발을 위한 작업 흐름과 Git 규칙입니다. 규칙을 바꿀 때는 이 문서를 수정하는 PR을 올립니다.

## 1. 개발 흐름: 티켓 → 작업 → QA → 완료

| 단계     | 질문                                | GitHub에서                         |
| -------- | ----------------------------------- | ---------------------------------- |
| **티켓** | 무엇을, 왜 만들어야 하는가?         | `티켓` 이슈 템플릿 (label: ticket) |
| **작업** | 그것을 구현하려면 무엇을 해야 하나? | `작업` 이슈 템플릿 (label: task)   |
| **QA**   | 요구사항대로 제대로 동작하는가?     | `QA` 이슈 템플릿 (label: qa)       |

### 진행 순서

1. **티켓 작성** — 목적과 요구사항을 적습니다. 구현 방법은 적지 않습니다.
2. **작업 분리** — 티켓을 PR 하나 크기의 작업 이슈로 나누고, 티켓의 `작업 목록`에 링크합니다.
3. **개발** — 작업 이슈 하나당 `develop`에서 분기한 브랜치 하나 → `develop`으로 PR 하나. PR 본문에 `Closes #작업번호`를 적습니다.
4. **QA** — 티켓의 작업이 모두 `develop`에 merge되면 QA 이슈를 만들고 **`develop` 기준으로** 요구사항을 확인합니다.
   - 가능하면 **구현하지 않은 사람이 QA**를 합니다.
   - 문제가 있으면 `fix/*` 작업 이슈를 만들고 3번으로 돌아갑니다.
5. **완료** — QA를 통과하면 티켓을 닫습니다. QA를 통과한 변경은 이후 `develop → main` 릴리스 PR로 배포됩니다.

### 예시

```text
[티켓] 판매자가 상품 드롭을 등록할 수 있어야 한다.
  목적: 판매자가 한정 수량 상품의 판매 정보를 등록할 수 있어야 한다.
  요구사항: 상품명 / 가격 / 판매 수량 / 오픈 시간 / 픽업 정보

[작업]
  - Drop 도메인 생성
  - Drop 생성 API 구현
  - Drop 생성 화면 구현
  - 입력 validation 구현
  - API 연동

[QA]
  - 필수값 validation 확인
  - 가격/수량 정상 입력 확인
  - 과거 오픈 시간 차단 확인
  - 정상 등록 확인
  - 등록된 Drop 조회 확인
```

### GitHub Projects 보드

보드: **[Limited Drop](https://github.com/orgs/soldout-maker/projects/1)** (`soldout-maker` 조직, 비공개)

```text
Backlog → In Progress → Review → QA → Done
```

| 상태        | 들어가는 시점                                     |
| ----------- | ------------------------------------------------- |
| Backlog     | 이슈 생성 시                                      |
| In Progress | 담당자가 브랜치를 만들고 작업을 시작함            |
| Review      | `develop`으로 PR을 열었음                         |
| QA          | `develop`에 merge됨, 검증을 기다림 (티켓/QA 이슈) |
| Done        | QA 통과                                           |

> 작업 이슈는 PR merge 시 자동으로 닫혀도 됩니다. **티켓은 QA를 통과해야 Done**입니다.

#### 보드 자동화 (권장 설정)

보드 오른쪽 위 **⋯ → Workflows**에서 설정합니다 (API로는 설정할 수 없음).

| 워크플로              | 설정                                   | 이유                               |
| --------------------- | -------------------------------------- | ---------------------------------- |
| Auto-add to project   | 켜기, 필터 `is:issue,pr`               | 이슈 / PR이 자동으로 보드에 추가됨 |
| Item added to project | Status → Backlog                       | 새 카드는 Backlog에서 시작         |
| Pull request merged   | Status → **QA** (기본값 Done에서 변경) | 기본값을 쓰면 QA 단계를 건너뜀     |
| Item closed           | Status → Done                          | 티켓을 닫으면 완료                 |

In Progress / Review로 옮기는 것은 직접 합니다 (작업 시작 시, PR을 열 때).

## 2. Branch 전략 (Git Flow 유사)

### 브랜치 역할

| 브랜치      | 역할                                    | 분기 기준 | 반영 대상                   |
| ----------- | --------------------------------------- | --------- | --------------------------- |
| `main`      | 실제 배포 브랜치. 항상 배포 가능한 상태 | —         | —                           |
| `develop`   | 개발 통합 브랜치. QA / 통합 테스트 기준 | `main`    | `main` (릴리스 PR)          |
| `feat/*` 등 | 기능 / 일반 작업                        | `develop` | `develop`                   |
| `hotfix/*`  | `main`(운영)에서 발생한 긴급 버그 수정  | `main`    | `main` → 이후 `develop`에도 |

- **`main`과 `develop`에는 직접 commit / push하지 않습니다.** 모든 변경은 PR로 반영합니다.
- 일반 기능 개발은 `main`에 직접 반영하지 않습니다. `develop`에서 검증된 변경만 `main`으로 갑니다.

### 기본 개발 흐름

```text
develop → feat/* → PR → develop → 통합 테스트 / QA → main → 배포
```

```bash
git switch develop
git pull
git switch -c feat/drop-create
# ... 작업, 커밋 ...
git push -u origin feat/drop-create   # → develop으로 PR
```

### 릴리스 (develop → main)

- QA를 통과한 시점에 `develop → main` PR을 엽니다 (제목 예: `release: 드롭 등록 기능 배포`).
- 상대방 approval 후 merge합니다. 배포 방식은 아직 결정되지 않았습니다 ([D-012](./decisions.md)).

### 긴급 패치 흐름

```text
main → hotfix/* → PR → main → 긴급 배포
                      ↓
               develop에도 반영
```

```bash
git switch main
git pull
git switch -c hotfix/payment-error
# ... 수정, 커밋 ...
git push -u origin hotfix/payment-error   # → main으로 PR
```

- `main`에 merge한 뒤 **같은 수정을 반드시 `develop`에도 반영**합니다.
- 반영 방법(merge 또는 cherry-pick)은 팀이 하나를 정해 일관되게 사용합니다 → [D-015](./decisions.md) `결정 필요`.

### 브랜치 이름

```text
<type>/<short-description>
```

| type       | 용도                                       | 분기      |
| ---------- | ------------------------------------------ | --------- |
| `feat`     | 새 기능                                    | `develop` |
| `fix`      | 개발 중 발견한 일반 버그 수정              | `develop` |
| `refactor` | 동작 변화 없는 구조 개선                   | `develop` |
| `chore`    | 설정, 의존성, 빌드 등 기타 작업            | `develop` |
| `docs`     | 문서                                       | `develop` |
| `test`     | 테스트 추가/수정                           | `develop` |
| `hotfix`   | `main`의 운영/배포 버전에 발생한 긴급 버그 | `main`    |

```text
feat/drop-create      feat/queue-entry      fix/queue-rank
refactor/auth-service chore/project-init    docs/api-convention
test/drop-create      hotfix/payment-error
```

- `fix/*`와 `hotfix/*`를 구분합니다. 개발 중 버그는 `fix/*`, 운영 중 긴급 버그만 `hotfix/*`.
- 브랜치 하나에는 작업 목적 하나만 담습니다.

## 3. Commit 규칙 (Conventional Commits)

```text
type(scope): 설명
```

```text
feat(drop): 드롭 생성 API 구현
fix(queue): 대기열 순번 계산 오류 수정
refactor(auth): 인증 서비스 구조 개선
test(drop): 드롭 생성 테스트 추가
docs(api): API 문서 업데이트
chore(config): eslint 설정 변경
```

- `type`: `feat`, `fix`, `refactor`, `chore`, `docs`, `test` (hotfix 브랜치의 커밋은 `fix` 사용)
- `scope`: 도메인(`drop`, `queue`, `order` 등) 또는 영역(`web`, `api`, `worker`, `config`, `ci`). 생략할 수 있습니다.
- 커밋 하나에는 논리적인 변경 하나만 담습니다.
- 현재는 도구로 검사하지 않습니다 → [D-013](./decisions.md).

## 4. Pull Request 규칙

| PR                        | base      | merge 방식 (초기 제안, [D-016](./decisions.md))   |
| ------------------------- | --------- | ------------------------------------------------- |
| `feat/*` 등 → develop     | `develop` | Squash merge                                      |
| `hotfix/*` → main         | `main`    | Squash merge                                      |
| `develop` → main (릴리스) | `main`    | Merge commit (squash하면 develop과 이력이 어긋남) |

- PR 본문은 [PR 템플릿](../.github/pull_request_template.md)을 채웁니다: 작업 내용 / 변경 이유 / 구현 내용 / 테스트·확인 / 관련 티켓.
- **본인이 작성한 PR을 혼자 merge하지 않습니다.** 상대방의 review 후 merge합니다.
- PR은 작게 유지합니다. 리뷰하기 어려울 만큼 커지면 작업을 나눕니다.
- PR 제목도 커밋 규칙과 같은 형식으로 작성합니다 (예: `feat(drop): 드롭 생성 API 구현`). Squash merge하면 PR 제목이 그대로 커밋 메시지가 됩니다.
- **base 브랜치를 꼭 확인합니다.** GitHub 기본 브랜치를 `develop`으로 설정하면 실수가 줄어듭니다 (아래 5장).

### 리뷰어 체크 포인트

- 티켓/작업의 요구사항과 맞는가
- `any` 없이 타입이 명확한가 (`unknown` + 타입 가드 사용)
- 아직 결정되지 않은 기술([decisions.md](./decisions.md))을 임의로 도입하지 않았는가
- 불필요한 변경이 섞여 있지 않은가
- base 브랜치가 맞는가 (`hotfix/*`만 `main`)

## 5. GitHub 저장소 설정 (최초 1회, 관리자)

코드로 설정할 수 없는 항목이라 GitHub 웹에서 직접 설정합니다. 세부 보호 규칙은 실제 운영해 보면서 필요한 만큼만 추가합니다.

1. **Settings → General → Default branch**: `develop` (PR의 기본 base가 develop이 됨)
2. **Settings → Rules → Rulesets** — 대상: `main`, `develop`
   - Require a pull request before merging (Required approvals: 1 — 2인 팀이므로 상대방 approval)
   - Require status checks to pass: `check` (CI 워크플로의 job)
   - Block force pushes, Restrict deletions
3. **Settings → General → Pull Requests**
   - Squash merge, Merge commit 허용 (위 4장 표 참고), Rebase merge는 꺼도 됨
   - Automatically delete head branches 켜기 (`develop`은 보호 규칙으로 삭제 방지)
4. **Issues → Labels**: `ticket`, `task`, `qa` 라벨 생성 (이슈 템플릿에서 사용)
5. **Projects**: ✅ [Limited Drop 보드](https://github.com/orgs/soldout-maker/projects/1) 생성 완료 (Status 5단계, 저장소 연결). 자동화는 1장의 "보드 자동화" 참고
