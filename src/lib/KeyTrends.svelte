<script lang="ts">
  import { activeData } from './data';
  import { getStatus, formatValue } from './utils';
  import MarkerChart from './MarkerChart.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { ActiveMarker } from './types';

  const dispatch = createEventDispatcher();

  // Select key markers: flagged first, then most data points, max 8
  $: keyMarkers = (() => {
    const all: { key: string; marker: ActiveMarker; flagged: boolean; points: number }[] = [];
    for (const [catKey, cat] of Object.entries($activeData.categories)) {
      for (const [mKey, marker] of Object.entries(cat.markers)) {
        const m = marker as ActiveMarker;
        const nonNull = (m.values || []).filter(v => v !== null);
        if (nonNull.length < 2) continue;
        const latest = nonNull[nonNull.length - 1];
        const flagged = getStatus(latest, m.refMin, m.refMax) !== 'normal';
        all.push({ key: `${catKey}.${mKey}`, marker: m, flagged, points: nonNull.length });
      }
    }
    all.sort((a, b) => {
      if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
      return b.points - a.points;
    });
    return all.slice(0, 8);
  })();
</script>

{#if keyMarkers.length > 0}
  <div class="kt-section">
    <h3>Key Trends</h3>
    <div class="kt-grid">
      {#each keyMarkers as { key, marker } (key)}
        {@const latest = marker.values?.filter(v => v !== null).pop() ?? null}
        {@const status = getStatus(latest, marker.refMin, marker.refMax)}
        <button class="kt-card" on:click={() => dispatch('openDetail', key)}>
          <div class="kt-header">
            <span class="kt-name">{marker.name}</span>
            <span class="kt-badge {status}">{status === 'high' ? '▲ High' : status === 'low' ? '▼ Low' : ''}</span>
          </div>
          <div class="kt-chart">
            <MarkerChart {marker} dates={$activeData.dates} dateLabels={$activeData.dateLabels} />
          </div>
          <div class="kt-footer">
            <span class="kt-val">{formatValue(latest)}</span>
            <span class="kt-unit">{marker.unit}</span>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .kt-section { margin-bottom: 28px; }
  h3 { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; }
  .kt-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)); gap: 12px; }
  .kt-card {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 14px 16px; cursor: pointer; font-family: inherit; color: var(--text-primary);
    text-align: left; width: 100%; transition: all 0.2s; min-width: 0; overflow: hidden;
  }
  .kt-card:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: var(--shadow-lg); }
  .kt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .kt-name { font-size: 13px; font-weight: 600; }
  .kt-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  .kt-badge.high { background: var(--red-bg); color: var(--red); }
  .kt-badge.low { background: var(--yellow-bg); color: var(--yellow); }
  .kt-badge.normal { display: none; }
  .kt-chart { height: 120px; margin: 0 -4px; }
  .kt-footer { display: flex; align-items: baseline; gap: 4px; margin-top: 6px; }
  .kt-val { font-size: 18px; font-weight: 700; font-family: var(--font-display); font-variant-numeric: tabular-nums; }
  .kt-unit { font-size: 11px; color: var(--text-muted); }
</style>
