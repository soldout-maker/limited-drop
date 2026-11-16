// PreToolUse 훅: 팀 규칙을 어기는 명령/파일 접근을 실행 전에 차단합니다.
// - main / develop 브랜치 직접 push / commit (PR로만 반영)
// - force push (--force-with-lease는 허용), --no-verify
// - .env 파일 읽기/수정 (.env.example 제외)
// exit 2 + stderr → Claude Code가 해당 도구 호출을 막고 이유를 Claude에게 전달합니다.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8'));
const tool = input.tool_name;
const params = input.tool_input ?? {};

const block = (reason) => {
  process.stderr.write(`[guard] ${reason}\n`);
  process.exit(2);
};

const ENV_FILE = /(^|[\\/])\.env(\.(?!example\b)[\w.-]+)?$/;
const PROTECTED = ['main', 'develop'];
const PROTECTED_REF = /(^|:)(refs\/heads\/)?(main|develop)$/;

const git = (args) => {
  try {
    return execSync(`git ${args}`, { cwd: input.cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
};

const currentBranch = () => git('symbolic-ref --short HEAD');
// 커밋이 하나도 없는 저장소에서는 main에 최초 커밋을 허용합니다 (부트스트랩)
const hasCommits = () => git('rev-parse --verify --quiet HEAD') !== '';

if (tool === 'Bash' || tool === 'PowerShell') {
  const cmd = String(params.command ?? '');

  if (/\bgit\b[^;&|]*\s--no-verify\b/.test(cmd)) {
    block('--no-verify는 사용하지 않습니다. 훅이 실패하면 원인을 고치세요.');
  }

  for (const push of cmd.match(/\bgit\s+push\b[^;&|]*/g) ?? []) {
    if (/\s(--force|-f)(\s|$)/.test(push)) {
      block('force push는 금지입니다. 필요하면 --force-with-lease를 사용하세요.');
    }
    const args = push
      .split(/\s+/)
      .slice(2)
      .filter((a) => !a.startsWith('-'));
    const target = args.find((a) => PROTECTED_REF.test(a));
    const implicit = args.length <= 1 && PROTECTED.includes(currentBranch());
    if (target || implicit) {
      block(
        'main / develop에는 직접 push하지 않습니다. 작업 브랜치를 push하고 PR을 여세요 ' +
          '(feat/* 등 → develop, hotfix/* → main). docs/workflow.md 참고.',
      );
    }
  }

  const switchesBranch = /\bgit\s+(checkout\s+-b|switch\s+-c)\b/.test(cmd);
  const branch = currentBranch();
  if (
    /\bgit\s+commit\b/.test(cmd) &&
    !switchesBranch &&
    PROTECTED.includes(branch) &&
    hasCommits()
  ) {
    block(
      `${branch} 브랜치에서 직접 커밋하지 않습니다. ` +
        '기능은 develop에서 `git switch -c feat/<desc>`, 긴급 수정은 main에서 `git switch -c hotfix/<desc>`로 분기하세요.',
    );
  }

  if (/\b(cat|head|tail|less|more|type|Get-Content|gc)\s+[^;&|]*\.env(?!\.example)\b/.test(cmd)) {
    block(
      '.env 파일에는 secret이 있을 수 있어 읽지 않습니다. 키 목록은 .env.example을 참고하세요.',
    );
  }
}

if (['Read', 'Edit', 'Write', 'MultiEdit'].includes(tool)) {
  const file = String(params.file_path ?? '');
  if (ENV_FILE.test(file)) {
    block('.env 파일은 읽거나 수정하지 않습니다. 키 목록은 .env.example을 수정하세요.');
  }
}

process.exit(0);
