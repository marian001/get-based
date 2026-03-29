<script lang="ts">
  import { importedData, persistImportedData } from './stores';

  export let markerKey: string;

  $: note = ($importedData.markerNotes || {})[markerKey] || '';

  function save(e: Event) {
    const text = (e.target as HTMLTextAreaElement).value;
    importedData.update(d => {
      if (!d.markerNotes) d.markerNotes = {};
      if (text.trim()) d.markerNotes[markerKey] = text.trim();
      else delete d.markerNotes[markerKey];
      return d;
    });
    persistImportedData();
  }
</script>

<div class="notes">
  <h4>Notes</h4>
  <textarea value={note} on:blur={save} placeholder="Add notes about this marker..." rows="3"></textarea>
</div>

<style>
  .notes { margin-top: 16px; }
  h4 { font-size: 13px; color: var(--text2); margin-bottom: 6px; }
  textarea { width: 100%; background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 8px 10px; border-radius: 6px; font-size: 13px; font-family: inherit; resize: vertical; }
  textarea:focus { outline: none; border-color: var(--accent); }
</style>
