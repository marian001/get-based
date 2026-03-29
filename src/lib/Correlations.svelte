<script lang="ts">
  import { activeData } from './data';
  import { createEventDispatcher } from 'svelte';
  import type { ActiveMarker } from './types';

  const dispatch = createEventDispatcher();

  interface MarkerEntry { key: string; name: string; values: (number | null)[]; }

  // Get markers with 3+ data points for correlation
  $: markers = (() => {
    const list: MarkerEntry[] = [];
    for (const [catKey, cat] of Object.entries($activeData.categories)) {
      for (const [mKey, marker] of Object.entries(cat.markers)) {
        const m = marker as ActiveMarker;
        const nonNull = (m.values || []).filter(v => v !== null);
        if (nonNull.length >= 3) {
          list.push({ key: `${catKey}.${mKey}`, name: m.name, values: m.values || [] });
        }
      }
    }
    return list;
  })();

  // Pearson correlation between two aligned value arrays
  function correlate(a: (number | null)[], b: (number | null)[]): number | null {
    const pairs: [number, number][] = [];
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== null && b[i] !== null) pairs.push([a[i]!, b[i]!]);
    }
    if (pairs.length < 3) return null;
    const n = pairs.length;
    let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
    for (const [x, y] of pairs) { sx += x; sy += y; sxy += x * y; sx2 += x * x; sy2 += y * y; }
    const denom = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy));
    if (denom === 0) return null;
    return (n * sxy - sx * sy) / denom;
  }

  // Compute correlation matrix
  $: matrix = markers.map(a => markers.map(b => a.key === b.key ? 1 : correlate(a.values, b.values)));

  // Find strong correlations
  $: strongPairs = (() => {
    const pairs: { a: string; b: string; r: number }[] = [];
    for (let i = 0; i < markers.length; i++) {
      for (let j = i + 1; j < markers.length; j++) {
        const r = matrix[i][j];
        if (r !== null && Math.abs(r) >= 0.7) {
          pairs.push({ a: markers[i].name, b: markers[j].name, r });
        }
      }
    }
    return pairs.sort((a, b) => Math.abs(b.r) - Math.abs(a.r)).slice(0, 20);
  })();

  function cellColor(r: number | null): string {
    if (r === null) return 'transparent';
    if (r > 0.7) return 'rgba(52,211,153,0.4)';
    if (r > 0.3) return 'rgba(52,211,153,0.15)';
    if (r < -0.7) return 'rgba(248,113,113,0.4)';
    if (r < -0.3) return 'rgba(248,113,113,0.15)';
    return 'transparent';
  }
</script>

<div class="correlations">
  <h2>Correlations</h2>
  <p class="subtitle">{markers.length} markers with 3+ data points</p>

  {#if markers.length < 2}
    <p style="color:var(--text3)">Need at least 2 markers with 3+ values for correlations.</p>
  {:else}
    {#if strongPairs.length > 0}
      <h3>Strong Correlations</h3>
      <div class="pairs">
        {#each strongPairs as pair}
          <div class="pair" class:positive={pair.r > 0} class:negative={pair.r < 0}>
            <span class="pair-markers">{pair.a} ↔ {pair.b}</span>
            <span class="pair-r">r = {pair.r.toFixed(2)}</span>
          </div>
        {/each}
      </div>
    {/if}

    <h3>Heatmap</h3>
    <div class="heatmap-scroll">
      <table class="heatmap">
        <thead>
          <tr>
            <th></th>
            {#each markers as m}<th class="heatmap-th" title={m.name}>{m.name.slice(0, 6)}</th>{/each}
          </tr>
        </thead>
        <tbody>
          {#each markers as row, i}
            <tr>
              <td class="heatmap-label">{row.name}</td>
              {#each matrix[i] as r, j}
                <td class="heatmap-cell" style="background:{cellColor(r)}" title="{row.name} ↔ {markers[j].name}: {r !== null ? r.toFixed(2) : 'n/a'}">
                  {#if r !== null && i !== j}{r.toFixed(1)}{/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .correlations { padding: 24px; }
  h2 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  h3 { font-size: 14px; font-weight: 600; color: var(--text2); margin: 20px 0 8px; }
  .subtitle { color: var(--text3); font-size: 14px; margin-bottom: 16px; }
  .pairs { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .pair { display: flex; justify-content: space-between; padding: 8px 12px; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; font-size: 13px; }
  .pair.positive { border-left: 3px solid var(--green); }
  .pair.negative { border-left: 3px solid var(--red); }
  .pair-markers { font-weight: 500; }
  .pair-r { font-family: var(--font-mono); color: var(--text2); }
  .heatmap-scroll { overflow-x: auto; }
  .heatmap { border-collapse: collapse; font-size: 10px; }
  .heatmap th, .heatmap td { padding: 3px 4px; border: 1px solid var(--border); text-align: center; }
  .heatmap-th { writing-mode: vertical-rl; transform: rotate(180deg); max-width: 24px; color: var(--text3); font-weight: 500; }
  .heatmap-label { text-align: right; white-space: nowrap; color: var(--text2); font-weight: 500; padding-right: 8px; }
  .heatmap-cell { width: 28px; height: 28px; font-family: var(--font-mono); color: var(--text3); }
</style>
