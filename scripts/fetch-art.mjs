// Baja las portadas y los fondos de AniList (API pública) y los retratos de los pines de
// Pinterest elegidos a mano, y guarda en src/content/art.json la página de origen de cada
// imagen para los créditos. src/content/art-sources.json dice qué corresponde a cada cosa.
// Uso: npm run art   (luego: npm run images)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const sources = JSON.parse(readFileSync(root('src/content/art-sources.json'), 'utf8'));
const UA = { 'User-Agent': 'ArcosFanSite/1.0 (https://github.com/jdmahecha1/arcos)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** AniList limita las peticiones por minuto: si avisa, se espera lo que pida. */
async function anilist(query, variables) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { ...UA, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    if (res.status === 429) {
      await sleep((Number(res.headers.get('retry-after')) || 60) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`AniList respondió ${res.status}`);
    await sleep(2200);
    return (await res.json()).data;
  }
  throw new Error('AniList sigue limitando las peticiones');
}

async function download(url, dir, name) {
  mkdirSync(root(`arte-original/${dir}`), { recursive: true });
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  const path = root(`arte-original/${dir}/${name}${extname(new URL(url).pathname) || '.jpg'}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(path, buffer);
  return sharp(buffer).metadata();
}

const MEDIA = `query($id:Int){Media(id:$id){title{romaji} siteUrl bannerImage coverImage{extraLarge}}}`;

// Lo que ya está en art.json no se vuelve a pedir: AniList limita las peticiones por minuto.
const art = existsSync(root('src/content/art.json'))
  ? JSON.parse(readFileSync(root('src/content/art.json'), 'utf8'))
  : { covers: {}, backdrops: {}, portraits: {} };

for (const [seasonId, id] of Object.entries(sources.covers)) {
  if (art.covers[seasonId]) continue;
  const { Media: m } = await anilist(MEDIA, { id });
  const meta = await download(m.coverImage.extraLarge, 'portadas', seasonId);
  art.covers[seasonId] = { title: m.title.romaji, page: m.siteUrl, width: meta.width, height: meta.height };
}

for (const [sagaId, id] of Object.entries(sources.backdrops)) {
  if (art.backdrops[sagaId]) continue;
  const { Media: m } = await anilist(MEDIA, { id });
  await download(m.bannerImage, 'fondos', sagaId);
  art.backdrops[sagaId] = { title: m.title.romaji, page: m.siteUrl };
}

for (const [key, { pin, file }] of Object.entries(sources.portraits)) {
  if (art.portraits[key]) continue;
  await download(`https://i.pinimg.com/736x/${file}`, 'personajes', key);
  art.portraits[key] = { page: `https://www.pinterest.com/pin/${pin}/` };
  await sleep(400);
}

writeFileSync(root('src/content/art.json'), JSON.stringify(art, null, 2) + '\n');
console.log(`${Object.keys(art.covers).length} portadas, ${Object.keys(art.backdrops).length} fondos y ${Object.keys(art.portraits).length} retratos`);
