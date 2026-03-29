<script lang="ts">
  import Sidebar from './lib/Sidebar.svelte';
  import Dashboard from './lib/Dashboard.svelte';

  let activeCategory = 'dashboard';

  function navigate(e: CustomEvent) {
    activeCategory = e.detail;
  }
</script>

<div class="app-layout">
  <Sidebar {activeCategory} on:navigate={navigate} />
  <main class="app-main">
    {#if activeCategory === 'dashboard'}
      <Dashboard />
    {:else}
      <div style="padding:24px">
        <h2>Category view — coming soon</h2>
        <p style="color:var(--text3)">The {activeCategory} category view will be ported here.</p>
      </div>
    {/if}
  </main>
</div>

<style>
  .app-layout { display: flex; min-height: 100vh; }
  .app-main { margin-left: 220px; flex: 1; min-width: 0; }
</style>
