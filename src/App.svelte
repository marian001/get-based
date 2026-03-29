<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './lib/Sidebar.svelte';
  import Dashboard from './lib/Dashboard.svelte';
  import CategoryView from './lib/CategoryView.svelte';
  import DetailModal from './lib/DetailModal.svelte';
  import Settings from './lib/Settings.svelte';
  import ManualEntry from './lib/ManualEntry.svelte';
  import { autoLoad, loadDemo } from './lib/loader';
  import { importedData } from './lib/stores';

  let activeCategory = 'dashboard';
  let detailMarker: string | null = null;
  let showSettings = false;
  let showManualEntry = false;
  let entryPreselect = '';
  let loading = true;

  onMount(() => {
    autoLoad();
    loading = false;
  });

  function navigate(e: CustomEvent) { activeCategory = e.detail; }
  function openDetail(e: CustomEvent) { detailMarker = e.detail; }

  async function demo(sex: 'male' | 'female') {
    await loadDemo(sex);
  }

  // Check if we have data
  $: hasData = Array.isArray($importedData.entries)
    ? ($importedData.entries as any[]).length > 0
    : Object.keys($importedData.entries || {}).length > 0;
</script>

{#if loading}
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;color:var(--text3)">Loading...</div>
{:else}
  <div class="app-layout">
    <Sidebar {activeCategory} on:navigate={navigate} on:settings={() => showSettings = true} on:addValue={() => { entryPreselect = ''; showManualEntry = true; }} on:openDetail={openDetail} />
    <main class="app-main">
      {#if !hasData && activeCategory === 'dashboard'}
        <div class="welcome">
          <h1>getbased</h1>
          <p class="welcome-sub">Blood work dashboard</p>
          <p class="welcome-note">Load demo data to explore, or import your own labs.</p>
          <div class="welcome-actions">
            <button class="btn-demo" on:click={() => demo('male')}>Load male demo</button>
            <button class="btn-demo" on:click={() => demo('female')}>Load female demo</button>
          </div>
          <p class="welcome-v2">v2 — Svelte + TypeScript rewrite</p>
        </div>
      {:else if activeCategory === 'dashboard'}
        <Dashboard />
      {:else}
        <CategoryView categoryKey={activeCategory} on:openDetail={openDetail} />
      {/if}
    </main>
  </div>

  {#if detailMarker}
    <DetailModal markerKey={detailMarker} on:close={() => detailMarker = null} on:addValue={e => { entryPreselect = e.detail; showManualEntry = true; }} />
  {/if}

  {#if showSettings}
    <Settings on:close={() => showSettings = false} />
  {/if}

  {#if showManualEntry}
    <ManualEntry preselectedMarker={entryPreselect} on:close={() => showManualEntry = false} />
  {/if}
{/if}

<style>
  .app-layout { display: flex; min-height: 100vh; }
  .app-main { margin-left: 220px; flex: 1; min-width: 0; }
  .welcome { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; text-align: center; padding: 24px; }
  .welcome h1 { font-size: 48px; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px; }
  .welcome-sub { font-size: 18px; color: var(--text2); margin-bottom: 32px; }
  .welcome-note { font-size: 14px; color: var(--text3); margin-bottom: 20px; }
  .welcome-actions { display: flex; gap: 12px; margin-bottom: 48px; }
  .btn-demo { padding: 12px 24px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 15px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .btn-demo:hover { border-color: var(--accent); color: var(--accent); }
  .welcome-v2 { font-size: 11px; color: var(--text3); font-family: var(--font-mono); }
</style>
