<script lang="ts">
  import { activeData } from './data';
  import { countFlagged } from './data';
  import { createEventDispatcher } from 'svelte';
  import ImportExport from './ImportExport.svelte';
  import Search from './Search.svelte';
  import SyncIndicator from './SyncIndicator.svelte';

  export let activeCategory: string = 'dashboard';
  const dispatch = createEventDispatcher();

  $: categories = Object.entries($activeData.categories).map(([key, cat]) => {
    const flagged = countFlagged(cat.markers);
    return { key, label: cat.label, icon: cat.icon, flagged };
  });
</script>

<nav class="sidebar">
  <Search on:select={e => dispatch('openDetail', e.detail)} />

  <button class="nav-item" class:active={activeCategory === 'dashboard'} on:click={() => dispatch('navigate', 'dashboard')}>
    <span class="nav-icon">📊</span><span class="nav-label">Dashboard</span>
  </button>

  <div class="nav-divider"></div>

  {#each categories as cat (cat.key)}
    <button class="nav-item" class:active={activeCategory === cat.key} on:click={() => dispatch('navigate', cat.key)}>
      <span class="nav-icon">{cat.icon}</span>
      <span class="nav-label">{cat.label}</span>
      {#if cat.flagged > 0}<span class="nav-badge">{cat.flagged}</span>{/if}
    </button>
  {/each}

  <div class="nav-divider"></div>

  <button class="nav-item" class:active={activeCategory === 'compare'} on:click={() => dispatch('navigate', 'compare')}>
    <span class="nav-icon">🔄</span><span class="nav-label">Compare Dates</span>
  </button>
  <button class="nav-item" class:active={activeCategory === 'correlations'} on:click={() => dispatch('navigate', 'correlations')}>
    <span class="nav-icon">📈</span><span class="nav-label">Correlations</span>
  </button>
  <button class="nav-item" on:click={() => dispatch('glossary')}>
    <span class="nav-icon">📖</span><span class="nav-label">Glossary</span>
  </button>

  <div class="nav-divider"></div>

  <button class="nav-item" on:click={() => dispatch('importPdf')}>
    <span class="nav-icon">📄</span><span class="nav-label">Import PDF</span>
  </button>
  <button class="nav-item" on:click={() => dispatch('addValue')}>
    <span class="nav-icon">➕</span><span class="nav-label">Add Value</span>
  </button>
  <button class="nav-item" on:click={() => dispatch('settings')}>
    <span class="nav-icon">⚙️</span><span class="nav-label">Settings</span>
  </button>

  <div class="nav-bottom">
    <SyncIndicator />
    <ImportExport />
  </div>
</nav>

<style>
  /* Use v1's global .sidebar styles, only override what's needed */
  .nav-bottom { margin-top: auto; border-top: 1px solid var(--border); padding-top: 6px; }
</style>
