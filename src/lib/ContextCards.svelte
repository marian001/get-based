<script lang="ts">
  import { importedData } from './stores';
  import { hasCardContent } from './utils';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  const CARDS = [
    { key: 'healthGoals', emoji: '🎯', label: 'Health Goals', placeholder: 'Add health goals' },
    { key: 'diagnoses', emoji: '🏥', label: 'Medical Conditions', placeholder: 'Add conditions' },
    { key: 'diet', emoji: '🥗', label: 'Diet & Digestion', placeholder: 'Describe your diet' },
    { key: 'exercise', emoji: '🏋️', label: 'Exercise', placeholder: 'Describe your routine' },
    { key: 'sleepRest', emoji: '😴', label: 'Sleep & Rest', placeholder: 'Describe your sleep' },
    { key: 'lightCircadian', emoji: '☀️', label: 'Light & Circadian', placeholder: 'Light habits' },
    { key: 'stress', emoji: '🧠', label: 'Stress', placeholder: 'Rate your stress' },
    { key: 'loveLife', emoji: '❤️', label: 'Love Life', placeholder: 'Share your status' },
    { key: 'environment', emoji: '🌍', label: 'Environment', placeholder: 'Describe environment' },
  ] as const;

  $: filled = CARDS.filter(c => hasCardContent(($importedData as any)[c.key])).length;

  function getSummary(key: string): string {
    const data = ($importedData as any)[key];
    if (!data) return '';
    if (typeof data === 'string') return data.slice(0, 80);
    if (Array.isArray(data)) return data.slice(0, 3).join(', ');
    // Object — collect non-empty values
    const parts: string[] = [];
    for (const [k, v] of Object.entries(data)) {
      if (k === 'note') continue;
      if (Array.isArray(v) && v.length) parts.push(v.join(', '));
      else if (typeof v === 'string' && v) parts.push(v);
    }
    if (data.note?.trim()) parts.push(data.note.trim());
    return parts.slice(0, 3).join(' · ').slice(0, 100);
  }
</script>

<div class="context-section">
  <div class="context-header">
    <h3>Health Context</h3>
    <span class="context-count">{filled}/{CARDS.length} filled</span>
  </div>
  <div class="card-grid">
    {#each CARDS as card (card.key)}
      {@const hasCont = hasCardContent(($importedData as any)[card.key])}
      {@const summary = getSummary(card.key)}
      <button class="context-card" class:filled={hasCont} on:click={() => dispatch('editCard', card.key)}>
        <div class="card-top">
          <span class="card-emoji">{card.emoji}</span>
          <span class="card-label">{card.label}</span>
        </div>
        {#if summary}
          <div class="card-summary">{summary}</div>
        {:else}
          <div class="card-placeholder">{card.placeholder}</div>
        {/if}
      </button>
    {/each}
  </div>
</div>

<style>
  .context-section { margin-top: 24px; }
  .context-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  h3 { font-size: 16px; font-weight: 600; color: var(--text2); margin: 0; }
  .context-count { font-size: 12px; color: var(--text3); }
  .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
  .context-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px; text-align: left; cursor: pointer; font-family: inherit; color: var(--text); transition: all 0.15s; width: 100%; }
  .context-card:hover { border-color: var(--accent); }
  .context-card.filled { border-left: 3px solid var(--green); }
  .card-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .card-emoji { font-size: 16px; }
  .card-label { font-size: 13px; font-weight: 600; }
  .card-summary { font-size: 12px; color: var(--text2); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .card-placeholder { font-size: 12px; color: var(--text3); }
</style>
