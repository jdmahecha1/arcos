import { expect, test, type Page } from '@playwright/test';

/** Espera a que todas las islas de React estén hidratadas antes de interactuar. */
async function hydrated(page: Page) {
  await page.waitForFunction(() => document.querySelectorAll('astro-island[ssr]').length === 0);
}

/** El camino de puntos de una entrega en el panel de progreso. */
const savePath = (page: Page, season: string) => page.getByRole('radiogroup', { name: season, exact: true });

const T1 = 'Temporada 1: Tanjiro Kamado';

test.describe('escudo de spoilers', () => {
  test('sin progreso, la historia de Kimetsu queda sin revelar', async ({ page }) => {
    await page.goto('series/kimetsu-no-yaiba/');
    await hydrated(page);
    await expect(page.getByRole('heading', { level: 1, name: 'Kimetsu no Yaiba' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '¿Hasta dónde viste?' })).toBeVisible();
    // Los eventos ocultos se agrupan en un solo bloque, no en una tarjeta cada uno.
    await expect(page.locator('.timeline__fog')).toHaveCount(1);
    await expect(page.locator('.timeline__fog')).toContainText('27 eventos sin revelar');
    // El texto de un evento oculto no está en el DOM, ni siquiera escondido con CSS.
    await expect(page.locator('body')).not.toContainText('Redención y caída de Akaza');
  });

  test('al marcar el progreso se revela lo visto y nada más', async ({ page }) => {
    await page.goto('series/kimetsu-no-yaiba/');
    await hydrated(page);
    await savePath(page, T1).getByRole('radio').nth(1).check();
    await expect(page.getByRole('heading', { name: 'Supervivencia en la Selección Final' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tu progreso' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText('Incursión en el monte Natagumo');

    // El progreso persiste al recargar.
    await page.reload();
    await hydrated(page);
    await expect(savePath(page, T1).getByRole('radio').nth(1)).toBeChecked();
    await expect(page.getByRole('heading', { name: 'Supervivencia en la Selección Final' })).toBeVisible();
  });

  test('marcar una entrega da por visto lo anterior y borra lo posterior', async ({ page }) => {
    await page.goto('series/kimetsu-no-yaiba/');
    await hydrated(page);
    await savePath(page, 'Villa de los Herreros').getByRole('radio').nth(1).check();
    await expect(savePath(page, T1).getByRole('radio').nth(4)).toBeChecked();
    await expect(savePath(page, 'Distrito Rojo').getByRole('radio').nth(1)).toBeChecked();
    await expect(page.locator('body')).toContainText('Nezuko conquista la luz del sol');

    await savePath(page, T1).getByRole('radio').nth(2).check();
    await expect(savePath(page, 'Villa de los Herreros').getByRole('radio').nth(0)).toBeChecked();
    await expect(page.locator('body')).not.toContainText('Nezuko conquista la luz del sol');
  });

  test('una película opcional no se da por vista', async ({ page }) => {
    await page.goto('series/black-clover/');
    await hydrated(page);
    await savePath(page, 'Temporada 2 (en emisión)').getByRole('radio').nth(1).check();
    await expect(savePath(page, 'Temporada 1').getByRole('radio').nth(10)).toBeChecked();
    await expect(savePath(page, 'La espada del Rey Mago').getByRole('radio').nth(0)).toBeChecked();
  });

  test('quien va al día con el anime no ve lo que solo está en el manga', async ({ page }) => {
    await page.goto('series/kimetsu-no-yaiba/');
    await hydrated(page);
    await savePath(page, 'Castillo Infinito: película 1').getByRole('radio').nth(1).check();
    await expect(page.locator('body')).toContainText('Redención y caída de Akaza');
    await expect(page.locator('body')).not.toContainText('Batalla decisiva hasta el amanecer');
  });

  test('las portadas se revelan al terminar la entrega anterior', async ({ page }) => {
    await page.goto('series/attack-on-titan/');
    await hydrated(page);
    const shelf = page.locator('#temporadas');
    await expect(shelf.getByRole('img', { name: /Temporada 1/ })).toBeVisible();
    await expect(shelf.getByRole('img', { name: /Temporada final/ })).toHaveCount(0);
    await savePath(page, 'Temporada 3').getByRole('radio').nth(2).check();
    await expect(shelf.getByRole('img', { name: /Temporada final/ })).toBeVisible();
  });

  test('los nombres de arcos futuros no se muestran', async ({ page }) => {
    await page.goto('series/kimetsu-no-yaiba/');
    await hydrated(page);
    const radios = savePath(page, T1).getByRole('radio');
    await expect(radios.nth(3)).toHaveAccessibleName('Terminé: arco 3 de 4');
    await radios.nth(2).check();
    await expect(radios.nth(2)).toHaveAccessibleName('Terminé: Primeras misiones');
  });

  test('apagar el escudo muestra toda la historia', async ({ page }) => {
    await page.goto('series/kimetsu-no-yaiba/');
    await hydrated(page);
    await page.getByRole('button', { name: /Escudo activo/ }).click();
    await expect(page.getByRole('button', { name: /Escudo apagado/ })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.timeline__fog')).toHaveCount(0);
    await expect(page.locator('body')).toContainText('Redención y caída de Akaza');
  });

  test('"Ver spoilers" abre un bloque oculto', async ({ page }) => {
    await page.goto('series/kimetsu-no-yaiba/');
    await hydrated(page);
    await page.locator('.timeline__fog').getByRole('button', { name: 'Ver spoilers' }).click();
    await expect(page.locator('.timeline__fog')).toHaveCount(0);
    await expect(page.locator('body')).toContainText('Redención y caída de Akaza');
  });

  test('los personajes por conocer se agrupan y se pueden revelar', async ({ page }) => {
    await page.goto('series/kimetsu-no-yaiba/');
    await hydrated(page);
    const group = page.locator('#personajes [data-fog-group]');
    await expect(group.locator('[data-fog-count]')).toHaveText('13 personajes por conocer');
    await expect(page.locator('#personajes')).not.toContainText('Akaza');
    // El retrato de un personaje oculto no se pide mientras siga oculto.
    await expect(page.locator('#personajes img[src*="akaza"]')).toHaveCount(0);
    await group.getByRole('button', { name: 'Ver spoilers' }).click();
    await expect(page.locator('#personajes')).toContainText('Akaza');
    await expect(page.locator('#personajes img[src*="akaza"]')).toBeAttached();
    await expect(group.locator('[data-fog-summary]')).toBeHidden();
  });

  test('la página de un personaje oculto no revela su nombre', async ({ page }) => {
    await page.goto('series/kimetsu-no-yaiba/personajes/akaza/');
    await expect(page).toHaveTitle(/Personaje oculto/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0);
    await page.getByRole('button', { name: 'Ver spoiler', exact: true }).first().click();
    await expect(page.getByRole('heading', { level: 1, name: 'Akaza' })).toBeVisible();
  });

  test('el mapa de relaciones también se puede leer como lista', async ({ page }) => {
    await page.goto('series/kimetsu-no-yaiba/');
    await hydrated(page);
    await page.getByRole('button', { name: /Escudo activo/ }).click();
    await page.getByRole('button', { name: 'Ver como lista' }).click();
    await expect(page.locator('.graph__list li').first()).toBeVisible();
    await expect(page.locator('.graph__list')).toContainText('Tanjiro Kamado');
  });
});

test('la búsqueda encuentra personajes públicos', async ({ page }) => {
  await page.goto('buscar/');
  await hydrated(page);
  await page.getByLabel('Busca una serie, un personaje o un lugar').fill('Tanjiro');
  await expect(page.locator('.search__results a').first()).toContainText('Tanjiro');
});

test('la portada no tiene scroll horizontal', async ({ page }) => {
  await page.goto('');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('el índice de búsqueda no contiene texto protegido', async ({ page }) => {
  await page.goto('buscar/');
  await hydrated(page);
  // "Hakuji" solo aparece en datos ocultos de Akaza.
  await page.getByLabel('Busca una serie, un personaje o un lugar').fill('Hakuji');
  await expect(page.getByText('0 resultados', { exact: false })).toBeVisible();
});

test.describe('seguridad', () => {
  for (const path of ['', 'series/jujutsu-kaisen/', 'series/jujutsu-kaisen/personajes/yuji-itadori/', 'buscar/?q=Yuji', 'acerca/']) {
    test(`sin violaciones de la CSP ni errores en /${path}`, async ({ page }) => {
      const problems: string[] = [];
      page.on('console', (msg) => msg.type() === 'error' && problems.push(msg.text()));
      page.on('pageerror', (err) => problems.push(err.message));
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (e) =>
          console.error(`CSP: ${e.violatedDirective} ${e.blockedURI}`),
        );
      });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      if (path.startsWith('buscar')) await expect(page.locator('.search__results a').first()).toBeVisible();
      expect(problems).toEqual([]);
    });
  }

  test('la página declara una CSP sin unsafe-inline ni unsafe-eval en scripts', async ({ page }) => {
    await page.goto('');
    const csp = await page.locator('meta[http-equiv="content-security-policy"]').getAttribute('content');
    const scriptSrc = csp?.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
    expect(scriptSrc).toContain("'self'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(csp).toContain("object-src 'none'");
  });

  test('un ?q= malicioso no ejecuta código', async ({ page }) => {
    let dialog = false;
    page.on('dialog', async (d) => {
      dialog = true;
      await d.dismiss();
    });
    await page.goto('buscar/?q=' + encodeURIComponent('"><img src=x onerror=alert(1)><script>alert(2)</script>'));
    await page.waitForLoadState('networkidle');
    expect(dialog).toBe(false);
    await expect(page.locator('#buscar')).toHaveValue(/onerror/);
  });
});
