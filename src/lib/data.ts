// Data pipeline — transforms raw imported data into active chart/table data
// V2 port of v1's getActiveData() as a derived store
import { derived } from 'svelte/store';
import { importedData, profileSex, unitSystem, timeFormat } from './stores';
import { MARKER_SCHEMA } from './schema';
import type { MarkerSchema, ActiveData, ActiveMarker } from './types';

// Import v1 optimal ranges and unit conversions (shared data, no logic)
// @ts-ignore
import { OPTIMAL_RANGES, UNIT_CONVERSIONS } from '../../js/schema.js';

/**
 * Reactive data pipeline. Recomputes whenever importedData or profileSex changes.
 * Replaces v1's `getActiveData()` which was called imperatively on every render.
 */
export const activeData = derived(
  [importedData, profileSex, unitSystem, timeFormat],
  ([$importedData, $profileSex, $unitSystem, $timeFormat]): ActiveData => {
    // Deep clone schema as starting point
    const categories: ActiveData['categories'] = JSON.parse(JSON.stringify(MARKER_SCHEMA));

    // Merge custom markers
    const custom = $importedData.customMarkers || {};
    for (const [fullKey, def] of Object.entries(custom) as [string, any][]) {
      const [catKey, markerKey] = fullKey.split('.');
      if (!markerKey) continue;
      if (!categories[catKey]) {
        categories[catKey] = {
          label: def.categoryLabel || catKey.charAt(0).toUpperCase() + catKey.slice(1),
          icon: def.icon || '\uD83D\uDD16',
          markers: {},
        };
      }
      if (!categories[catKey].markers[markerKey]) {
        categories[catKey].markers[markerKey] = {
          name: def.name,
          unit: def.unit || '',
          refMin: def.refMin,
          refMax: def.refMax,
          values: [],
        };
      }
    }

    // Apply sex-specific reference ranges
    if ($profileSex === 'female') {
      for (const cat of Object.values(categories)) {
        for (const marker of Object.values(cat.markers) as any[]) {
          if (marker.refMin_f !== undefined) {
            marker.refMin = marker.refMin_f;
            marker.refMax = marker.refMax_f;
          }
        }
      }
    }

    // Merge optimal ranges
    for (const [fullKey, opt] of Object.entries(OPTIMAL_RANGES) as [string, any][]) {
      const [catKey, markerKey] = fullKey.split('.');
      const marker = categories[catKey]?.markers[markerKey];
      if (!marker) continue;
      if ($profileSex === 'female' && opt.optimalMin_f !== undefined) {
        marker.optimalMin = opt.optimalMin_f;
        marker.optimalMax = opt.optimalMax_f;
      } else {
        marker.optimalMin = opt.optimalMin;
        marker.optimalMax = opt.optimalMax;
      }
    }

    // Apply user range overrides
    const refOverrides = $importedData.refOverrides || {};
    for (const [fullKey, ovr] of Object.entries(refOverrides) as [string, any][]) {
      const [catKey, markerKey] = fullKey.split('.');
      const marker = categories[catKey]?.markers[markerKey];
      if (!marker) continue;
      if ('refMin' in ovr) marker.refMin = ovr.refMin;
      if ('refMax' in ovr) marker.refMax = ovr.refMax;
      if ('optimalMin' in ovr) marker.optimalMin = ovr.optimalMin;
      if ('optimalMax' in ovr) marker.optimalMax = ovr.optimalMax;
    }

    // Apply label/icon overrides
    const catLabels = $importedData.categoryLabels || {};
    for (const [catKey, label] of Object.entries(catLabels)) {
      if (categories[catKey]) categories[catKey].label = label as string;
    }
    const catIcons = $importedData.categoryIcons || {};
    for (const [catKey, icon] of Object.entries(catIcons)) {
      if (categories[catKey]) categories[catKey].icon = icon as string;
    }
    const markerLabels = $importedData.markerLabels || {};
    for (const [dotKey, label] of Object.entries(markerLabels)) {
      const [catKey, mKey] = dotKey.split('.');
      if (categories[catKey]?.markers[mKey]) categories[catKey].markers[mKey].name = label as string;
    }

    // Build entry lookup — v1 stores entries as array, handle both formats
    const rawEntries = $importedData.entries;
    const entryList: any[] = Array.isArray(rawEntries) ? rawEntries : [];
    const entryLookup: Record<string, Record<string, number>> = {};
    for (const entry of entryList) {
      if (!entryLookup[entry.date]) entryLookup[entry.date] = {};
      Object.assign(entryLookup[entry.date], entry.markers);
    }

    // Collect and sort dates
    const dateSet = new Set<string>();
    for (const entry of entryList) {
      if (entry.date) dateSet.add(entry.date);
    }
    const dates = [...dateSet].sort();
    const dateLabels = dates.map(d => {
      const dt = new Date(d + 'T00:00:00');
      const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
      if ($timeFormat === '12h') opts.hour12 = true;
      return dt.toLocaleDateString('en-US', opts);
    });

    // Populate marker values
    for (const [catKey, cat] of Object.entries(categories)) {
      for (const [markerKey, marker] of Object.entries(cat.markers) as [string, ActiveMarker][]) {
        const fullKey = `${catKey}.${markerKey}`;
        marker.values = dates.map(date => entryLookup[date]?.[fullKey] ?? null);
      }
    }

    // Apply US unit conversion if needed
    if ($unitSystem === 'US' && UNIT_CONVERSIONS) {
      for (const [catKey, cat] of Object.entries(categories)) {
        for (const [mKey, marker] of Object.entries(cat.markers) as [string, ActiveMarker][]) {
          const conv = UNIT_CONVERSIONS[`${catKey}.${mKey}`];
          if (!conv) continue;
          marker.unit = conv.unit;
          if (conv.factor) {
            marker.values = marker.values.map(v => v !== null ? +(v * conv.factor).toFixed(4) : null);
            if (marker.refMin != null) marker.refMin = +(marker.refMin * conv.factor).toFixed(4);
            if (marker.refMax != null) marker.refMax = +(marker.refMax * conv.factor).toFixed(4);
            if (marker.optimalMin != null) marker.optimalMin = +(marker.optimalMin * conv.factor).toFixed(4);
            if (marker.optimalMax != null) marker.optimalMax = +(marker.optimalMax * conv.factor).toFixed(4);
          }
        }
      }
    }

    return { categories, dateLabels, dates };
  }
);

/** Count flagged (non-normal) markers in a markers map */
export function countFlagged(markers: Record<string, ActiveMarker>): number {
  let count = 0;
  for (const m of Object.values(markers)) {
    const latest = m.values?.filter(v => v !== null).pop();
    if (latest !== undefined && latest !== null) {
      if ((m.refMin != null && latest < m.refMin) || (m.refMax != null && latest > m.refMax)) count++;
    }
  }
  return count;
}

/** Get status icon */
export function statusIcon(s: string): string {
  if (s === 'high') return '\u25B2';
  if (s === 'low') return '\u25BC';
  return '';
}
