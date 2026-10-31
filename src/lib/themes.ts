/**
 * Identidad visual de cada serie: colores de la interfaz y del paisaje generativo.
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
  bg: '#0e0e12',
  surface: '#18181e',
  raised: '#22222a',
  line: '#6f6f7c',
  text: '#f2f1ee',
  muted: '#b3b2ba',
  accent: '#ff7a66',
  accentInk: '#200703',
  sky: ['#14141c', '#3a2230'],
  ridges: ['#2a1e28', '#1c1820', '#121216'],
  glow: '#ffb3a6',
  motif: 'night',
};

export const THEMES: Record<string, Theme> = {
  'kimetsu-no-yaiba': {
    bg: '#0d1413',
    surface: '#15201e',
    raised: '#1d2b29',
    line: '#68857e',
    text: '#eef5f2',
    muted: '#a9c0b9',
    accent: '#5ed6a8',
    accentInk: '#04170f',
    sky: ['#0c2a2a', '#1f6b5c'],
    ridges: ['#17453e', '#10302c', '#0a1d1b'],
    glow: '#f7b5c8',
    motif: 'pines',
  },
  'attack-on-titan': {
    bg: '#12110e',
    surface: '#1b1a15',
    raised: '#25231c',
    line: '#79735f',
    text: '#f1ede3',
    muted: '#bdb6a5',
    accent: '#e0b866',
    accentInk: '#1c1405',
    sky: ['#2a3a4a', '#8a9aa6'],
    ridges: ['#6b6558', '#464236', '#26241d'],
    glow: '#f0e3c0',
    motif: 'mesas',
  },
  'jujutsu-kaisen': {
    bg: '#0d0b16',
    surface: '#171426',
    raised: '#211c36',
    line: '#736a9c',
    text: '#f0eef8',
    muted: '#b3adcf',
    accent: '#b39dff',
    accentInk: '#12082b',
    sky: ['#0f0a24', '#3b1f6e'],
    ridges: ['#2a1a55', '#1c123c', '#120c28'],
    glow: '#ff5d73',
    motif: 'night',
  },
  'black-clover': {
    bg: '#0e100d',
    surface: '#181b15',
    raised: '#22261d',
    line: '#727d62',
    text: '#f0f2e9',
    muted: '#b4bba4',
    accent: '#c3d94e',
    accentInk: '#141a02',
    sky: ['#0f1a10', '#2f5a2b'],
    ridges: ['#24452a', '#18301c', '#0e1c10'],
    glow: '#e8e8a0',
    motif: 'hills',
  },
  'kaiju-n8': {
    bg: '#0a1012',
    surface: '#121b1f',
    raised: '#1a262b',
    line: '#628089',
    text: '#ecf4f6',
    muted: '#a6bcc4',
    accent: '#ff9247',
    accentInk: '#1f0c00',
    sky: ['#0e2128', '#1e5a66'],
    ridges: ['#17404a', '#102c33', '#09191d'],
    glow: '#35e0c2',
    motif: 'volcano',
  },
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
