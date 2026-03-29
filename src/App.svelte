<script lang="ts">
  import { onMount } from 'svelte';
  import Sidebar from './lib/Sidebar.svelte';
  import Dashboard from './lib/Dashboard.svelte';
  import CategoryView from './lib/CategoryView.svelte';
  import CompareDates from './lib/CompareDates.svelte';
  import Correlations from './lib/Correlations.svelte';
  import DetailModal from './lib/DetailModal.svelte';
  import Settings from './lib/Settings.svelte';
  import Glossary from './lib/Glossary.svelte';
  import ManualEntry from './lib/ManualEntry.svelte';
  import CardEditor from './lib/CardEditor.svelte';
  import ChatPanel from './lib/ChatPanel.svelte';
  import PdfImport from './lib/PdfImport.svelte';
  import { autoLoad, loadDemo } from './lib/loader';
  import { importedData } from './lib/stores';

  let activeCategory = 'dashboard';
  let detailMarker: string | null = null;
  let showSettings = false;
  let showGlossary = false;
  let showManualEntry = false;
  let entryPreselect = '';
  let showCardEditor = false;
  let editingCard = '';
  let showPdfImport = false;
  let loading = true;

  const CARD_LABELS: Record<string, string> = {
    healthGoals: 'Health Goals', diagnoses: 'Medical Conditions', diet: 'Diet & Digestion',
    exercise: 'Exercise', sleepRest: 'Sleep & Rest', lightCircadian: 'Light & Circadian',
    stress: 'Stress', loveLife: 'Love Life', environment: 'Environment',
  };

  onMount(() => { autoLoad(); loading = false; });

  function navigate(e: CustomEvent) { activeCategory = e.detail; }
  function openDetail(e: CustomEvent) { detailMarker = e.detail; }

  async function demo(sex: 'male' | 'female') { await loadDemo(sex); }

  $: hasData = Array.isArray($importedData.entries)
    ? ($importedData.entries as any[]).length > 0
    : Object.keys($importedData.entries || {}).length > 0;
</script>

{#if loading}
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;color:var(--text3)">Loading...</div>
{:else}
  <header class="header">
    <h1>getbased</h1>
    <div class="header-info">
      <span style="font-size:11px;color:var(--accent);background:rgba(79,140,255,0.1);padding:2px 8px;border-radius:4px;font-family:var(--font-mono)">v2</span>
    </div>
  </header>

  <div class="layout">
    <Sidebar {activeCategory}
      on:navigate={navigate}
      on:settings={() => showSettings = true}
      on:glossary={() => showGlossary = true}
      on:addValue={() => { entryPreselect = ''; showManualEntry = true; }}
      on:importPdf={() => showPdfImport = true}
      on:openDetail={openDetail} />
    <main class="content">
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
        <Dashboard on:openDetail={openDetail} on:editCard={e => { editingCard = e.detail; showCardEditor = true; }} />
      {:else if activeCategory === 'compare'}
        <CompareDates />
      {:else if activeCategory === 'correlations'}
        <Correlations />
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
  {#if showGlossary}
    <Glossary on:close={() => showGlossary = false} on:openDetail={e => { detailMarker = e.detail; }} />
  {/if}
  {#if showManualEntry}
    <ManualEntry preselectedMarker={entryPreselect} on:close={() => showManualEntry = false} />
  {/if}
  {#if showCardEditor}
    <CardEditor cardKey={editingCard} label={CARD_LABELS[editingCard] || editingCard} on:close={() => showCardEditor = false} />
  {/if}

  {#if showPdfImport}
    <PdfImport on:close={() => showPdfImport = false} />
  {/if}

  <ChatPanel />
{/if}

<style>
  .welcome { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; text-align: center; padding: 24px; }
  .welcome h1 { font-family: var(--font-display); font-size: 48px; font-weight: 800; letter-spacing: -1px; margin-bottom: 4px; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .welcome-sub { font-size: 18px; color: var(--text-secondary); margin-bottom: 32px; }
  .welcome-note { font-size: 14px; color: var(--text-muted); margin-bottom: 20px; }
  .welcome-actions { display: flex; gap: 12px; margin-bottom: 48px; }
  .btn-demo { padding: 12px 28px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 15px; cursor: pointer; font-family: inherit; transition: all 0.2s; box-shadow: var(--shadow); }
  .btn-demo:hover { border-color: var(--accent); color: var(--accent); box-shadow: var(--shadow-glow); transform: translateY(-1px); }
  .welcome-v2 { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }
</style>
