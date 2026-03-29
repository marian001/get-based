<script lang="ts">
  import { activeData } from './data';
  import { countFlagged } from './data';
  import { getStatus, formatValue, getTrend } from './utils';
  import TrendAlerts from './TrendAlerts.svelte';
  import ContextCards from './ContextCards.svelte';
  import Supplements from './Supplements.svelte';
  import GeneticsSection from './GeneticsSection.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { ActiveMarker } from './types';

  const dispatch = createEventDispatcher();

  $: allMarkers = (() => {
    const results: { key: string; catKey: string; catLabel: string; marker: ActiveMarker }[] = [];
    for (const [catKey, cat] of Object.entries($activeData.categories)) {
      for (const [mKey, marker] of Object.entries(cat.markers)) {
        const latest = marker.values?.filter(v => v !== null).pop();
        if (latest !== undefined && latest !== null) {
          results.push({ key: `${catKey}.${mKey}`, catKey, catLabel: cat.label, marker: marker as ActiveMarker });
        }
      }
    }
    return results;
  })();

  $: flaggedMarkers = allMarkers.filter(m => {
    const latest = m.marker.values?.filter(v => v !== null).pop()!;
    return getStatus(latest, m.marker.refMin, m.marker.refMax) !== 'normal';
  });

  $: normalMarkers = allMarkers.filter(m => {
    const latest = m.marker.values?.filter(v => v !== null).pop()!;
    return getStatus(latest, m.marker.refMin, m.marker.refMax) === 'normal';
  });

  $: totalCategories = Object.keys($activeData.categories).length;
  $: totalMarkers = allMarkers.length;
  $: totalDates = $activeData.dates.length;

  function latestValue(marker: ActiveMarker): number | null {
    return marker.values?.filter(v => v !== null).pop() ?? null;
  }
</script>

<div class="dashboard">
  <h2>Dashboard Overview</h2>
  <p class="subtitle">
    {#if totalMarkers > 0}
      Tracking {totalMarkers} markers across {totalCategories} categories · {totalDates} lab date{totalDates !== 1 ? 's' : ''}
    {:else}
      No data yet — import a lab PDF or load demo data to get started
    {/if}
  </p>

  {#if totalMarkers > 0}
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-val">{totalMarkers}</div>
        <div class="stat-lbl">Markers</div>
      </div>
      <div class="stat-card">
        <div class="stat-val red">{flaggedMarkers.length}</div>
        <div class="stat-lbl">Out of range</div>
      </div>
      <div class="stat-card">
        <div class="stat-val green">{normalMarkers.length}</div>
        <div class="stat-lbl">In range</div>
      </div>
      <div class="stat-card">
        <div class="stat-val">{totalDates}</div>
        <div class="stat-lbl">Lab dates</div>
      </div>
    </div>

    <ContextCards on:editCard />
    <Supplements />
    <GeneticsSection />

    <TrendAlerts on:openDetail />

    {#if flaggedMarkers.length > 0}
      <h3>Out of Range</h3>
      <div class="marker-grid">
        {#each flaggedMarkers as { key, catLabel, marker } (key)}
          {@const val = latestValue(marker)}
          {@const status = getStatus(val, marker.refMin, marker.refMax)}
          {@const trend = getTrend(marker.values || [], marker.refMin, marker.refMax)}
          <div class="marker-card {status}">
            <div class="marker-name">{marker.name}</div>
            <div class="marker-value">{formatValue(val)} <span class="marker-unit">{marker.unit}</span></div>
            <div class="marker-trend {trend.cls}">{trend.arrow}</div>
            <div class="marker-cat">{catLabel}</div>
          </div>
        {/each}
      </div>
    {/if}

    {#if normalMarkers.length > 0}
      <h3>In Range</h3>
      <div class="marker-grid">
        {#each normalMarkers as { key, catLabel, marker } (key)}
          {@const val = latestValue(marker)}
          <div class="marker-card normal">
            <div class="marker-name">{marker.name}</div>
            <div class="marker-value">{formatValue(val)} <span class="marker-unit">{marker.unit}</span></div>
            <div class="marker-cat">{catLabel}</div>
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="empty-state">
      <div class="empty-icon">📋</div>
      <p>Import your lab results to see your biomarker dashboard</p>
    </div>
  {/if}
</div>

<style>
  .dashboard { padding: 24px; }
  h2 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  h3 { font-size: 16px; font-weight: 600; margin: 24px 0 12px; color: var(--text2); }
  .subtitle { color: var(--text3); font-size: 14px; margin-bottom: 24px; }
  .stats-row { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 20px; min-width: 120px; }
  .stat-val { font-size: 28px; font-weight: 700; }
  .stat-val.red { color: var(--red); }
  .stat-val.green { color: var(--green); }
  .stat-lbl { font-size: 12px; color: var(--text3); }
  .marker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .marker-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; cursor: pointer; transition: all 0.15s; }
  .marker-card:hover { border-color: var(--accent); }
  .marker-card.high { border-left: 3px solid var(--red); }
  .marker-card.low { border-left: 3px solid var(--yellow); }
  .marker-card.normal { border-left: 3px solid var(--green); }
  .marker-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
  .marker-value { font-size: 20px; font-weight: 700; }
  .marker-unit { font-size: 12px; color: var(--text3); font-weight: 400; }
  .marker-trend { font-size: 12px; margin-top: 2px; }
  .marker-cat { font-size: 11px; color: var(--text3); margin-top: 4px; }
  .empty-state { text-align: center; padding: 80px 24px; color: var(--text3); }
  .empty-icon { font-size: 48px; margin-bottom: 16px; }

  :global(.trend-up.trend-bad) { color: var(--red); }
  :global(.trend-down.trend-bad) { color: var(--red); }
  :global(.trend-up.trend-good) { color: var(--green); }
  :global(.trend-down.trend-good) { color: var(--green); }
  :global(.trend-stable), :global(.trend-up.trend-neutral), :global(.trend-down.trend-neutral) { color: var(--text3); }
</style>
