/**
 * Identidad visual de cada serie. El sitio es un tomo de manga: tinta (modo oscuro) o
 * papel (modo claro) iguales para todas, y un solo color especial por serie.
 * Todos los pares de texto se validan en tests/themes.test.ts (WCAG AA).
 */
export type Motif = 'mesas' | 'pines' | 'planet' | 'hills' | 'jungle' | 'volcano' | 'night';

/** Colores de la interfaz de un modo (oscuro o claro). */
export interface Palette {
  /** Fondo de la página. */
  bg: string;
  /** Superficie de tarjetas y paneles. */
  surface: string;
  /** Superficie elevada (hover, campos). */
  raised: string;
  /** Bordes y sombras de tinta: >= 3:1 contra surface. */
  line: string;
  text: string;
  muted: string;
  /** Color especial de la serie para texto, nodos y foco: >= 4.5:1 contra bg, surface y raised. */
  accent: string;
  /** Texto sobre un relleno de acento. */
  accentInk: string;
}

/**
 * El modo oscuro (páginas de tinta) es el predeterminado; el claro (papel) solo se usa
 * si la persona lo elige.
 */
export interface Theme extends Palette {
  light: Palette;
  /** Paisaje: cielo arriba/abajo, tres capas de relieve (lejos a cerca) y astro. */
  sky: [string, string];
  ridges: [string, string, string];
  glow: string;
  motif: Motif;
}

const INK = { bg: '#131313', surface: '#1d1d1d', raised: '#2a2a2a', line: '#d6d4cc', text: '#f2f1ec', muted: '#b4b3ad', accentInk: '#131313' };
const PAPER = { bg: '#e8e7e2', surface: '#f5f4f0', raised: '#d9d8d2', line: '#141414', text: '#141414', muted: '#46464b', accentInk: '#f5f4f0' };

/** Cada serie aporta solo su color especial: brillante sobre tinta y oscuro sobre papel. */
function palettes(dark: string, light: string): Palette & { light: Palette } {
  return { ...INK, accent: dark, light: { ...PAPER, accent: light } };
}

export const DEFAULT_THEME: Theme = {
  ...palettes('#ff634a', '#aa2e1b'),
  sky: ['#14141c', '#3a2230'],
  ridges: ['#2a1e28', '#1c1820', '#121216'],
  glow: '#ffb3a6',
  motif: 'night',
};

export const THEMES: Record<string, Theme> = {
  'kimetsu-no-yaiba': {
    ...palettes('#2fc48a', '#146747'),
    sky: ['#0c2a2a', '#1f6b5c'],
    ridges: ['#17453e', '#10302c', '#0a1d1b'],
    glow: '#f7b5c8',
    motif: 'pines',
  },
  'attack-on-titan': {
    ...palettes('#e0a84a', '#7f5212'),
    sky: ['#2a3a4a', '#8a9aa6'],
    ridges: ['#6b6558', '#464236', '#26241d'],
    glow: '#f0e3c0',
    motif: 'mesas',
  },
  'jujutsu-kaisen': {
    ...palettes('#a385ff', '#6337d4'),
    sky: ['#0f0a24', '#3b1f6e'],
    ridges: ['#2a1a55', '#1c123c', '#120c28'],
    glow: '#ff5d73',
    motif: 'night',
  },
  'black-clover': {
    ...palettes('#b2cc3c', '#46650c'),
    sky: ['#0f1a10', '#2f5a2b'],
    ridges: ['#24452a', '#18301c', '#0e1c10'],
    glow: '#e8e8a0',
    motif: 'hills',
  },
  'kaiju-n8': {
    ...palettes('#ff7d33', '#983d16'),
    sky: ['#0e2128', '#1e5a66'],
    ridges: ['#17404a', '#102c33', '#09191d'],
    glow: '#35e0c2',
    motif: 'volcano',
  },
};

/** Título original de cada serie, para usarlo como elemento gráfico (decorativo). */
export const TITLE_JA: Record<string, string> = {
  'kimetsu-no-yaiba': '鬼滅の刃',
  'attack-on-titan': '進撃の巨人',
  'jujutsu-kaisen': '呪術廻戦',
  'black-clover': 'ブラッククローバー',
  'kaiju-n8': '怪獣8号',
};

export function themeFor(sagaId?: string): Theme {
  return (sagaId && THEMES[sagaId]) || DEFAULT_THEME;
}

/**
 * Variables CSS del tema, para el atributo style de <body> o de una tarjeta (con data-themed).
 * Van los colores oscuros y, aparte, los claros (--l-*): global.css los activa en modo claro.
 */
export function themeStyle(theme: Theme): string {
  const vars = (p: Palette, prefix: string) => [
    `--${prefix}bg:${p.bg}`,
    `--${prefix}surface:${p.surface}`,
    `--${prefix}raised:${p.raised}`,
    `--${prefix}line:${p.line}`,
    `--${prefix}text:${p.text}`,
    `--${prefix}muted:${p.muted}`,
    `--${prefix}accent:${p.accent}`,
    `--${prefix}accent-ink:${p.accentInk}`,
  ];
  return [...vars(theme, ''), ...vars(theme.light, 'l-')].join(';');
}
