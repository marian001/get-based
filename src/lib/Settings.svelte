<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { theme, unitSystem, rangeMode, timeFormat, profiles, currentProfile } from './stores';
  import { aiProvider, getActiveModelId, hasAIProvider } from './ai';
  import { loadProfile } from './loader';
  import type { Theme, UnitSystem, RangeMode, TimeFormat, AIProvider } from './types';

  const dispatch = createEventDispatcher();
  function close() { dispatch('close'); }
  function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') close(); }

  let activeTab: 'display' | 'ai' | 'profiles' = 'display';

  // AI settings
  let aiKey = '';
  let aiModel = '';
  $: { aiModel = getActiveModelId(); }

  const PROVIDERS: { id: AIProvider; label: string }[] = [
    { id: 'openrouter', label: 'OpenRouter' },
    { id: 'anthropic', label: 'Anthropic' },
    { id: 'venice', label: 'Venice' },
    { id: 'ollama', label: 'Local AI' },
  ];

  function saveAIKey() {
    const p = $aiProvider;
    if (p === 'anthropic') localStorage.setItem('labcharts-api-key', aiKey);
    else if (p === 'openrouter') localStorage.setItem('labcharts-openrouter-key', aiKey);
    else if (p === 'venice') localStorage.setItem('labcharts-venice-key', aiKey);
  }

  function saveAIModel() {
    const p = $aiProvider;
    if (p === 'anthropic') localStorage.setItem('labcharts-anthropic-model', aiModel);
    else if (p === 'openrouter') localStorage.setItem('labcharts-openrouter-model', aiModel);
    else if (p === 'venice') localStorage.setItem('labcharts-venice-model', aiModel);
    else localStorage.setItem('labcharts-ollama-model', aiModel);
  }

  function switchProfile(id: string) {
    loadProfile(id);
    close();
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="modal-backdrop" on:click|self={close} role="dialog" tabindex="-1">
  <div class="settings-modal">
    <button class="modal-close" on:click={close}>&times;</button>
    <h2>Settings</h2>

    <div class="tabs">
      <button class="tab" class:active={activeTab === 'display'} on:click={() => activeTab = 'display'}>Display</button>
      <button class="tab" class:active={activeTab === 'ai'} on:click={() => activeTab = 'ai'}>AI</button>
      <button class="tab" class:active={activeTab === 'profiles'} on:click={() => activeTab = 'profiles'}>Profiles</button>
    </div>

    {#if activeTab === 'display'}
      <div class="setting-group">
        <span class="setting-label">Theme</span>
        <div class="btn-group">
          <button class="opt" class:active={$theme === 'dark'} on:click={() => $theme = 'dark'}>Dark</button>
          <button class="opt" class:active={$theme === 'light'} on:click={() => $theme = 'light'}>Light</button>
        </div>
      </div>
      <div class="setting-group">
        <span class="setting-label">Unit System</span>
        <div class="btn-group">
          <button class="opt" class:active={$unitSystem === 'EU'} on:click={() => $unitSystem = 'EU'}>EU (SI)</button>
          <button class="opt" class:active={$unitSystem === 'US'} on:click={() => $unitSystem = 'US'}>US</button>
        </div>
      </div>
      <div class="setting-group">
        <span class="setting-label">Range Display</span>
        <div class="btn-group">
          <button class="opt" class:active={$rangeMode === 'optimal'} on:click={() => $rangeMode = 'optimal'}>Optimal</button>
          <button class="opt" class:active={$rangeMode === 'reference'} on:click={() => $rangeMode = 'reference'}>Reference</button>
          <button class="opt" class:active={$rangeMode === 'both'} on:click={() => $rangeMode = 'both'}>Both</button>
        </div>
      </div>
      <div class="setting-group">
        <span class="setting-label">Time Format</span>
        <div class="btn-group">
          <button class="opt" class:active={$timeFormat === '24h'} on:click={() => $timeFormat = '24h'}>24h</button>
          <button class="opt" class:active={$timeFormat === '12h'} on:click={() => $timeFormat = '12h'}>12h</button>
        </div>
      </div>

    {:else if activeTab === 'ai'}
      <div class="setting-group">
        <span class="setting-label">Provider</span>
        <div class="btn-group">
          {#each PROVIDERS as p}
            <button class="opt" class:active={$aiProvider === p.id} on:click={() => $aiProvider = p.id}>{p.label}</button>
          {/each}
        </div>
      </div>
      {#if $aiProvider !== 'ollama'}
        <div class="setting-group">
          <span class="setting-label">API Key</span>
          <input type="password" class="setting-input" bind:value={aiKey} placeholder="sk-..." on:blur={saveAIKey} />
        </div>
      {:else}
        <div class="setting-group">
          <span class="setting-label">Server URL</span>
          <input class="setting-input" value={localStorage.getItem('labcharts-ollama-url') || 'http://localhost:11434'}
            on:blur={e => localStorage.setItem('labcharts-ollama-url', (e.target as HTMLInputElement).value)} />
        </div>
      {/if}
      <div class="setting-group">
        <span class="setting-label">Model</span>
        <input class="setting-input" bind:value={aiModel} on:blur={saveAIModel} placeholder="Model ID" />
      </div>
      <div class="ai-status" class:connected={hasAIProvider()}>
        {hasAIProvider() ? '● Connected' : '○ Not configured'}
      </div>

    {:else if activeTab === 'profiles'}
      <div class="profile-list">
        {#each $profiles as profile (profile.id)}
          <button class="profile-item" class:active={$currentProfile === profile.id} on:click={() => switchProfile(profile.id)}>
            <span class="profile-name">{profile.name || profile.id}</span>
            {#if profile.sex}<span class="profile-sex">{profile.sex}</span>{/if}
          </button>
        {:else}
          <p style="color:var(--text3);font-size:13px">No profiles found. Load data or use demo to create one.</p>
        {/each}
      </div>
    {/if}

    <div class="setting-footer">
      <span style="font-size:11px;color:var(--text3);font-family:var(--font-mono)">v2 dev</span>
    </div>
  </div>
</div>

<style>
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; justify-content: center; align-items: center; }
  .settings-modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 90%; max-width: 480px; position: relative; }
  .modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; color: var(--text3); font-size: 24px; cursor: pointer; }
  .modal-close:hover { color: var(--text); }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
  .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--border); }
  .tab { padding: 6px 14px; background: none; border: none; border-bottom: 2px solid transparent; color: var(--text3); font-size: 13px; cursor: pointer; font-family: inherit; margin-bottom: -1px; }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .setting-group { margin-bottom: 14px; }
  .setting-label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 6px; }
  .btn-group { display: flex; gap: 4px; flex-wrap: wrap; }
  .opt { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text2); font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .opt:hover { border-color: var(--accent); color: var(--text); }
  .opt.active { background: var(--accent); border-color: var(--accent); color: white; font-weight: 600; }
  .setting-input { width: 100%; background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 8px 10px; border-radius: 6px; font-size: 13px; font-family: inherit; }
  .setting-input:focus { outline: none; border-color: var(--accent); }
  .ai-status { font-size: 12px; color: var(--text3); margin-top: 8px; }
  .ai-status.connected { color: var(--green); }
  .profile-list { display: flex; flex-direction: column; gap: 6px; }
  .profile-item { display: flex; justify-content: space-between; padding: 10px 14px; background: var(--bg3); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-family: inherit; color: var(--text); font-size: 13px; text-align: left; width: 100%; }
  .profile-item.active { border-color: var(--accent); }
  .profile-name { font-weight: 600; }
  .profile-sex { font-size: 11px; color: var(--text3); }
  .setting-footer { margin-top: 20px; text-align: center; }
</style>
