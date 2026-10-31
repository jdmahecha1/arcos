import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Auditoría WCAG 2.1 AA automática (axe-core) de las páginas principales.
const pages = [
  ['portada', ''],
  ['serie sin progreso', 'series/kimetsu-no-yaiba/'],
  ['serie de otro tema', 'series/kaiju-n8/'],
  ['personaje', 'series/jujutsu-kaisen/personajes/yuji-itadori/'],
  ['búsqueda', 'buscar/'],
  ['cómo funciona', 'acerca/'],
  ['créditos', 'creditos/'],
];

for (const [name, path] of pages) {
  test(`sin fallos WCAG 2.1 AA: ${name}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
    expect(summary).toEqual([]);
  });
}
