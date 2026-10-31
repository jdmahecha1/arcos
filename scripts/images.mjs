// Optimiza el arte oficial que está en arte-original/ (no se sube al repositorio):
//  - arte-original/portadas/<entrega>.*  -> public/img/portadas/<entrega>.webp (ancho máximo 400)
//  - arte-original/personajes/<serie>--<id>.* -> public/img/personajes/<serie>--<id>-<lado>.webp (128, 256; cuadradas)
//  - arte-original/fondos/<serie>.*  -> public/img/fondos/<serie>-<ancho>.webp (960, 1920)
// Nunca agranda una imagen y elimina los metadatos. Uso: npm run images
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const path = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const IMAGE = /\.(jpe?g|png|webp)$/i;
const list = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => IMAGE.test(f)) : []);
const id = (file) => file.replace(/\.[^.]+$/, '');

async function save(input, output, width) {
  const info = await sharp(input)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(output);
  console.log(`${output.split(/[\\/]/).slice(-2).join('/')}  ${info.width}x${info.height}  ${Math.round(info.size / 1024)} KB`);
}

const covers = path('arte-original/portadas/');
mkdirSync(path('public/img/portadas/'), { recursive: true });
for (const file of list(covers)) {
  await save(covers + file, path(`public/img/portadas/${id(file)}.webp`), 400);
}

// Si un retrato no es cuadrado, el recorte se ancla arriba, donde está la cara.
const portraits = path('arte-original/personajes/');
mkdirSync(path('public/img/personajes/'), { recursive: true });
for (const file of list(portraits)) {
  for (const side of [128, 256]) {
    await sharp(portraits + file)
      .resize({ width: side, height: side, fit: 'cover', position: 'top' })
      .webp({ quality: 80, effort: 6 })
      .toFile(path(`public/img/personajes/${id(file)}-${side}.webp`));
  }
}
console.log(`personajes: ${list(portraits).length}`);

const backdrops = path('arte-original/fondos/');
mkdirSync(path('public/img/fondos/'), { recursive: true });
for (const file of list(backdrops)) {
  for (const width of [960, 1920]) {
    await save(backdrops + file, path(`public/img/fondos/${id(file)}-${width}.webp`), width);
  }
}
