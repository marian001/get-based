<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { callAI, hasAIProvider } from './ai';
  import { importedData, persistImportedData } from './stores';

  const dispatch = createEventDispatcher();

  let file: File | null = null;
  let status = '';
  let statusType: 'info' | 'error' | 'success' = 'info';
  let processing = false;
  let preview: { date: string; markers: Record<string, number> } | null = null;
  let excludeKeys = new Set<string>();

  // @ts-ignore — pdf.js loaded from vendor
  let pdfjsLib: any = null;

  async function loadPdfJs() {
    if (pdfjsLib) return;
    // Dynamic import of pdf.js from vendor
    await new Promise<void>((resolve) => {
      if ((window as any).pdfjsLib) { pdfjsLib = (window as any).pdfjsLib; resolve(); return; }
      const script = document.createElement('script');
      script.src = '/vendor/pdf.min.js';
      script.onload = () => {
        pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdf.worker.min.js';
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async function onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    file = input.files[0];
    preview = null;
    excludeKeys = new Set();
    await processFile();
  }

  async function processFile() {
    if (!file || !hasAIProvider()) {
      status = 'Configure an AI provider in v1 Settings first.';
      statusType = 'error';
      return;
    }

    processing = true;
    status = 'Extracting text from PDF...';
    statusType = 'info';

    try {
      await loadPdfJs();

      // Extract text
      const arrayBuf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
      }

      if (fullText.trim().length < 50) {
        status = 'Could not extract enough text. Try a different PDF or use image import in v1.';
        statusType = 'error';
        processing = false;
        return;
      }

      status = 'Analyzing with AI...';

      // Send to AI for parsing
      const prompt = `Parse this lab report and extract all biomarker results. Return ONLY valid JSON, no markdown fences:
{
  "date": "YYYY-MM-DD",
  "markers": {
    "category.markerKey": numericValue,
    ...
  }
}

Use these category.marker keys where possible:
biochemistry.glucose, biochemistry.urea, biochemistry.creatinine, biochemistry.uricAcid, biochemistry.bilirubinTotal, biochemistry.ast, biochemistry.alt, biochemistry.alp, biochemistry.ggt, biochemistry.ldh
hormones.testosterone, hormones.freeTestosterone, hormones.shbg, hormones.estradiol, hormones.insulin, hormones.tsh, hormones.ft3, hormones.ft4
electrolytes.sodium, electrolytes.potassium, electrolytes.calciumTotal, electrolytes.magnesium, electrolytes.zinc, electrolytes.copper
lipids.cholesterol, lipids.triglycerides, lipids.hdl, lipids.ldl, lipids.apoB
iron.iron, iron.ferritin, iron.transferrin
hematology.hemoglobin, hematology.rbc, hematology.wbc, hematology.hematocrit, hematology.platelets, hematology.mcv
vitamins.vitaminD, vitamins.vitaminB12, vitamins.folate
proteins.totalProtein, proteins.albumin, proteins.hsCRP
diabetes.hba1c
coagulation.homocysteine

For markers not in this list, create a key as category.markerName (camelCase).
Values must be numeric (no units in values). Convert to SI units.

LAB REPORT TEXT:
${fullText.slice(0, 8000)}`;

      const result = await callAI({ messages: [{ role: 'user', content: prompt }], maxTokens: 2000 });

      // Parse response
      let json = result.text.trim();
      const fenceMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) json = fenceMatch[1].trim();
      const parsed = JSON.parse(json);

      if (!parsed.markers || Object.keys(parsed.markers).length === 0) {
        status = 'AI could not find any markers in this PDF.';
        statusType = 'error';
        processing = false;
        return;
      }

      preview = parsed;
      status = `Found ${Object.keys(parsed.markers).length} markers from ${parsed.date || 'unknown date'}. Review and import.`;
      statusType = 'success';
    } catch (e: any) {
      status = 'Error: ' + e.message;
      statusType = 'error';
    } finally {
      processing = false;
    }
  }

  function toggleExclude(key: string) {
    if (excludeKeys.has(key)) excludeKeys.delete(key);
    else excludeKeys.add(key);
    excludeKeys = excludeKeys; // trigger reactivity
  }

  function importResults() {
    if (!preview) return;
    const markers: Record<string, number> = {};
    for (const [key, val] of Object.entries(preview.markers)) {
      if (!excludeKeys.has(key)) markers[key] = val as number;
    }

    importedData.update(d => {
      if (!Array.isArray(d.entries)) d.entries = [];
      const entry = { date: preview!.date || new Date().toISOString().slice(0, 10), markers };
      (d.entries as any[]).push(entry);
      (d.entries as any[]).sort((a: any, b: any) => a.date.localeCompare(b.date));
      return d;
    });

    persistImportedData();
    dispatch('imported');
    dispatch('close');
  }

  function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') dispatch('close'); }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="modal-backdrop" on:click|self={() => dispatch('close')} role="dialog" tabindex="-1">
  <div class="import-modal">
    <button class="modal-close" on:click={() => dispatch('close')}>&times;</button>
    <h2>Import Lab PDF</h2>

    <div class="upload-area">
      <input type="file" accept=".pdf" on:change={onFileSelect} id="pdf-input" class="file-input" />
      <label for="pdf-input" class="upload-label">
        {#if file}
          📄 {file.name}
        {:else}
          📋 Choose PDF or drag & drop
        {/if}
      </label>
    </div>

    {#if status}
      <div class="status {statusType}">{status}</div>
    {/if}

    {#if processing}
      <div class="progress">
        <div class="progress-bar"><div class="progress-fill"></div></div>
      </div>
    {/if}

    {#if preview}
      <div class="preview">
        <div class="preview-header">
          <span>Date: <strong>{preview.date}</strong></span>
          <span>{Object.keys(preview.markers).length - excludeKeys.size} markers selected</span>
        </div>
        <div class="preview-list">
          {#each Object.entries(preview.markers) as [key, val]}
            <label class="preview-row" class:excluded={excludeKeys.has(key)}>
              <input type="checkbox" checked={!excludeKeys.has(key)} on:change={() => toggleExclude(key)} />
              <span class="preview-key">{key}</span>
              <span class="preview-val">{val}</span>
            </label>
          {/each}
        </div>
        <button class="import-btn" on:click={importResults}>
          Import {Object.keys(preview.markers).length - excludeKeys.size} markers
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; justify-content: center; align-items: flex-start; padding: 40px 20px; overflow-y: auto; }
  .import-modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 100%; max-width: 560px; position: relative; }
  .modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; color: var(--text3); font-size: 24px; cursor: pointer; }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 16px; }
  .upload-area { margin-bottom: 16px; }
  .file-input { display: none; }
  .upload-label { display: block; padding: 24px; border: 2px dashed var(--border); border-radius: var(--radius); text-align: center; cursor: pointer; font-size: 14px; color: var(--text2); transition: all 0.15s; }
  .upload-label:hover { border-color: var(--accent); color: var(--accent); }
  .status { font-size: 13px; padding: 8px 10px; border-radius: 6px; margin-bottom: 12px; }
  .status.info { color: var(--accent); background: rgba(79,140,255,0.08); }
  .status.error { color: var(--red); background: rgba(248,113,113,0.08); }
  .status.success { color: var(--green); background: rgba(52,211,153,0.08); }
  .progress { margin-bottom: 12px; }
  .progress-bar { height: 4px; background: var(--surface); border-radius: 2px; overflow: hidden; }
  .progress-fill { height: 100%; width: 60%; background: var(--accent); border-radius: 2px; animation: slide 1.5s infinite; }
  @keyframes slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
  .preview { margin-top: 12px; }
  .preview-header { display: flex; justify-content: space-between; font-size: 13px; color: var(--text2); margin-bottom: 8px; }
  .preview-list { max-height: 300px; overflow-y: auto; border: 1px solid var(--border); border-radius: 6px; }
  .preview-row { display: flex; align-items: center; gap: 8px; padding: 6px 10px; font-size: 13px; cursor: pointer; border-bottom: 1px solid var(--border); }
  .preview-row:hover { background: var(--surface); }
  .preview-row.excluded { opacity: 0.4; }
  .preview-key { flex: 1; font-family: var(--font-mono); color: var(--text2); font-size: 12px; }
  .preview-val { font-weight: 600; font-family: var(--font-mono); }
  .import-btn { width: 100%; padding: 10px; margin-top: 12px; border-radius: 6px; border: none; background: var(--accent); color: white; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .import-btn:hover { opacity: 0.9; }
</style>
