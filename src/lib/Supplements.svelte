<script lang="ts">
  import { importedData, persistImportedData } from './stores';

  interface Supplement {
    name: string;
    dosage?: string;
    startDate?: string;
    endDate?: string;
    note?: string;
    color?: string;
  }

  $: supplements = ($importedData.supplements || []) as Supplement[];

  let showForm = false;
  let editIdx = -1;
  let name = '';
  let dosage = '';
  let startDate = '';
  let endDate = '';
  let note = '';

  function openAdd() {
    editIdx = -1; name = ''; dosage = ''; startDate = new Date().toISOString().slice(0, 10); endDate = ''; note = '';
    showForm = true;
  }

  function openEdit(i: number) {
    const s = supplements[i];
    editIdx = i; name = s.name; dosage = s.dosage || ''; startDate = s.startDate || ''; endDate = s.endDate || ''; note = s.note || '';
    showForm = true;
  }

  function save() {
    if (!name.trim()) return;
    const entry: Supplement = { name: name.trim(), dosage: dosage.trim() || undefined, startDate: startDate || undefined, endDate: endDate || undefined, note: note.trim() || undefined };
    importedData.update(d => {
      if (!d.supplements) d.supplements = [];
      if (editIdx >= 0) d.supplements[editIdx] = entry;
      else d.supplements.push(entry);
      return d;
    });
    persist();
    showForm = false;
  }

  function remove(i: number) {
    if (!confirm(`Remove ${supplements[i].name}?`)) return;
    importedData.update(d => { d.supplements?.splice(i, 1); return d; });
    persist();
  }

  function persist() {
    persistImportedData();
  }
</script>

<div class="supps-section">
  <div class="supps-header">
    <h3>Supplements</h3>
    <button class="supps-add" on:click={openAdd}>+ Add</button>
  </div>

  {#if supplements.length > 0}
    <div class="supp-list">
      {#each supplements as supp, i (i)}
        <div class="supp-item">
          <div class="supp-info">
            <span class="supp-name">{supp.name}</span>
            {#if supp.dosage}<span class="supp-dose">{supp.dosage}</span>{/if}
            {#if supp.startDate}
              <span class="supp-dates">{supp.startDate}{supp.endDate ? ' → ' + supp.endDate : ' → present'}</span>
            {/if}
          </div>
          <div class="supp-actions">
            <button on:click={() => openEdit(i)}>Edit</button>
            <button class="del" on:click={() => remove(i)}>×</button>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="supp-empty">No supplements tracked</p>
  {/if}
</div>

{#if showForm}
  <div class="modal-backdrop" on:click|self={() => showForm = false} on:keydown={e => e.key === 'Escape' && (showForm = false)} role="dialog" tabindex="-1">
    <div class="supp-modal">
      <h3>{editIdx >= 0 ? 'Edit' : 'Add'} Supplement</h3>
      <div class="field"><label for="s-name">Name</label><input id="s-name" bind:value={name} placeholder="e.g. Magnesium Glycinate" autofocus /></div>
      <div class="field"><label for="s-dose">Dosage</label><input id="s-dose" bind:value={dosage} placeholder="e.g. 200mg" /></div>
      <div class="field-row">
        <div class="field"><label for="s-start">Start date</label><input id="s-start" type="date" bind:value={startDate} /></div>
        <div class="field"><label for="s-end">End date</label><input id="s-end" type="date" bind:value={endDate} placeholder="Leave empty if ongoing" /></div>
      </div>
      <div class="field"><label for="s-note">Note</label><input id="s-note" bind:value={note} placeholder="Optional note" /></div>
      <div class="modal-actions">
        <button class="btn-cancel" on:click={() => showForm = false}>Cancel</button>
        <button class="btn-save" on:click={save}>{editIdx >= 0 ? 'Update' : 'Add'}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .supps-section { margin-top: 24px; }
  .supps-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  h3 { font-size: 16px; font-weight: 600; color: var(--text2); margin: 0; }
  .supps-add { background: none; border: 1px solid var(--border); color: var(--text2); padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; font-family: inherit; }
  .supps-add:hover { border-color: var(--accent); color: var(--accent); }
  .supp-list { display: flex; flex-direction: column; gap: 6px; }
  .supp-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg2); border: 1px solid var(--border); border-radius: 6px; border-left: 3px solid var(--purple); }
  .supp-info { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .supp-name { font-weight: 600; font-size: 13px; }
  .supp-dose { font-size: 12px; color: var(--text2); }
  .supp-dates { font-size: 11px; color: var(--text3); }
  .supp-actions { display: flex; gap: 4px; }
  .supp-actions button { background: var(--surface); border: 1px solid var(--border); color: var(--text2); padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; font-family: inherit; }
  .supp-actions .del:hover { color: var(--red); border-color: var(--red); }
  .supp-empty { font-size: 13px; color: var(--text3); }
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; justify-content: center; align-items: center; }
  .supp-modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 90%; max-width: 420px; }
  .supp-modal h3 { margin-bottom: 16px; color: var(--text); }
  .field { margin-bottom: 12px; }
  .field label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 4px; }
  .field input { width: 100%; background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 8px 10px; border-radius: 6px; font-size: 14px; font-family: inherit; }
  .field input:focus { outline: none; border-color: var(--accent); }
  .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
  .btn-cancel { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text2); cursor: pointer; font-family: inherit; }
  .btn-save { padding: 8px 20px; border-radius: 6px; border: none; background: var(--accent); color: white; cursor: pointer; font-family: inherit; font-weight: 600; }
</style>
