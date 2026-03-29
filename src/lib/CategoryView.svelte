<script lang="ts">
  import { activeData } from './data';
  import { getStatus, formatValue, getTrend } from './utils';
  import { createEventDispatcher } from 'svelte';
  import type { ActiveMarker } from './types';

  export let categoryKey: string;
  const dispatch = createEventDispatcher();

  $: category = $activeData.categories[categoryKey];
  $: markers = category ? Object.entries(category.markers).map(([key, m]) => ({
    key: `${categoryKey}.${key}`,
    mKey: key,
    marker: m as ActiveMarker,
    latest: (m as ActiveMarker).values?.filter(v => v !== null).pop() ?? null,
  })) : [];

  // Sort: flagged first, then by name
  $: sorted = [...markers].sort((a, b) => {
    const sa = getStatus(a.latest, a.marker.refMin, a.marker.refMax);
    const sb = getStatus(b.latest, b.marker.refMin, b.marker.refMax);
    const order = { high: 0, low: 1, normal: 2, missing: 3 };
    const diff = (order[sa] ?? 3) - (order[sb] ?? 3);
    if (diff !== 0) return diff;
    return a.marker.name.localeCompare(b.marker.name);
  });
</script>

{#if category}
  <div class="category-view">
    <h2>{category.icon} {category.label}</h2>
    <p class="subtitle">{markers.length} marker{markers.length !== 1 ? 's' : ''} · {$activeData.dates.length} lab date{$activeData.dates.length !== 1 ? 's' : ''}</p>

    <table class="marker-table">
      <thead>
        <tr>
          <th>Marker</th>
          {#each $activeData.dateLabels as dl}
            <th class="date-col">{dl}</th>
          {/each}
          <th class="date-col">Ref Range</th>
          <th class="date-col">Trend</th>
        </tr>
      </thead>
      <tbody>
        {#each sorted as { key, marker, latest } (key)}
          {@const status = getStatus(latest, marker.refMin, marker.refMax)}
          {@const trend = getTrend(marker.values || [], marker.refMin, marker.refMax)}
          <tr class="marker-row {status}" on:click={() => dispatch('openDetail', key)}>
            <td class="marker-name-cell">
              <span class="status-dot {status}"></span>
              {marker.name}
              <span class="marker-unit-small">{marker.unit}</span>
            </td>
            {#each marker.values || [] as val}
              <td class="val-cell" class:flagged={val !== null && getStatus(val, marker.refMin, marker.refMax) !== 'normal'}>
                {formatValue(val)}
              </td>
            {/each}
            <td class="ref-cell">
              {#if marker.refMin != null && marker.refMax != null}
                {formatValue(marker.refMin)} – {formatValue(marker.refMax)}
              {:else}
                —
              {/if}
            </td>
            <td class="trend-cell {trend.cls}">{trend.arrow}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <div style="padding:24px;color:var(--text3)">Category not found</div>
{/if}

<style>
  .category-view { padding: 24px; }
  h2 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .subtitle { color: var(--text3); font-size: 14px; margin-bottom: 20px; }
  .marker-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .marker-table th { text-align: left; padding: 8px 12px; border-bottom: 2px solid var(--border); color: var(--text3); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; }
  .marker-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
  .marker-row { cursor: pointer; transition: background 0.1s; }
  .marker-row:hover { background: var(--surface); }
  .marker-name-cell { font-weight: 600; white-space: nowrap; }
  .marker-unit-small { font-size: 11px; color: var(--text3); font-weight: 400; margin-left: 4px; }
  .date-col { text-align: center; }
  .val-cell { text-align: center; font-family: var(--font-mono); font-size: 13px; }
  .val-cell.flagged { color: var(--red); font-weight: 600; }
  .ref-cell { text-align: center; color: var(--text3); font-size: 12px; }
  .trend-cell { text-align: center; font-size: 12px; }
  .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; vertical-align: middle; }
  .status-dot.high { background: var(--red); }
  .status-dot.low { background: var(--yellow); }
  .status-dot.normal { background: var(--green); }
  .status-dot.missing { background: var(--text3); }
</style>
