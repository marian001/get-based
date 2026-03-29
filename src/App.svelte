<script lang="ts">
  import Sidebar from './lib/Sidebar.svelte';
  import Dashboard from './lib/Dashboard.svelte';
  import CategoryView from './lib/CategoryView.svelte';
  import DetailModal from './lib/DetailModal.svelte';

  let activeCategory = 'dashboard';
  let detailMarker: string | null = null;

  function navigate(e: CustomEvent) {
    activeCategory = e.detail;
  }

  function openDetail(e: CustomEvent) {
    detailMarker = e.detail;
  }
</script>

<div class="app-layout">
  <Sidebar {activeCategory} on:navigate={navigate} />
  <main class="app-main">
    {#if activeCategory === 'dashboard'}
      <Dashboard />
    {:else}
      <CategoryView categoryKey={activeCategory} on:openDetail={openDetail} />
    {/if}
  </main>
</div>

{#if detailMarker}
  <DetailModal markerKey={detailMarker} on:close={() => detailMarker = null} />
{/if}

<style>
  .app-layout { display: flex; min-height: 100vh; }
  .app-main { margin-left: 220px; flex: 1; min-width: 0; }
</style>
