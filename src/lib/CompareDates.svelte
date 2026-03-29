<script lang="ts">
  import { activeData } from './data';
  import { formatValue, getStatus } from './utils';
  import type { ActiveMarker } from './types';

  $: dates = $activeData.dates;
  $: dateLabels = $activeData.dateLabels;

  let date1Idx = dates.length >= 2 ? dates.length - 2 : 0;
  let date2Idx = dates.length >= 1 ? dates.length - 1 : 0;

  $: comparisons = (() => {
    const results: { key: string; catLabel: string; name: string; unit: string; val1: number | null; val2: number | null; change: number | null; status1: string; status2: string }[] = [];
    for (const [catKey, cat] of Object.entries($activeData.categories)) {
      for (const [mKey, marker] of Object.entries(cat.markers)) {
        const m = marker as ActiveMarker;
        const val1 = m.values?.[date1Idx] ?? null;
        const val2 = m.values?.[date2Idx] ?? null;
        if (val1 === null && val2 === null) continue;
        const change = (val1 !== null && val2 !== null && val1 !== 0) ? ((val2 - val1) / val1) * 100 : null;
        results.push({
          key: `${catKey}.${mKey}`, catLabel: cat.label, name: m.name, unit: m.unit,
          val1, val2, change,
          status1: getStatus(val1, m.refMin, m.refMax),
          status2: getStatus(val2, m.refMin, m.refMax),
        });
      }
    }
    // Sort by absolute change descending
    return results.sort((a, b) => Math.abs(b.change ?? 0) - Math.abs(a.change ?? 0));
  })();
</script>

<div class="compare">
  <h2>Compare Dates</h2>

  {#if dates.length < 2}
    <p style="color:var(--text3)">Need at least 2 lab dates to compare.</p>
  {:else}
    <div class="date-pickers">
      <div class="picker">
        <label for="d1">From</label>
        <select id="d1" bind:value={date1Idx}>
          {#each dateLabels as dl, i}
            <option value={i}>{dl}</option>
          {/each}
        </select>
      </div>
      <span class="arrow">→</span>
      <div class="picker">
        <label for="d2">To</label>
        <select id="d2" bind:value={date2Idx}>
          {#each dateLabels as dl, i}
            <option value={i}>{dl}</option>
          {/each}
        </select>
      </div>
    </div>

    <table class="compare-table">
      <thead>
        <tr>
          <th>Marker</th>
          <th class="center">{dateLabels[date1Idx]}</th>
          <th class="center">{dateLabels[date2Idx]}</th>
          <th class="center">Change</th>
        </tr>
      </thead>
      <tbody>
        {#each comparisons as c (c.key)}
          <tr>
            <td class="name-cell">{c.name} <span class="unit-hint">{c.unit}</span></td>
            <td class="val-cell {c.status1}">{formatValue(c.val1)}</td>
            <td class="val-cell {c.status2}">{formatValue(c.val2)}</td>
            <td class="change-cell" class:positive={c.change !== null && c.change > 0} class:negative={c.change !== null && c.change < 0}>
              {#if c.change !== null}
                {c.change > 0 ? '+' : ''}{c.change.toFixed(1)}%
              {:else}
                —
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .compare { padding: 24px; }
  h2 { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
  .date-pickers { display: flex; gap: 12px; align-items: end; margin-bottom: 20px; }
  .picker label { display: block; font-size: 12px; color: var(--text3); margin-bottom: 4px; }
  .picker select { background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 8px 12px; border-radius: 6px; font-size: 14px; font-family: inherit; }
  .picker select:focus { outline: none; border-color: var(--accent); }
  .arrow { color: var(--text3); font-size: 18px; padding-bottom: 8px; }
  .compare-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .compare-table th { text-align: left; padding: 8px 12px; border-bottom: 2px solid var(--border); color: var(--text3); font-weight: 600; font-size: 11px; text-transform: uppercase; }
  .compare-table td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
  .center { text-align: center; }
  .name-cell { font-weight: 500; white-space: nowrap; }
  .unit-hint { font-size: 11px; color: var(--text3); font-weight: 400; }
  .val-cell { text-align: center; font-family: var(--font-mono); }
  .val-cell.high { color: var(--red); }
  .val-cell.low { color: var(--yellow); }
  .val-cell.normal { color: var(--green); }
  .change-cell { text-align: center; font-family: var(--font-mono); font-weight: 600; }
  .change-cell.positive { color: var(--red); }
  .change-cell.negative { color: var(--green); }
</style>
