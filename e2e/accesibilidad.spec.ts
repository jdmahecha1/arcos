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
  ['aviso legal', 'legal/'],
];

for (const [name, path] of pages) {
  test(`sin fallos WCAG 2.1 AA: ${name}`, async ({ page }) => {
    // axe mide los colores en reposo: sin animaciones, nada queda a medio aparecer.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(path);
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
    expect(summary).toEqual([]);
  });
}

// Las mismas reglas en modo claro, que solo se activa si la persona lo elige.
for (const [name, path] of pages.slice(0, 4)) {
  test(`sin fallos WCAG 2.1 AA en modo claro: ${name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('arcos:tema', 'claro'));
    await page.goto(path);
    await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = results.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.help}`);
    expect(summary).toEqual([]);
  });
}
