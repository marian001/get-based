<script lang="ts">
  import { importedData } from './stores';

  $: genetics = $importedData.genetics;
  $: hasDNA = !!(genetics?.snps && Object.keys(genetics.snps).length > 0);
  $: snpCount = genetics?.snps ? Object.keys(genetics.snps).length : 0;

  let expanded = false;
</script>

{#if hasDNA}
  <div class="genetics-section">
    <button class="genetics-header" on:click={() => expanded = !expanded}>
      <span>🧬 Genetics</span>
      <span class="genetics-count">{snpCount} SNPs{genetics?.apoe ? ` · APOE ${genetics.apoe}` : ''}</span>
      <span class="expand-icon">{expanded ? '▾' : '▸'}</span>
    </button>

    {#if expanded}
      <div class="genetics-body">
        {#if genetics?.apoe}
          <div class="genetics-apoe">
            <strong>APOE:</strong> {genetics.apoe}
          </div>
        {/if}

        {#if genetics?.snps}
          <div class="snp-grid">
            {#each Object.entries(genetics.snps) as [rsid, genotype]}
              <div class="snp-item">
                <span class="snp-id">{rsid}</span>
                <span class="snp-gt">{genotype}</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if genetics?.rawFormat}
          <div class="genetics-meta">Format: {genetics.rawFormat}</div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .genetics-section { margin-top: 24px; }
  .genetics-header { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); cursor: pointer; font-family: inherit; color: var(--text); font-size: 14px; font-weight: 600; text-align: left; }
  .genetics-header:hover { border-color: var(--accent); }
  .genetics-count { font-size: 12px; color: var(--text3); font-weight: 400; flex: 1; }
  .expand-icon { color: var(--text3); }
  .genetics-body { padding: 12px 14px; background: var(--bg2); border: 1px solid var(--border); border-top: none; border-radius: 0 0 var(--radius) var(--radius); }
  .genetics-apoe { font-size: 14px; margin-bottom: 8px; padding: 6px 10px; background: rgba(79,140,255,0.08); border-radius: 6px; }
  .snp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 4px; }
  .snp-item { display: flex; justify-content: space-between; padding: 3px 8px; font-size: 12px; background: var(--surface); border-radius: 4px; }
  .snp-id { color: var(--text3); font-family: var(--font-mono); }
  .snp-gt { font-weight: 600; font-family: var(--font-mono); }
  .genetics-meta { font-size: 11px; color: var(--text3); margin-top: 8px; }
</style>
