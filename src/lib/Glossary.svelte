<script lang="ts">
  import { activeData } from './data';
  import { formatValue, getStatus } from './utils';
  import { createEventDispatcher } from 'svelte';
  import type { ActiveMarker } from './types';

  const dispatch = createEventDispatcher();
  let search = '';

  $: allMarkers = Object.entries($activeData.categories).flatMap(([catKey, cat]) =>
    Object.entries(cat.markers).map(([mKey, marker]) => ({
      key: `${catKey}.${mKey}`,
      catLabel: cat.label,
      catIcon: cat.icon,
      marker: marker as ActiveMarker,
      latest: (marker as ActiveMarker).values?.filter(v => v !== null).pop() ?? null,
    }))
  );

  $: filtered = search.trim().length >= 2
    ? allMarkers.filter(m => m.marker.name.toLowerCase().includes(search.toLowerCase()) || m.catLabel.toLowerCase().includes(search.toLowerCase()) || m.key.toLowerCase().includes(search.toLowerCase()))
    : allMarkers;

  // Group by category
  $: grouped = (() => {
    const map = new Map<string, typeof filtered>();
    for (const m of filtered) {
      if (!map.has(m.catLabel)) map.set(m.catLabel, []);
      map.get(m.catLabel)!.push(m);
    }
    return [...map.entries()];
  })();

  function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') dispatch('close'); }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="modal-backdrop" on:click|self={() => dispatch('close')} role="dialog" tabindex="-1">
  <div class="glossary-modal">
    <button class="modal-close" on:click={() => dispatch('close')}>&times;</button>
    <h2>Marker Glossary</h2>
    <input class="glossary-search" type="text" placeholder="Search markers..." bind:value={search} autofocus />

    <div class="glossary-body">
      {#each grouped as [catLabel, markers] (catLabel)}
        <div class="glossary-cat">
          <h3>{markers[0].catIcon} {catLabel}</h3>
          {#each markers as m (m.key)}
            {@const status = getStatus(m.latest, m.marker.refMin, m.marker.refMax)}
            <button class="glossary-row" on:click={() => { dispatch('openDetail', m.key); dispatch('close'); }}>
              <div class="glossary-name">
                <span class="status-dot {status}"></span>
                {m.marker.name}
              </div>
              <div class="glossary-meta">
                {#if m.latest !== null}
                  <span class="glossary-val {status}">{formatValue(m.latest)}</span>
                {/if}
                <span class="glossary-unit">{m.marker.unit}</span>
                {#if m.marker.refMin != null}
                  <span class="glossary-ref">{m.marker.refMin}–{m.marker.refMax}</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {/each}
      {#if filtered.length === 0}
        <p style="color:var(--text3);text-align:center;padding:24px">No markers match "{search}"</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px; overflow-y: auto; }
  .glossary-modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 600px; position: relative; }
  .modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; color: var(--text3); font-size: 24px; cursor: pointer; }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
  h3 { font-size: 14px; font-weight: 600; color: var(--text2); margin: 16px 0 6px; }
  .glossary-search { width: 100%; background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 10px 12px; border-radius: 6px; font-size: 14px; font-family: inherit; margin-bottom: 8px; }
  .glossary-search:focus { outline: none; border-color: var(--accent); }
  .glossary-body { max-height: 60vh; overflow-y: auto; }
  .glossary-row { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 6px 10px; background: none; border: none; border-bottom: 1px solid var(--border); color: var(--text); font-size: 13px; cursor: pointer; font-family: inherit; text-align: left; transition: background 0.1s; }
  .glossary-row:hover { background: var(--surface); }
  .glossary-name { display: flex; align-items: center; gap: 6px; font-weight: 500; }
  .glossary-meta { display: flex; gap: 8px; align-items: center; }
  .glossary-val { font-family: var(--font-mono); font-weight: 600; }
  .glossary-val.high { color: var(--red); }
  .glossary-val.low { color: var(--yellow); }
  .glossary-val.normal { color: var(--green); }
  .glossary-unit { color: var(--text3); font-size: 11px; }
  .glossary-ref { color: var(--text3); font-size: 11px; }
  .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; }
  .status-dot.high { background: var(--red); }
  .status-dot.low { background: var(--yellow); }
  .status-dot.normal { background: var(--green); }
  .status-dot.missing { background: var(--text3); }
</style>
