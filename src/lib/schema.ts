// Schema — imports v1 marker definitions, re-exports with types
// This avoids duplicating 200+ lines of marker data during the transition.
// Once v1 is removed, move the data inline here.

import type { MarkerSchema } from './types';

// Import v1 schema directly (Vite resolves this from js/)
// @ts-ignore — v1 module has no types
import { MARKER_SCHEMA as _schema } from '../../js/schema.js';

export const MARKER_SCHEMA: MarkerSchema = _schema;

/** Get all category keys */
export function getCategoryKeys(): string[] {
  return Object.keys(MARKER_SCHEMA);
}

/** Get all marker keys in category.marker format */
export function getAllMarkerKeys(): string[] {
  const keys: string[] = [];
  for (const [catKey, cat] of Object.entries(MARKER_SCHEMA)) {
    for (const mKey of Object.keys(cat.markers)) {
      keys.push(`${catKey}.${mKey}`);
    }
  }
  return keys;
}

/** Lookup a marker by dotted key */
export function getMarkerDef(dotKey: string) {
  const [catKey, mKey] = dotKey.split('.');
  return MARKER_SCHEMA[catKey]?.markers[mKey] ?? null;
}
