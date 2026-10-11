import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
for (const file of ['index.html', 'style.css', 'src/app.js', 'src/game.js', 'src/data.js'])
  await copyFile(file, 'dist/' + file);
await cp('assets', 'dist/assets', { recursive: true });
await copyFile('.nojekyll', 'dist/.nojekyll');
console.log('Built static Lineage game in dist/');
