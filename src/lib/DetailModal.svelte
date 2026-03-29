<script lang="ts">
  import { activeData } from './data';
  import { getStatus, formatValue, getTrend } from './utils';
  import { createEventDispatcher } from 'svelte';
  import MarkerChart from './MarkerChart.svelte';
  import NotesEditor from './NotesEditor.svelte';
  import Recommendations from './Recommendations.svelte';
  import type { ActiveMarker } from './types';

  export let markerKey: string;
  const dispatch = createEventDispatcher();

  $: [catKey, mKey] = markerKey.split('.');
  $: category = $activeData.categories[catKey];
  $: marker = category?.markers[mKey] as ActiveMarker | undefined;
  $: latest = marker?.values?.filter(v => v !== null).pop() ?? null;
  $: status = marker ? getStatus(latest, marker.refMin, marker.refMax) : 'missing';
  $: trend = marker ? getTrend(marker.values || [], marker.refMin, marker.refMax) : { arrow: '—', cls: '' };

  // Build value entries with dates
  $: valueEntries = (() => {
    if (!marker) return [];
    return ($activeData.dates || []).map((date, i) => ({
      date, label: $activeData.dateLabels[i],
      value: marker!.values?.[i] ?? null,
      status: getStatus(marker!.values?.[i] ?? null, marker!.refMin, marker!.refMax),
    })).filter(e => e.value !== null).reverse();
  })();

  function close() { dispatch('close'); }
  function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="dm-overlay" on:click|self={close} role="dialog" tabindex="-1">
  <div class="dm-modal">
    <button class="dm-close" on:click={close}>&times;</button>

    {#if marker}
      <!-- Header -->
      <div class="dm-top">
        <h2 class="dm-name">{marker.name} <span class="dm-unit">{marker.unit}</span></h2>
        {#if marker.optimalMin != null}
          <div class="dm-range">Optimal: {formatValue(marker.optimalMin)} – {formatValue(marker.optimalMax)} · Ref: {formatValue(marker.refMin)} – {formatValue(marker.refMax)}</div>
        {:else}
          <div class="dm-range">Ref: {formatValue(marker.refMin)} – {formatValue(marker.refMax)}</div>
        {/if}
      </div>

      {#if marker.desc}
        <p class="dm-desc">{marker.desc}</p>
      {/if}

      <!-- Chart -->
      {#if marker.values?.some(v => v !== null)}
        <div class="dm-chart-wrap">
          <MarkerChart {marker} dates={$activeData.dates} dateLabels={$activeData.dateLabels} />
        </div>
      {/if}

      <!-- Value cards grid (like v1) -->
      <div class="dm-values-grid">
        {#each valueEntries as entry (entry.date)}
          <div class="dm-value-card {entry.status}">
            <div class="dm-val-date">{entry.label}</div>
            <div class="dm-val-num">{formatValue(entry.value)}</div>
            <div class="dm-val-status">
              {#if entry.status === 'high'}▲ Above Range
              {:else if entry.status === 'low'}▼ Below Range
              {:else}● In Range
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <!-- Trend -->
      <div class="dm-trend">
        <span class="dm-trend-label">Trend:</span>
        <span class={trend.cls}>{trend.arrow}</span>
      </div>

      <!-- Notes -->
      <NotesEditor {markerKey} />

      <!-- Actions -->
      <div class="dm-actions">
        <button class="dm-btn" on:click={() => dispatch('addValue', markerKey)}>+ Add Value</button>
      </div>

      <!-- Recommendations -->
      <Recommendations slotKey={markerKey} markerStatus={status} />
    {:else}
      <p style="color:var(--text-muted)">Marker not found</p>
    {/if}
  </div>
</div>

<style>
  .dm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 275; display: flex; justify-content: center; align-items: flex-start; padding: 32px 16px; overflow-y: auto; }
  .dm-modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px; width: 100%; max-width: 680px; position: relative; box-shadow: var(--shadow-lg); }
  .dm-close { position: absolute; top: 14px; right: 18px; background: none; border: none; color: var(--text-muted); font-size: 28px; cursor: pointer; line-height: 1; }
  .dm-close:hover { color: var(--text-primary); }

  .dm-top { margin-bottom: 12px; }
  .dm-name { font-family: var(--font-display); font-size: 20px; font-weight: 800; letter-spacing: -0.3px; }
  .dm-unit { font-size: 13px; color: var(--text-muted); font-weight: 400; margin-left: 4px; }
  .dm-range { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
  .dm-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; padding: 10px 14px; background: var(--bg-secondary); border-radius: var(--radius-sm); }

  .dm-chart-wrap { margin-bottom: 20px; background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 12px; }

  .dm-values-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; margin-bottom: 16px; }
  .dm-value-card { background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 12px 14px; text-align: center; border-top: 3px solid var(--border); }
  .dm-value-card.high { border-top-color: var(--red); }
  .dm-value-card.low { border-top-color: var(--yellow); }
  .dm-value-card.normal { border-top-color: var(--green); }
  .dm-val-date { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
  .dm-val-num { font-size: 22px; font-weight: 800; font-family: var(--font-display); font-variant-numeric: tabular-nums; }
  .dm-val-status { font-size: 10px; margin-top: 4px; }
  .dm-value-card.high .dm-val-status { color: var(--red); }
  .dm-value-card.low .dm-val-status { color: var(--yellow); }
  .dm-value-card.normal .dm-val-status { color: var(--green); }

  .dm-trend { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
  .dm-trend-label { color: var(--text-muted); margin-right: 6px; }

  .dm-actions { margin: 12px 0; }
  .dm-btn { width: 100%; padding: 10px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--text-secondary); font-size: 13px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .dm-btn:hover { border-color: var(--accent); color: var(--accent); }
</style>
