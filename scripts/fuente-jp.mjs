// La fuente japonesa de títulos completa pesa casi 1 MB, pero el sitio solo usa un puñado
// de caracteres: los títulos originales de las series y los sellos (弧, 秘, 済). Este script
// genera src/assets/fonts/dela-gothic-one-jp.woff2 solo con esos caracteres.
// Uso: npm run fuente-jp  (después de cambiar TITLE_JA en src/lib/themes.ts)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const themes = readFileSync(root('src/lib/themes.ts'), 'utf8');
const titles = themes.slice(themes.indexOf('TITLE_JA'), themes.indexOf('};', themes.indexOf('TITLE_JA')));
const chars = new Set([...titles.replace(/[\x00-\x7f]/g, ''), ...'弧秘済']);

const source = readFileSync(root('node_modules/@fontsource/dela-gothic-one/files/dela-gothic-one-japanese-400-normal.woff2'));
const subset = await subsetFont(source, [...chars].join(''), { targetFormat: 'woff2' });
mkdirSync(root('src/assets/fonts'), { recursive: true });
writeFileSync(root('src/assets/fonts/dela-gothic-one-jp.woff2'), subset);
console.log(`${chars.size} caracteres: ${[...chars].join('')} (${(subset.length / 1024).toFixed(1)} KB)`);
