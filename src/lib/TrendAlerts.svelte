<script lang="ts">
  import { activeData } from './data';
  import { formatValue, linearRegression } from './utils';
  import { createEventDispatcher } from 'svelte';
  import type { ActiveMarker } from './types';

  const dispatch = createEventDispatcher();

  interface Alert {
    id: string;
    name: string;
    category: string;
    concern: string;
    spark: string[];
    direction: string;
  }

  $: alerts = detectAlerts();

  function detectAlerts(): Alert[] {
    const results: Alert[] = [];
    for (const [catKey, cat] of Object.entries($activeData.categories)) {
      for (const [mKey, marker] of Object.entries(cat.markers)) {
        const m = marker as ActiveMarker;
        const nonNull = (m.values || []).map((v, i) => ({ v: v!, i })).filter(x => x.v !== null);
        if (nonNull.length < 2) continue;
        if (m.refMin == null || m.refMax == null) continue;
        const range = m.refMax - m.refMin;
        if (range <= 0) continue;
        const id = `${catKey}.${mKey}`;
        const latest = nonNull[nonNull.length - 1].v;
        const prev = nonNull[nonNull.length - 2].v;
        const spark = nonNull.slice(-5).map(x => formatValue(x.v));

        // Sudden change (>25% of range)
        if (Math.abs(latest - prev) > range * 0.25) {
          if (latest > m.refMax) { results.push({ id, name: m.name, category: cat.label, concern: 'sudden_high', spark, direction: 'rising' }); continue; }
          if (latest < m.refMin) { results.push({ id, name: m.name, category: cat.label, concern: 'sudden_low', spark, direction: 'falling' }); continue; }
        }

        // Regression trend (3+ values)
        if (nonNull.length < 3) continue;
        const vals = nonNull.map(x => x.v);
        const reg = linearRegression(vals);
        const normSlope = reg.slope / range;
        if (Math.abs(normSlope) < 0.02) continue;
        if (nonNull.length >= 4 && reg.r2 < 0.5) continue;
        const rising = normSlope > 0;
        let concern: string | null = null;
        if (rising && latest > m.refMax) concern = 'past_high';
        else if (!rising && latest < m.refMin) concern = 'past_low';
        else if (rising && latest >= m.refMax - range * 0.15) concern = 'approaching_high';
        else if (!rising && latest <= m.refMin + range * 0.15) concern = 'approaching_low';
        if (!concern) continue;
        results.push({ id, name: m.name, category: cat.label, concern, spark, direction: rising ? 'rising' : 'falling' });
      }
    }
    results.sort((a, b) => {
      const p = (c: string) => c.startsWith('sudden_') ? 0 : c.startsWith('past_') ? 1 : 2;
      return p(a.concern) - p(b.concern);
    });
    return results;
  }

  function concernLabel(c: string): string {
    if (c === 'sudden_high') return 'Sudden rise above range';
    if (c === 'sudden_low') return 'Sudden drop below range';
    if (c === 'past_high') return 'Above range & rising';
    if (c === 'past_low') return 'Below range & falling';
    if (c === 'approaching_high') return 'Approaching upper limit';
    return 'Approaching lower limit';
  }

  function concernClass(c: string): string {
    if (c.startsWith('sudden_')) return 'alert-urgent';
    if (c.startsWith('past_')) return 'alert-warn';
    return 'alert-watch';
  }
</script>

{#if alerts.length > 0}
  <div class="alerts-section">
    <h3>Trends & Alerts</h3>
    <div class="alerts-grid">
      {#each alerts as alert (alert.id)}
        <button class="alert-card {concernClass(alert.concern)}" on:click={() => dispatch('openDetail', alert.id)}>
          <div class="alert-arrow">{alert.direction === 'rising' ? '↑' : '↓'}</div>
          <div class="alert-info">
            <div class="alert-name">{alert.name} <span class="alert-cat">{alert.category}</span></div>
            <div class="alert-concern">{concernLabel(alert.concern)}</div>
            <div class="alert-spark">{alert.spark.join(' → ')}</div>
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .alerts-section { margin-bottom: 24px; }
  h3 { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px; }
  .alerts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
  .alert-card { display: flex; gap: 12px; padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; text-align: left; font-family: inherit; color: var(--text-primary); transition: all 0.15s; width: 100%; }
  .alert-card:hover { border-color: var(--accent); }
  .alert-card.alert-urgent { border-left: 4px solid var(--red); }
  .alert-card.alert-warn { border-left: 4px solid var(--yellow); }
  .alert-card.alert-watch { border-left: 4px solid var(--orange); }
  .alert-arrow { font-size: 20px; font-weight: 700; flex-shrink: 0; width: 24px; text-align: center; }
  .alert-urgent .alert-arrow { color: var(--red); }
  .alert-warn .alert-arrow { color: var(--yellow); }
  .alert-watch .alert-arrow { color: var(--orange); }
  .alert-info { flex: 1; min-width: 0; }
  .alert-name { font-size: 13px; font-weight: 600; }
  .alert-cat { font-size: 11px; color: var(--text-muted); font-weight: 400; margin-left: 4px; }
  .alert-concern { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
  .alert-spark { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 2px; }
</style>
