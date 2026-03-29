<script lang="ts">
  import { onMount } from 'svelte';
  import { getStatus, escapeHTML } from './utils';
  import type { ActiveMarker } from './types';

  export let slotKey: string;
  export let markerStatus: string = '';

  interface Slot {
    label: string;
    freeActions?: string[];
    foodForms?: string[];
    productForms?: string[];
    forms?: string[];
    formRefs?: Record<string, string>;
    references?: string[];
    card?: string;
  }

  let catalog: { slots: Record<string, Slot> } | null = null;
  let loading = true;
  let disclosed = localStorage.getItem('labcharts-rec-disclosure') === 'seen';

  onMount(async () => {
    try {
      const res = await fetch('/data/recommendations-czsk.json');
      if (res.ok) catalog = await res.json();
    } catch {}
    loading = false;
  });

  $: slot = catalog?.slots?.[slotKey] || null;
  $: isNormal = markerStatus === 'normal';

  function acceptDisclosure() {
    disclosed = true;
    localStorage.setItem('labcharts-rec-disclosure', 'seen');
  }
</script>

{#if loading}
  <div class="rec-loading">Loading tips...</div>
{:else if slot}
  {#if !disclosed}
    <div class="rec-banner">
      For informational purposes only. Not a medical device. Does not diagnose, treat, or prevent disease. Consult your healthcare provider before starting any supplement, especially if pregnant, nursing, or taking medications.
      <button class="rec-accept" on:click={acceptDisclosure}>Got it</button>
    </div>
  {/if}

  {#if disclosed}
    <div class="rec-section">
      <div class="rec-header">What can help</div>

      {#if isNormal}
        <div class="rec-in-range">Your value is in range. These tips are for general reference.</div>
      {/if}

      {#if slot.freeActions?.length}
        <div class="rec-tier-label">NATURE <span class="tier-hint">best option</span></div>
        {#each slot.freeActions as action}
          <div class="rec-free">{action}</div>
        {/each}
      {/if}

      {#if slot.foodForms?.length}
        <div class="rec-tier-label">WHOLE FOOD <span class="tier-hint">from nature</span></div>
        <div class="rec-forms">{slot.foodForms.join(' · ')}</div>
      {/if}

      {#if slot.productForms?.length}
        <div class="rec-tier-label">TOOLS <span class="tier-hint">supports nature</span></div>
        <div class="rec-forms">{slot.productForms.join(' · ')}</div>
      {/if}

      {#if slot.forms?.length}
        <div class="rec-tier-label">SUPPLEMENTS <span class="tier-hint">last resort</span></div>
        <div class="rec-forms">
          {#each slot.forms as form, i}
            {#if i > 0}, {/if}
            {form}
            {#if slot.formRefs?.[form]}
              <a href={slot.formRefs[form]} target="_blank" rel="noopener" class="rec-study">(study)</a>
            {/if}
          {/each}
        </div>
      {/if}

      <div class="rec-suggest">
        <a href="https://github.com/elkimek/get-based/issues/new?title={encodeURIComponent(`[Rec] ${slot.label}: better study / correction`)}&labels=recommendations" target="_blank" rel="noopener">Suggest a better study</a>
      </div>
      <div class="rec-disclaimer">For informational purposes only. Not medical advice. Consult your healthcare provider before starting any supplement.</div>
    </div>
  {/if}
{/if}

<style>
  .rec-loading { font-size: 12px; color: var(--text3); padding: 8px 0; }
  .rec-banner { background: rgba(79,140,255,0.08); border: 1px solid rgba(79,140,255,0.25); border-radius: var(--radius); padding: 10px 12px; margin-top: 16px; font-size: 12px; color: var(--text2); line-height: 1.5; }
  .rec-accept { display: inline-block; margin-top: 8px; padding: 3px 12px; font-size: 11px; background: transparent; border: 1px solid var(--border); border-radius: var(--radius); color: var(--text3); cursor: pointer; font-family: inherit; }
  .rec-accept:hover { color: var(--text); border-color: var(--text3); }
  .rec-section { margin-top: 16px; border-top: 1px solid var(--border); padding-top: 12px; }
  .rec-header { font-size: 14px; font-weight: 600; margin-bottom: 10px; }
  .rec-in-range { font-size: 12px; color: var(--green); margin-bottom: 8px; }
  .rec-tier-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text2); margin: 8px 0 3px; font-weight: 600; }
  .tier-hint { font-weight: 400; color: var(--text3); }
  .rec-free { font-size: 13px; color: var(--text2); padding: 2px 0; }
  .rec-forms { font-size: 13px; color: var(--text2); }
  .rec-study { font-size: 11px; color: var(--text3); text-decoration: none; }
  .rec-study:hover { color: var(--accent); }
  .rec-suggest { margin-top: 8px; font-size: 10px; }
  .rec-suggest a { color: var(--text3); text-decoration: none; }
  .rec-suggest a:hover { color: var(--accent); }
  .rec-disclaimer { font-size: 9px; color: var(--text3); margin-top: 8px; opacity: 0.7; }
</style>
