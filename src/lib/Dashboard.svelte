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
          <button class="chart-card status-{status}" on:click={() => dispatch('openDetail', key)}>
            <div class="chart-card-header"><div><span class="chart-card-name">{marker.name}</span></div></div>
            <div class="chart-card-value">{formatValue(val)} <span class="chart-card-unit">{marker.unit}</span></div>
            <div class="chart-card-trend {trend.cls}">{trend.arrow}</div>
            <div class="chart-card-cat">{catLabel}</div>
          </button>
        {/each}
      </div>
    {/if}

    {#if normalMarkers.length > 0}
      <h3>In Range</h3>
      <div class="marker-grid">
        {#each normalMarkers as { key, catLabel, marker } (key)}
          {@const val = latestValue(marker)}
          <button class="chart-card status-normal" on:click={() => dispatch('openDetail', key)}>
            <div class="chart-card-header"><div><span class="chart-card-name">{marker.name}</span></div></div>
            <div class="chart-card-value">{formatValue(val)} <span class="chart-card-unit">{marker.unit}</span></div>
            <div class="chart-card-cat">{catLabel}</div>
          </button>
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
  .dashboard { padding: 24px 32px; }
  .dashboard h2 { font-family: var(--font-display); font-size: 22px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.3px; }
  .dashboard h3 { font-size: 14px; font-weight: 600; margin: 28px 0 12px; color: var(--text-secondary); }
  .subtitle { color: var(--text-muted); font-size: 13px; margin-bottom: 20px; }
  .stats-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 18px; min-width: 100px; }
  .stat-val { font-size: 24px; font-weight: 800; font-family: var(--font-display); }
  .stat-val.red { color: var(--red); }
  .stat-val.green { color: var(--green); }
  .stat-lbl { font-size: 11px; color: var(--text-muted); }
  .marker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)); gap: 12px; }
  .chart-card {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 16px 18px; cursor: pointer; transition: all 0.2s; text-align: left;
    font-family: inherit; color: var(--text-primary); width: 100%; min-width: 0; overflow: hidden;
  }
  .chart-card:hover { border-color: var(--accent); transform: translateY(-1px); box-shadow: var(--shadow-lg); }
  .status-high { border-left: 4px solid var(--red); }
  .status-low { border-left: 4px solid var(--yellow); }
  .status-normal { border-left: 4px solid var(--green); }
  .chart-card-name { font-size: 13px; font-weight: 600; }
  .chart-card-value { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; margin: 4px 0 2px; }
  .chart-card-unit { font-size: 11px; color: var(--text-muted); font-weight: 400; }
  .chart-card-trend { font-size: 12px; }
  .chart-card-cat { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
  .empty-state { text-align: center; padding: 80px 24px; color: var(--text-muted); }
  .empty-icon { font-size: 48px; margin-bottom: 16px; }
</style>
