import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/src',{recursive:true});
for(const file of ['index.html','style.css','src/app.js','src/game.js'])await copyFile(file,'dist/'+file);
await copyFile('.nojekyll','dist/.nojekyll');
console.log('Built static Lineage game in dist/');
