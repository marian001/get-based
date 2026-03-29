<script lang="ts">
  import { activeData } from './data';
  import { countFlagged } from './data';
  import { createEventDispatcher } from 'svelte';
  import ImportExport from './ImportExport.svelte';
  import Search from './Search.svelte';
  import SyncIndicator from './SyncIndicator.svelte';

  const dispatch = createEventDispatcher();

  export let activeCategory: string = 'dashboard';

  $: categories = Object.entries($activeData.categories).map(([key, cat]) => {
    const flagged = countFlagged(cat.markers);
    const total = Object.keys(cat.markers).length;
    return { key, label: cat.label, icon: cat.icon, flagged, total };
  });
</script>

<nav class="sidebar">
  <Search on:select={e => dispatch('openDetail', e.detail)} />

  <button
    class="nav-item" class:active={activeCategory === 'dashboard'}
    on:click={() => dispatch('navigate', 'dashboard')}>
    <span class="nav-icon">📊</span>
    <span class="nav-label">Dashboard</span>
  </button>

  <div class="nav-divider"></div>

  {#each categories as cat (cat.key)}
    <button
      class="nav-item" class:active={activeCategory === cat.key}
      on:click={() => dispatch('navigate', cat.key)}>
      <span class="nav-icon">{cat.icon}</span>
      <span class="nav-label">{cat.label}</span>
      {#if cat.flagged > 0}
        <span class="nav-badge">{cat.flagged}</span>
      {/if}
    </button>
  {/each}
  <div class="nav-divider"></div>

  <div class="nav-divider"></div>

  <button class="nav-item" class:active={activeCategory === 'compare'} on:click={() => dispatch('navigate', 'compare')}>
    <span class="nav-icon">🔄</span>
    <span class="nav-label">Compare Dates</span>
  </button>
  <button class="nav-item" class:active={activeCategory === 'correlations'} on:click={() => dispatch('navigate', 'correlations')}>
    <span class="nav-icon">📈</span>
    <span class="nav-label">Correlations</span>
  </button>
  <button class="nav-item" on:click={() => dispatch('glossary')}>
    <span class="nav-icon">📖</span>
    <span class="nav-label">Glossary</span>
  </button>
  <button class="nav-item" on:click={() => dispatch('importPdf')}>
    <span class="nav-icon">📄</span>
    <span class="nav-label">Import PDF</span>
  </button>
  <button class="nav-item" on:click={() => dispatch('addValue')}>
    <span class="nav-icon">➕</span>
    <span class="nav-label">Add Value</span>
  </button>
  <button class="nav-item" on:click={() => dispatch('settings')}>
    <span class="nav-icon">⚙️</span>
    <span class="nav-label">Settings</span>
  </button>

  <div class="nav-bottom">
    <SyncIndicator />
    <ImportExport />
  </div>
</nav>

<style>
  .sidebar { width: 220px; background: var(--bg2); border-right: 1px solid var(--border); padding: 12px 0; height: 100vh; overflow-y: auto; position: fixed; left: 0; top: 0; display: flex; flex-direction: column; }
  .nav-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 16px; background: none; border: none; color: var(--text2); font-size: 13px; cursor: pointer; font-family: inherit; text-align: left; transition: all 0.15s; }
  .nav-item:hover { color: var(--text); background: var(--surface); }
  .nav-item.active { color: var(--accent); background: rgba(79,140,255,0.08); border-right: 2px solid var(--accent); }
  .nav-icon { font-size: 16px; width: 24px; text-align: center; flex-shrink: 0; }
  .nav-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nav-badge { background: var(--red); color: white; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 10px; }
  .nav-divider { height: 1px; background: var(--border); margin: 8px 16px; }
  .nav-bottom { margin-top: auto; border-top: 1px solid var(--border); padding-top: 8px; }
</style>
