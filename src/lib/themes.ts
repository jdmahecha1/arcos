/**
 * Identidad visual de cada serie. El sitio es un tomo de manga impreso: papel y tinta
 * iguales para todas, y un solo color especial por serie (como la tinta de portada).
 * Todos los pares de texto se validan en tests/themes.test.ts (WCAG AA).
 */
export type Motif = 'mesas' | 'pines' | 'planet' | 'hills' | 'jungle' | 'volcano' | 'night';

export interface Theme {
  /** Fondo de la página. */
  bg: string;
  /** Superficie de tarjetas y paneles. */
  surface: string;
  /** Superficie elevada (hover, campos). */
  raised: string;
  /** Borde de controles: >= 3:1 contra surface. */
  line: string;
  text: string;
  muted: string;
  /** Acento para texto, nodos y foco: >= 4.5:1 contra bg y surface. */
  accent: string;
  /** Texto sobre un relleno de acento. */
  accentInk: string;
  /** Paisaje: cielo arriba/abajo, tres capas de relieve (lejos a cerca) y astro. */
  sky: [string, string];
  ridges: [string, string, string];
  glow: string;
  motif: Motif;
}

export const DEFAULT_THEME: Theme = {
  bg: '#e8e7e2',
  surface: '#f5f4f0',
  raised: '#d9d8d2',
  line: '#141414',
  text: '#141414',
  muted: '#46464b',
  accent: '#aa2e1b',
  accentInk: '#f5f4f0',
  sky: ['#14141c', '#3a2230'],
  ridges: ['#2a1e28', '#1c1820', '#121216'],
  glow: '#ffb3a6',
  motif: 'night',
};

export const THEMES: Record<string, Theme> = {
  'kimetsu-no-yaiba': {
    bg: '#e8e7e2',
    surface: '#f5f4f0',
    raised: '#d9d8d2',
    line: '#141414',
    text: '#141414',
    muted: '#46464b',
    accent: '#146747',
    accentInk: '#f5f4f0',
    sky: ['#0c2a2a', '#1f6b5c'],
    ridges: ['#17453e', '#10302c', '#0a1d1b'],
    glow: '#f7b5c8',
    motif: 'pines',
  },
  'attack-on-titan': {
    bg: '#e8e7e2',
    surface: '#f5f4f0',
    raised: '#d9d8d2',
    line: '#141414',
    text: '#141414',
    muted: '#46464b',
    accent: '#7f5212',
    accentInk: '#f5f4f0',
    sky: ['#2a3a4a', '#8a9aa6'],
    ridges: ['#6b6558', '#464236', '#26241d'],
    glow: '#f0e3c0',
    motif: 'mesas',
  },
  'jujutsu-kaisen': {
    bg: '#e8e7e2',
    surface: '#f5f4f0',
    raised: '#d9d8d2',
    line: '#141414',
    text: '#141414',
    muted: '#46464b',
    accent: '#6337d4',
    accentInk: '#f5f4f0',
    sky: ['#0f0a24', '#3b1f6e'],
    ridges: ['#2a1a55', '#1c123c', '#120c28'],
    glow: '#ff5d73',
    motif: 'night',
  },
  'black-clover': {
    bg: '#e8e7e2',
    surface: '#f5f4f0',
    raised: '#d9d8d2',
    line: '#141414',
    text: '#141414',
    muted: '#46464b',
    accent: '#46650c',
    accentInk: '#f5f4f0',
    sky: ['#0f1a10', '#2f5a2b'],
    ridges: ['#24452a', '#18301c', '#0e1c10'],
    glow: '#e8e8a0',
    motif: 'hills',
  },
  'kaiju-n8': {
    bg: '#e8e7e2',
    surface: '#f5f4f0',
    raised: '#d9d8d2',
    line: '#141414',
    text: '#141414',
    muted: '#46464b',
    accent: '#983d16',
    accentInk: '#f5f4f0',
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

/** Variables CSS del tema, para el atributo style de <body> o de una tarjeta. */
export function themeStyle(theme: Theme): string {
  return [
    `--bg:${theme.bg}`,
    `--surface:${theme.surface}`,
    `--raised:${theme.raised}`,
    `--line:${theme.line}`,
    `--text:${theme.text}`,
    `--muted:${theme.muted}`,
    `--accent:${theme.accent}`,
    `--accent-ink:${theme.accentInk}`,
  ].join(';');
}
