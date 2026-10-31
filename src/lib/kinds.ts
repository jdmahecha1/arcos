/** Sin dependencias: lo importan las islas del navegador sin arrastrar Zod al paquete. */
export const RELATION_KINDS = ['aliado', 'enemigo', 'familia', 'romance', 'mentor', 'rival'] as const;

export type RelationKind = (typeof RELATION_KINDS)[number];

export const SEASON_FORMATS = ['anime', 'pelicula', 'manga'] as const;

export type SeasonFormat = (typeof SEASON_FORMATS)[number];
