<script lang="ts">
  import { activeData } from './data';
  import { getStatus, formatValue } from './utils';
  import { createEventDispatcher } from 'svelte';
  import type { ActiveMarker } from './types';

  const dispatch = createEventDispatcher();

  let query = '';
  let focused = false;

  interface SearchResult {
    key: string;
    catKey: string;
    catLabel: string;
    catIcon: string;
    name: string;
    unit: string;
    latest: number | null;
    status: string;
  }

  $: results = (() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const matches: SearchResult[] = [];
    for (const [catKey, cat] of Object.entries($activeData.categories)) {
      for (const [mKey, marker] of Object.entries(cat.markers)) {
        const m = marker as ActiveMarker;
        if (m.name.toLowerCase().includes(q) || mKey.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)) {
          const latest = m.values?.filter(v => v !== null).pop() ?? null;
          matches.push({
            key: `${catKey}.${mKey}`, catKey, catLabel: cat.label, catIcon: cat.icon,
            name: m.name, unit: m.unit, latest,
            status: getStatus(latest, m.refMin, m.refMax),
          });
        }
      }
    }
    return matches.slice(0, 12);
  })();

  function select(key: string) {
    dispatch('select', key);
    query = '';
    focused = false;
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { query = ''; focused = false; }
  }
</script>

<div class="search-wrap">
  <input
    class="search-input"
    type="text"
    placeholder="Search markers..."
    bind:value={query}
    on:focus={() => focused = true}
    on:blur={() => setTimeout(() => focused = false, 200)}
    on:keydown={onKeydown}
  />
  {#if focused && results.length > 0}
    <div class="search-results">
      {#each results as r (r.key)}
        <button class="search-item" on:mousedown|preventDefault={() => select(r.key)}>
          <span class="search-icon">{r.catIcon}</span>
          <div class="search-info">
            <span class="search-name">{r.name}</span>
            <span class="search-cat">{r.catLabel}</span>
          </div>
          {#if r.latest !== null}
            <span class="search-val {r.status}">{formatValue(r.latest)} {r.unit}</span>
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .search-wrap { position: relative; padding: 8px 12px; }
  .search-input { width: 100%; background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 8px 10px; border-radius: 6px; font-size: 13px; font-family: inherit; }
  .search-input:focus { outline: none; border-color: var(--accent); }
  .search-input::placeholder { color: var(--text3); }
  .search-results { position: absolute; left: 12px; right: 12px; top: 100%; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; z-index: 50; box-shadow: var(--shadow-lg); max-height: 360px; overflow-y: auto; }
  .search-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 12px; background: none; border: none; border-bottom: 1px solid var(--border); color: var(--text); font-size: 13px; cursor: pointer; font-family: inherit; text-align: left; }
  .search-item:hover { background: var(--surface); }
  .search-item:last-child { border-bottom: none; }
  .search-icon { font-size: 14px; flex-shrink: 0; }
  .search-info { flex: 1; min-width: 0; }
  .search-name { font-weight: 600; }
  .search-cat { font-size: 11px; color: var(--text3); margin-left: 6px; }
  .search-val { font-size: 12px; font-family: var(--font-mono); flex-shrink: 0; }
  .search-val.high { color: var(--red); }
  .search-val.low { color: var(--yellow); }
  .search-val.normal { color: var(--green); }
</style>
