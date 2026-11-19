---
name: pr
description: 현재 브랜치의 변경을 검사하고 팀 PR 템플릿에 맞춰 Pull Request를 만든다 (feat 등 → develop, hotfix → main, 릴리스 develop → main). "PR 올려줘", "PR 만들어줘", "릴리스 PR", 작업을 마무리할 때 사용.
argument-hint: '[관련 이슈 번호] [release]'
---

# /pr

규칙: [docs/workflow.md](../../../docs/workflow.md) — Git Flow 유사 전략, `main`/`develop` 직접 push 금지, 상대방 review 후 merge, 작은 PR.

## 0. PR 종류와 base 결정

| 현재 브랜치                                               | base      | 비고                                   |
| --------------------------------------------------------- | --------- | -------------------------------------- |
| `feat/*` `fix/*` `refactor/*` `chore/*` `docs/*` `test/*` | `develop` | 일반 작업                              |
| `hotfix/*`                                                | `main`    | merge 후 develop 반영 필요 (6단계)     |
| `develop` + 사용자가 "릴리스" 요청                        | `main`    | 릴리스 PR (5단계)                      |
| `main`                                                    | —         | 중단. 작업 브랜치를 먼저 만들자고 안내 |

- 아래 비교에서 `<base>`는 위에서 정한 base 브랜치다. 먼저 `git fetch origin`을 하고 `origin/<base>`와 비교한다.
- 브랜치 이름이 규칙과 다르면 알려주기만 한다 (이름 변경은 사용자 확인 후).
- 일반 작업 브랜치인데 `origin/develop`이 아니라 `main`에서 분기된 것 같으면(`git merge-base`로 확인) 경고한다.

## 1. 사전 확인

- `git status`로 커밋되지 않은 변경이 있으면 사용자에게 알리고 어떻게 할지 묻는다.
- `git log origin/<base>..HEAD --oneline`으로 커밋 목록을 확인한다. Conventional Commits(`type(scope): 설명`) 형식이 아닌 커밋이 있으면 알려준다.

## 2. 검사 실행

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm build
```

- Windows에서 `spawn UNKNOWN`(turbo 차단)이 나면 `pnpm -r run lint` 등으로 대신 실행한다.
- 실패하면 PR을 만들지 않고 결과를 보고한다.

## 3. 범위 점검

- `git diff origin/<base>...HEAD --stat`으로 변경 범위를 본다. 목적이 둘 이상 섞여 있거나 지나치게 크면 나누자고 제안한다.
- [docs/decisions.md](../../../docs/decisions.md)의 `결정 필요` 기술(ORM, Redis, Queue, 테스트 도구 등)을 새로 추가하는 의존성이 있으면 경고한다.

## 4. PR 작성 (일반 / hotfix)

- 제목: Conventional Commits 형식 (Squash merge 시 그대로 커밋 메시지가 된다). hotfix는 `fix(scope): ...`.
- 본문: `.github/pull_request_template.md`의 섹션을 그대로 채운다 (상단 HTML 주석은 지운다).
  - 작업 내용 / 변경 이유 / 구현 내용 / 테스트·확인 / 관련 티켓
  - 테스트·확인에는 2단계에서 실제로 실행한 명령과 결과를 적는다. 실행하지 않은 것은 체크하지 않는다.
  - 관련 티켓: 작업 이슈는 `Closes #N`, 상위 티켓은 `Refs #N` (티켓은 QA 통과 후 닫으므로 Closes 하지 않는다).
  - 주의: base가 기본 브랜치가 아니면 `Closes #N`이 merge 시 자동으로 동작하지 않을 수 있다. 이 경우 merge 후 이슈를 직접 닫으라고 안내한다.
- **본문 초안과 base 브랜치를 보여주고 확인받은 뒤** 실행한다:

  ```bash
  git push -u origin <branch>
  gh pr create --base <base> --title "..." --body-file <임시파일>
  ```

- 리뷰어는 상대 팀원으로 지정할지 묻는다 (`--reviewer <login>`).
- 생성된 PR URL을 알려준다. **merge는 하지 않는다.**

## 5. 릴리스 PR (develop → main)

- `git log origin/main..origin/develop --oneline`으로 포함될 변경을 모은다.
- 제목 예: `release: 드롭 등록 기능 배포`
- 본문: 포함된 PR 목록, 관련 티켓의 QA 완료 여부(QA 이슈 링크), 배포 시 주의사항.
- QA가 끝나지 않은 티켓이 포함돼 있으면 경고한다.
- Merge 방식은 [D-016](../../../docs/decisions.md)을 따른다. 아직 `결정 필요`이면 squash하면 develop과 이력이 어긋난다는 점만 알려주고 사용자에게 고르게 한다.

## 6. hotfix 후속 안내

hotfix PR을 만든 뒤, merge되면 **같은 수정을 `develop`에도 반영해야 한다**고 안내한다.
반영 방법(merge / cherry-pick)은 [D-015](../../../docs/decisions.md)에서 아직 `결정 필요` 상태이므로 임의로 고르지 말고 사용자에게 묻는다.
