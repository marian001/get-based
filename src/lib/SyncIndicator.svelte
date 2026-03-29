<script lang="ts">
  import { syncStatus, isSyncEnabled, enableSync, disableSync, getMnemonic, restoreFromMnemonic, getSyncRelay, setSyncRelay, initSync } from './sync';
  import { onMount } from 'svelte';

  let showPanel = false;
  let showSetup = false;
  let mnemonicInput = '';
  let mnemonicVisible = false;
  let setupMode: 'new' | 'join' | null = null;

  onMount(() => { initSync(); });

  $: enabled = $syncStatus.enabled;
  $: relayColor = $syncStatus.relay === 'connected' ? 'var(--green)' : $syncStatus.relay === 'unreachable' ? 'var(--red)' : 'var(--text3)';

  async function doEnable() {
    await enableSync();
    setupMode = null;
    showSetup = false;
  }

  async function doRestore() {
    if (!mnemonicInput.trim()) return;
    const ok = await restoreFromMnemonic(mnemonicInput.trim());
    if (ok) { mnemonicInput = ''; showSetup = false; window.location.reload(); }
  }

  async function doDisable() {
    if (!confirm('Disable sync? Data stays on this device.')) return;
    await disableSync();
  }
</script>

{#if enabled}
  <button class="sync-dot" style="background:{relayColor}" on:click={() => showPanel = !showPanel} title="Sync status"></button>
{/if}

{#if showPanel && enabled}
  <div class="sync-popover">
    <div class="sync-row"><span class="sync-label">Relay</span><span style="color:{relayColor}">{$syncStatus.relay}</span></div>
    <div class="sync-row"><span class="sync-label">Push</span><span>{$syncStatus.push}</span></div>
    <div class="sync-row"><span class="sync-label">Pull</span><span>{$syncStatus.pull}</span></div>
    {#if $syncStatus.lastError}<div class="sync-error">{$syncStatus.lastError}</div>{/if}

    {#if getMnemonic()}
      <div class="sync-mnemonic">
        <span class="sync-label">Mnemonic</span>
        <button class="sync-toggle-mn" on:click={() => mnemonicVisible = !mnemonicVisible}>
          {mnemonicVisible ? 'Hide' : 'Show'}
        </button>
        {#if mnemonicVisible}
          <div class="mnemonic-text">{getMnemonic()}</div>
        {/if}
      </div>
    {/if}

    <button class="sync-btn danger" on:click={doDisable}>Disable Sync</button>
  </div>
{/if}

<!-- Settings integration — enable button when not syncing -->
{#if !enabled}
  <button class="sync-enable-btn" on:click={() => showSetup = true}>Enable Sync</button>
{/if}

{#if showSetup}
  <div class="modal-backdrop" on:click|self={() => showSetup = false} on:keydown={e => e.key === 'Escape' && (showSetup = false)} role="dialog" tabindex="-1">
    <div class="sync-modal">
      <button class="modal-close" on:click={() => showSetup = false}>&times;</button>
      <h3>Cross-Device Sync</h3>
      <p class="sync-desc">E2E encrypted sync via Evolu CRDT. Your data is encrypted before leaving your device.</p>

      {#if !setupMode}
        <div class="setup-choices">
          <button class="setup-btn" on:click={() => { setupMode = 'new'; doEnable(); }}>
            <strong>New setup</strong>
            <span>Generate a new mnemonic</span>
          </button>
          <button class="setup-btn" on:click={() => setupMode = 'join'}>
            <strong>Join existing</strong>
            <span>Restore from mnemonic</span>
          </button>
        </div>
      {:else if setupMode === 'join'}
        <div class="field">
          <label for="mn-input">Enter your 24-word mnemonic</label>
          <textarea id="mn-input" bind:value={mnemonicInput} rows="3" placeholder="word1 word2 word3 ..."></textarea>
        </div>
        <button class="sync-btn primary" on:click={doRestore}>Restore</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .sync-dot { width: 10px; height: 10px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0; }
  .sync-popover { position: absolute; top: 100%; right: 0; background: var(--bg2); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; width: 240px; z-index: 50; box-shadow: var(--shadow-lg); font-size: 12px; }
  .sync-row { display: flex; justify-content: space-between; padding: 3px 0; }
  .sync-label { color: var(--text3); }
  .sync-error { color: var(--red); font-size: 11px; margin-top: 4px; }
  .sync-mnemonic { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border); }
  .sync-toggle-mn { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 11px; font-family: inherit; }
  .mnemonic-text { font-family: var(--font-mono); font-size: 10px; color: var(--text2); margin-top: 4px; word-break: break-all; }
  .sync-btn { width: 100%; padding: 6px; margin-top: 8px; border-radius: 4px; border: 1px solid var(--border); background: transparent; color: var(--text2); cursor: pointer; font-size: 11px; font-family: inherit; }
  .sync-btn.danger { border-color: var(--red); color: var(--red); }
  .sync-btn.primary { background: var(--accent); border-color: var(--accent); color: white; }
  .sync-enable-btn { background: none; border: 1px solid var(--border); color: var(--text3); padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 11px; font-family: inherit; margin: 4px 12px; width: calc(100% - 24px); }
  .sync-enable-btn:hover { border-color: var(--accent); color: var(--accent); }

  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; justify-content: center; align-items: center; }
  .sync-modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 90%; max-width: 420px; position: relative; }
  .modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; color: var(--text3); font-size: 24px; cursor: pointer; }
  h3 { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
  .sync-desc { font-size: 13px; color: var(--text3); margin-bottom: 16px; }
  .setup-choices { display: flex; flex-direction: column; gap: 8px; }
  .setup-btn { padding: 14px; border: 1px solid var(--border); border-radius: var(--radius); background: transparent; color: var(--text); cursor: pointer; text-align: left; font-family: inherit; }
  .setup-btn:hover { border-color: var(--accent); }
  .setup-btn strong { display: block; margin-bottom: 2px; }
  .setup-btn span { font-size: 12px; color: var(--text3); }
  .field { margin-bottom: 12px; }
  .field label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 4px; }
  .field textarea { width: 100%; background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 8px; border-radius: 6px; font-size: 13px; font-family: var(--font-mono); resize: vertical; }
</style>
