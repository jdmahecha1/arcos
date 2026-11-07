/**
 * Interruptor de modo claro/oscuro. El oscuro es el predeterminado: solo se guarda la
 * preferencia cuando la persona elige el claro. El script en línea del <head> la aplica
 * antes de pintar la página, para que no parpadee.
 */
const KEY = 'arcos:tema';
const root = document.documentElement;

function sync(button: HTMLElement) {
  const light = root.dataset.theme === 'light';
  button.setAttribute('aria-label', light ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
  button.title = light ? 'Modo oscuro' : 'Modo claro';
}

for (const button of document.querySelectorAll<HTMLElement>('[data-theme-toggle]')) {
  sync(button);
  button.addEventListener('click', () => {
    const light = root.dataset.theme !== 'light';
    if (light) root.dataset.theme = 'light';
    else delete root.dataset.theme;
    try {
      if (light) localStorage.setItem(KEY, 'claro');
      else localStorage.removeItem(KEY);
    } catch {
      // Sin almacenamiento (modo privado estricto): el cambio vale solo para esta página.
    }
    sync(button);
  });
}
