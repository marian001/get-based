<script lang="ts">
  // V2 app shell — will grow into the full app
</script>

<main>
  <header>
    <h1>getbased</h1>
    <span class="version">v2 dev</span>
  </header>
  <p class="subtitle">Blood work dashboard — v2 rewrite in progress</p>
  <p class="note">V1 is still live at <a href="/app">/app</a>. This is the v2 Svelte/TypeScript rebuild.</p>
</main>

<style>
  main { max-width: 1200px; margin: 0 auto; padding: 48px 24px; }
  header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; }
  h1 { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
  .version { font-size: 12px; color: var(--accent); background: rgba(79,140,255,0.1); padding: 2px 8px; border-radius: 4px; font-family: var(--font-mono); }
  .subtitle { color: var(--text2); font-size: 16px; margin-bottom: 24px; }
  .note { color: var(--text3); font-size: 14px; }
</style>
