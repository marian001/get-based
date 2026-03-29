<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { activeData } from './data';
  import { importedData } from './stores';
  import { MARKER_SCHEMA } from './schema';

  export let preselectedMarker: string = '';
  const dispatch = createEventDispatcher();

  let date = new Date().toISOString().slice(0, 10);
  let selectedCategory = preselectedMarker ? preselectedMarker.split('.')[0] : '';
  let selectedMarker = preselectedMarker ? preselectedMarker.split('.')[1] : '';
  let value = '';

  $: categoryList = Object.entries($activeData.categories).map(([key, cat]) => ({
    key, label: cat.label, icon: cat.icon,
  }));

  $: markerList = selectedCategory && $activeData.categories[selectedCategory]
    ? Object.entries($activeData.categories[selectedCategory].markers).map(([key, m]) => ({
        key, name: m.name, unit: m.unit,
      }))
    : [];

  $: currentMarker = selectedCategory && selectedMarker
    ? $activeData.categories[selectedCategory]?.markers[selectedMarker]
    : null;

  function save() {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    if (!selectedCategory || !selectedMarker || !date) return;

    const fullKey = `${selectedCategory}.${selectedMarker}`;

    importedData.update(data => {
      // Ensure entries is an array
      if (!Array.isArray(data.entries)) data.entries = [];

      // Find or create entry for this date
      let entry = (data.entries as any[]).find((e: any) => e.date === date);
      if (!entry) {
        entry = { date, markers: {} };
        (data.entries as any[]).push(entry);
        // Sort by date
        (data.entries as any[]).sort((a: any, b: any) => a.date.localeCompare(b.date));
      }
      entry.markers[fullKey] = num;
      return data;
    });

    // Persist to v1 localStorage format
    const profileId = localStorage.getItem('labcharts-current-profile') || 'default';
    const unsub = importedData.subscribe(d => {
      localStorage.setItem(`labcharts-${profileId}-imported`, JSON.stringify(d));
    });
    unsub();

    dispatch('saved', { key: fullKey, date, value: num });
    dispatch('close');
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') dispatch('close');
    if (e.key === 'Enter' && value) save();
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="modal-backdrop" on:click|self={() => dispatch('close')} role="dialog" tabindex="-1">
  <div class="entry-modal">
    <button class="modal-close" on:click={() => dispatch('close')}>&times;</button>
    <h2>Add Value</h2>

    <div class="field">
      <label for="entry-date">Date</label>
      <input id="entry-date" type="date" bind:value={date} />
    </div>

    <div class="field">
      <label for="entry-cat">Category</label>
      <select id="entry-cat" bind:value={selectedCategory} on:change={() => selectedMarker = ''}>
        <option value="">Select category...</option>
        {#each categoryList as cat}
          <option value={cat.key}>{cat.icon} {cat.label}</option>
        {/each}
      </select>
    </div>

    {#if selectedCategory}
      <div class="field">
        <label for="entry-marker">Marker</label>
        <select id="entry-marker" bind:value={selectedMarker}>
          <option value="">Select marker...</option>
          {#each markerList as m}
            <option value={m.key}>{m.name} ({m.unit})</option>
          {/each}
        </select>
      </div>
    {/if}

    {#if currentMarker}
      <div class="field">
        <label for="entry-value">Value <span class="unit-hint">{currentMarker.unit}</span></label>
        <input id="entry-value" type="number" step="any" bind:value placeholder={`e.g. ${currentMarker.refMin ?? ''}`} autofocus />
      </div>

      {#if currentMarker.refMin != null}
        <div class="ref-hint">
          Reference: {currentMarker.refMin} – {currentMarker.refMax} {currentMarker.unit}
          {#if currentMarker.optimalMin != null}
            · Optimal: {currentMarker.optimalMin} – {currentMarker.optimalMax}
          {/if}
        </div>
      {/if}
    {/if}

    <div class="modal-actions">
      <button class="btn-cancel" on:click={() => dispatch('close')}>Cancel</button>
      <button class="btn-save" on:click={save} disabled={!value || !selectedMarker}>Save</button>
    </div>
  </div>
</div>

<style>
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; justify-content: center; align-items: center; }
  .entry-modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 90%; max-width: 420px; position: relative; }
  .modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; color: var(--text3); font-size: 24px; cursor: pointer; }
  .modal-close:hover { color: var(--text); }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
  .field { margin-bottom: 14px; }
  .field label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 4px; }
  .field input, .field select { width: 100%; background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 10px 12px; border-radius: 6px; font-size: 15px; font-family: inherit; }
  .field input:focus, .field select:focus { outline: none; border-color: var(--accent); }
  .unit-hint { color: var(--text3); font-weight: 400; }
  .ref-hint { font-size: 12px; color: var(--text3); margin-bottom: 16px; padding: 8px 10px; background: var(--surface); border-radius: 6px; }
  .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 8px; }
  .btn-cancel { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text2); cursor: pointer; font-family: inherit; font-size: 14px; }
  .btn-save { padding: 8px 20px; border-radius: 6px; border: none; background: var(--accent); color: white; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 600; }
  .btn-save:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-save:hover:not(:disabled) { opacity: 0.9; }
</style>
