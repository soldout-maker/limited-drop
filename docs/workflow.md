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
feat(drops): 드롭 생성 API 추가
fix(queue): 순번이 음수로 표시되는 문제 수정
refactor(orders): 주문 상태 전이 구조 개선
style(web): 포맷 정리
test(drops): 드롭 생성 테스트 추가
docs(api): API 문서 업데이트
chore(ci): GitHub Actions 린트 단계 추가
```

| type       | 언제                                     |
| ---------- | ---------------------------------------- |
| `feat`     | 새 기능                                  |
| `fix`      | 버그 수정 (hotfix 브랜치의 커밋도 `fix`) |
| `refactor` | 동작 변화 없는 구조 개선                 |
| `style`    | 포맷, 세미콜론 등 (동작 무관)            |
| `test`     | 테스트 추가 · 수정                       |
| `docs`     | 문서                                     |
| `chore`    | 설정, 패키지, 빌드, CI                   |

- `scope`: API 모듈 이름(`drops`, `queue`, `orders`, `payments`, `pickup` …) 또는 영역(`web`, `api`, `worker`, `config`, `ci`). 생략할 수 있습니다.
- 커밋 하나에는 논리적인 변경 하나만 담습니다.
- 도구 검사(Husky + lint-staged)는 [D-013](./decisions.md) 결정 후 추가합니다.

## 4. Pull Request 규칙

| PR                        | base      | merge 방식                               |
| ------------------------- | --------- | ---------------------------------------- |
| `feat/*` 등 → develop     | `develop` | [D-016](./decisions.md) 결정 필요 (회의) |
| `hotfix/*` → main         | `main`    | 〃                                       |
| `develop` → main (릴리스) | `main`    | 〃 — squash하면 develop과 이력이 어긋남  |

- PR 본문은 [PR 템플릿](../.github/pull_request_template.md)을 채웁니다: 작업 내용 / 변경 이유 / 구현 내용 / 테스트·확인 / 관련 티켓.
- **본인이 작성한 PR을 혼자 merge하지 않습니다.** 상대 승인 1개 이상 + CI 통과 후 merge합니다.
- PR 제목은 커밋 규칙과 같은 형식입니다 (예: `feat(drops): 드롭 생성 화면`). Squash merge하면 PR 제목이 그대로 커밋 메시지가 됩니다.
- **base 브랜치를 꼭 확인합니다.** 기본 브랜치가 `develop`이라 보통은 자동으로 맞습니다.
- 크기, 리뷰 시간(24시간), 코멘트 머리말(`[필수]` `[제안]` `[질문]` `[사소]`)은 [conventions.md 14장](./conventions.md#14-리뷰-문화-초기-제안)을 따릅니다.

### 리뷰어 체크 포인트

- 티켓/작업의 요구사항과 맞는가
- [conventions.md](./conventions.md) 규칙 — 특히 11장(재고 차감 한 곳, 입장 없이 구매 금지, 멱등 결제, 서버 시간)
- 아직 결정되지 않은 기술([decisions.md](./decisions.md))을 임의로 도입하지 않았는가
- 불필요한 변경이 섞여 있지 않은가
- base 브랜치가 맞는가 (`hotfix/*`만 `main`)

## 4-1. 협업 루틴 `초기 제안`

- **주 2회 30분 싱크.**
- 매주 일요일 끝에 **"다음 주 할 일 3개"**를 각자 정합니다.
- 작업은 GitHub Issues + [Projects 보드](https://github.com/orgs/soldout-maker/projects/1)로 관리하고, 브랜치 · PR에 이슈 번호를 연결합니다.
- 담당 영역(구매 도메인 / 운영 도메인)과 상대 영역을 고칠 때의 규칙은 [conventions.md 13장](./conventions.md#13-기능별-모듈--화면--담당).
- 기획 · 회의록은 노션, 확정된 규칙과 결정은 이 저장소 `docs/`에 둡니다.

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
