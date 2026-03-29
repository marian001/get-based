<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { importedData, persistImportedData } from './stores';

  export let cardKey: string;
  export let label: string;

  const dispatch = createEventDispatcher();

  // Load current data as JSON text for editing
  $: cardData = ($importedData as any)[cardKey];
  let note = '';

  // Extract note from card data
  $: {
    if (typeof cardData === 'string') note = cardData;
    else if (cardData?.note) note = cardData.note;
    else if (Array.isArray(cardData)) note = cardData.join('\n');
    else note = '';
  }

  function save() {
    importedData.update(d => {
      const data = (d as any)[cardKey];
      if (typeof data === 'string' || data === null || data === undefined) {
        // Simple text cards (healthGoals as array, others as note)
        if (cardKey === 'healthGoals') {
          (d as any)[cardKey] = note.trim() ? note.split('\n').map((l: string) => l.trim()).filter(Boolean) : [];
        } else {
          if (note.trim()) {
            if (typeof data === 'object' && data !== null) {
              data.note = note.trim();
            } else {
              (d as any)[cardKey] = { note: note.trim() };
            }
          } else {
            (d as any)[cardKey] = null;
          }
        }
      } else if (typeof data === 'object' && data !== null) {
        data.note = note.trim();
        // Clear card if only empty note remains
        const hasContent = Object.entries(data).some(([k, v]) => {
          if (k === 'note') return false;
          if (Array.isArray(v)) return v.length > 0;
          return v != null && v !== '';
        });
        if (!hasContent && !note.trim()) (d as any)[cardKey] = null;
      }
      return d;
    });
    persistImportedData();
    dispatch('close');
  }

  function clear() {
    importedData.update(d => { (d as any)[cardKey] = null; return d; });
    persistImportedData();
    dispatch('close');
  }

  function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') dispatch('close'); }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="modal-backdrop" on:click|self={() => dispatch('close')} role="dialog" tabindex="-1">
  <div class="editor-modal">
    <button class="modal-close" on:click={() => dispatch('close')}>&times;</button>
    <h2>{label}</h2>
    <p class="editor-hint">
      {#if cardKey === 'healthGoals'}
        One goal per line. The AI prioritizes analysis around your stated goals.
      {:else}
        Describe your situation. This context helps the AI interpret your lab results.
      {/if}
    </p>

    <textarea bind:value={note} placeholder="Type here..." rows="8" autofocus></textarea>

    {#if cardData && typeof cardData === 'object' && cardData !== null && !Array.isArray(cardData)}
      <div class="existing-fields">
        {#each Object.entries(cardData) as [k, v]}
          {#if k !== 'note' && v}
            <div class="field-preview">
              <span class="field-key">{k}:</span>
              <span class="field-val">{Array.isArray(v) ? v.join(', ') : v}</span>
            </div>
          {/if}
        {/each}
      </div>
    {/if}

    <div class="editor-actions">
      {#if cardData}
        <button class="btn-clear" on:click={clear}>Clear</button>
      {/if}
      <div style="flex:1"></div>
      <button class="btn-cancel" on:click={() => dispatch('close')}>Cancel</button>
      <button class="btn-save" on:click={save}>Save</button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; justify-content: center; align-items: center; }
  .editor-modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 90%; max-width: 520px; position: relative; }
  .modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; color: var(--text3); font-size: 24px; cursor: pointer; }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .editor-hint { font-size: 13px; color: var(--text3); margin-bottom: 12px; }
  textarea { width: 100%; background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 10px 12px; border-radius: 6px; font-size: 14px; font-family: inherit; resize: vertical; }
  textarea:focus { outline: none; border-color: var(--accent); }
  .existing-fields { margin-top: 12px; padding: 10px; background: var(--surface); border-radius: 6px; }
  .field-preview { font-size: 12px; padding: 2px 0; }
  .field-key { color: var(--text3); }
  .field-val { color: var(--text2); }
  .editor-actions { display: flex; gap: 8px; margin-top: 16px; align-items: center; }
  .btn-cancel { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text2); cursor: pointer; font-family: inherit; }
  .btn-save { padding: 8px 20px; border-radius: 6px; border: none; background: var(--accent); color: white; cursor: pointer; font-family: inherit; font-weight: 600; }
  .btn-clear { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--red); color: var(--red); background: transparent; cursor: pointer; font-family: inherit; }
</style>
