import { mkdir, copyFile, cp, rm, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
for (const file of (await readdir('src')).filter((file) =>
  file.endsWith('.js'),
)) {
  const check = spawnSync(process.execPath, ['--check', 'src/' + file], {
    encoding: 'utf8',
  });
  if (check.status !== 0)
    throw Error(
      'Invalid browser module ' +
        file +
        ': ' +
        (check.stderr || check.error?.message || 'syntax check failed'),
    );
}
await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
for (const file of ['index.html', 'style.css'])
  await copyFile(file, 'dist/' + file);
await cp('src', 'dist/src', { recursive: true });
await cp('assets', 'dist/assets', { recursive: true });
await copyFile('.nojekyll', 'dist/.nojekyll');
console.log('Built static Lineage game in dist/');
