<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { importedData, profileSex, currentProfile } from './stores';

  const dispatch = createEventDispatcher();

  function importJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      if (!input.files?.length) return;
      try {
        const text = await input.files[0].text();
        const data = JSON.parse(text);
        // Accept v1 export format (has entries array) or full bundle
        if (data.entries || data.importedData) {
          const imported = data.importedData || data;
          importedData.set(imported);
          if (data.profileSex) profileSex.set(data.profileSex);
          dispatch('imported');
        } else {
          alert('Unrecognized format');
        }
      } catch (e: any) {
        alert('Import failed: ' + e.message);
      }
    };
    input.click();
  }

  function exportJSON() {
    const data = {
      exportedAt: new Date().toISOString(),
      profileSex: null as string | null,
      entries: [] as any[],
    };

    // Read current store values synchronously
    const unsub1 = importedData.subscribe(d => { Object.assign(data, d); });
    const unsub2 = profileSex.subscribe(s => { data.profileSex = s; });
    unsub1(); unsub2();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `getbased-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
</script>

<div class="ie-bar">
  <button class="ie-btn" on:click={importJSON}>
    <span>📥</span> Import JSON
  </button>
  <button class="ie-btn" on:click={exportJSON}>
    <span>📤</span> Export JSON
  </button>
</div>

<style>
  .ie-bar { display: flex; gap: 8px; padding: 8px 16px; }
  .ie-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text2); font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.15s; width: 100%; justify-content: center; }
  .ie-btn:hover { border-color: var(--accent); color: var(--text); }
</style>
