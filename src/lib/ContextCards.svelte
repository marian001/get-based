<script lang="ts">
  import { importedData } from './stores';
  import { hasCardContent } from './utils';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  const CARDS = [
    { key: 'healthGoals', emoji: '🎯', label: 'Health Goals' },
    { key: 'diagnoses', emoji: '🏥', label: 'Medical Conditions' },
    { key: 'diet', emoji: '🥗', label: 'Diet & Digestion' },
    { key: 'exercise', emoji: '🏋️', label: 'Exercise' },
    { key: 'sleepRest', emoji: '😴', label: 'Sleep & Rest' },
    { key: 'lightCircadian', emoji: '☀️', label: 'Light & Circadian' },
    { key: 'stress', emoji: '🧠', label: 'Stress' },
    { key: 'loveLife', emoji: '❤️', label: 'Love Life' },
    { key: 'environment', emoji: '🌍', label: 'Environment' },
  ] as const;

  $: filled = CARDS.filter(c => hasCardContent(($importedData as any)[c.key])).length;

  function getSummary(key: string): string {
    const data = ($importedData as any)[key];
    if (!data) return '';
    if (typeof data === 'string') return data.slice(0, 60);
    if (Array.isArray(data)) return data.slice(0, 3).join(', ');
    const parts: string[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (k === 'note') continue;
      if (Array.isArray(v) && v.length) parts.push(v.join(', '));
      else if (typeof v === 'string' && v) parts.push(v);
    }
    if (data.note?.trim()) parts.push(data.note.trim());
    return parts.slice(0, 2).join(' · ').slice(0, 80);
  }
</script>

<div class="cc-section">
  <div class="cc-header">
    <h3>Health Context</h3>
    <span class="cc-count">{filled}/{CARDS.length}</span>
  </div>
  <div class="cc-grid">
    {#each CARDS as card (card.key)}
      {@const hasCont = hasCardContent(($importedData as any)[card.key])}
      {@const summary = getSummary(card.key)}
      <button class="cc-card" class:cc-filled={hasCont} class:cc-empty={!hasCont} on:click={() => dispatch('editCard', card.key)}>
        <div class="cc-card-top">
          <span class="cc-emoji">{card.emoji}</span>
          <span class="cc-label">{card.label}</span>
        </div>
        {#if summary}
          <div class="cc-summary">{summary}</div>
        {:else}
          <div class="cc-placeholder">Click to add</div>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .cc-section { margin-bottom: 24px; }
  .cc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .cc-header h3 { font-size: 14px; font-weight: 600; color: var(--text-secondary); margin: 0; }
  .cc-count { font-size: 12px; color: var(--text-muted); }
  .cc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
  .cc-card {
    background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm);
    padding: 12px 16px; text-align: left; cursor: pointer; font-family: inherit;
    color: var(--text-primary); transition: all 0.15s; width: 100%; min-height: 80px;
    display: flex; flex-direction: column;
  }
  .cc-card:hover { border-color: var(--accent); }
  .cc-empty { border-style: dashed; opacity: 0.7; }
  .cc-empty:hover { opacity: 1; }
  .cc-filled { border-left: 3px solid var(--green); }
  .cc-card-top { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
  .cc-emoji { font-size: 15px; }
  .cc-label { font-size: 13px; font-weight: 600; }
  .cc-summary { font-size: 12px; color: var(--text-secondary); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .cc-placeholder { font-size: 12px; color: var(--text-muted); font-style: italic; }
</style>
