// PostToolUse 훅: Claude가 수정한 파일에 프로젝트 Prettier 설정을 적용합니다.
// 실패해도 작업을 막지 않습니다 (항상 exit 0).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

try {
  const input = JSON.parse(readFileSync(0, 'utf8'));
  const file = input.tool_input?.file_path;
  const root = process.env.CLAUDE_PROJECT_DIR ?? input.cwd;
  if (!file || !root) process.exit(0);

  const abs = path.resolve(root, file);
  if (path.relative(root, abs).startsWith('..')) process.exit(0);

  const require = createRequire(path.join(root, 'package.json'));
  const mod = await import(pathToFileURL(require.resolve('prettier')).href);
  const prettier = mod.default ?? mod;

  const info = await prettier.getFileInfo(abs, {
    ignorePath: path.join(root, '.prettierignore'),
  });
  if (info.ignored || !info.inferredParser) process.exit(0);

  const source = readFileSync(abs, 'utf8');
  const options = (await prettier.resolveConfig(abs)) ?? {};
  const formatted = await prettier.format(source, { ...options, filepath: abs });
  if (formatted !== source) writeFileSync(abs, formatted);
} catch (error) {
  if (process.env.DEBUG_HOOK) console.error(error);
  // 포맷 실패는 무시 (설치 전, 문법 오류 등)
}
process.exit(0);
