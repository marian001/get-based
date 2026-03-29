<script lang="ts">
  import { activeData } from './data';
  import { getStatus, formatValue, getTrend } from './utils';
  import { createEventDispatcher } from 'svelte';
  import MarkerChart from './MarkerChart.svelte';
  import type { ActiveMarker } from './types';

  export let markerKey: string; // "category.marker" format
  const dispatch = createEventDispatcher();

  $: [catKey, mKey] = markerKey.split('.');
  $: category = $activeData.categories[catKey];
  $: marker = category?.markers[mKey] as ActiveMarker | undefined;
  $: latest = marker?.values?.filter(v => v !== null).pop() ?? null;
  $: status = marker ? getStatus(latest, marker.refMin, marker.refMax) : 'missing';
  $: trend = marker ? getTrend(marker.values || [], marker.refMin, marker.refMax) : { arrow: '—', cls: '' };

  function close() { dispatch('close'); }
  function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="modal-backdrop" on:click|self={close} role="dialog" tabindex="-1">
  <div class="detail-modal">
    <button class="modal-close" on:click={close}>&times;</button>

    {#if marker}
      <div class="modal-header">
        <h2>{marker.name}</h2>
        <span class="modal-unit">{marker.unit}</span>
      </div>

      {#if marker.desc}
        <p class="modal-desc">{marker.desc}</p>
      {/if}

      <div class="modal-stats">
        <div class="modal-stat">
          <div class="modal-stat-val {status}">{formatValue(latest)}</div>
          <div class="modal-stat-lbl">Latest</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-val">{formatValue(marker.refMin)} – {formatValue(marker.refMax)}</div>
          <div class="modal-stat-lbl">Reference</div>
        </div>
        {#if marker.optimalMin != null}
          <div class="modal-stat">
            <div class="modal-stat-val" style="color:var(--green)">{formatValue(marker.optimalMin)} – {formatValue(marker.optimalMax)}</div>
            <div class="modal-stat-lbl">Optimal</div>
          </div>
        {/if}
        <div class="modal-stat">
          <div class="modal-stat-val {trend.cls}">{trend.arrow}</div>
          <div class="modal-stat-lbl">Trend</div>
        </div>
      </div>

      <!-- Chart -->
      {#if marker.values?.some(v => v !== null)}
        <MarkerChart {marker} dates={$activeData.dates} dateLabels={$activeData.dateLabels} />
      {/if}

      <!-- Values table -->
      <h3>History</h3>
      <table class="history-table">
        <thead>
          <tr><th>Date</th><th>Value</th><th>Status</th></tr>
        </thead>
        <tbody>
          {#each $activeData.dates as date, i}
            {@const val = marker.values?.[i] ?? null}
            {#if val !== null}
              {@const s = getStatus(val, marker.refMin, marker.refMax)}
              <tr>
                <td>{$activeData.dateLabels[i]}</td>
                <td class="val-cell">{formatValue(val)} {marker.unit}</td>
                <td><span class="status-badge {s}">{s}</span></td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>

      <!-- Recommendations placeholder -->
      <div class="rec-placeholder">
        <span style="color:var(--text3)">Recommendations section — available from v1 catalog</span>
      </div>
    {:else}
      <p style="color:var(--text3)">Marker not found</p>
    {/if}
  </div>
</div>

<style>
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px; overflow-y: auto; }
  .detail-modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 640px; position: relative; }
  .modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; color: var(--text3); font-size: 24px; cursor: pointer; padding: 4px; }
  .modal-close:hover { color: var(--text); }
  .modal-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
  .modal-header h2 { font-size: 20px; font-weight: 700; }
  .modal-unit { font-size: 13px; color: var(--text3); }
  .modal-desc { font-size: 13px; color: var(--text2); line-height: 1.5; margin-bottom: 16px; }
  h3 { font-size: 14px; font-weight: 600; color: var(--text2); margin: 20px 0 8px; }
  .modal-stats { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .modal-stat { background: var(--bg3); border-radius: var(--radius); padding: 12px 16px; min-width: 100px; }
  .modal-stat-val { font-size: 18px; font-weight: 700; }
  .modal-stat-val.high { color: var(--red); }
  .modal-stat-val.low { color: var(--yellow); }
  .modal-stat-val.normal { color: var(--green); }
  .modal-stat-lbl { font-size: 11px; color: var(--text3); }
  .chart-placeholder { background: var(--bg3); border-radius: var(--radius); height: 200px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px dashed var(--border); }
  .history-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .history-table th { text-align: left; padding: 6px 10px; border-bottom: 2px solid var(--border); color: var(--text3); font-size: 11px; text-transform: uppercase; }
  .history-table td { padding: 6px 10px; border-bottom: 1px solid var(--border); }
  .val-cell { font-family: var(--font-mono); }
  .status-badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  .status-badge.high { background: rgba(248,113,113,0.15); color: var(--red); }
  .status-badge.low { background: rgba(251,191,36,0.15); color: var(--yellow); }
  .status-badge.normal { background: rgba(52,211,153,0.15); color: var(--green); }
  .rec-placeholder { background: var(--bg3); border-radius: var(--radius); padding: 16px; text-align: center; margin-top: 16px; border: 1px dashed var(--border); }
</style>
