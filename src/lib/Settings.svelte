<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { theme, unitSystem, rangeMode, timeFormat } from './stores';
  import type { Theme, UnitSystem, RangeMode, TimeFormat } from './types';

  const dispatch = createEventDispatcher();
  function close() { dispatch('close'); }
  function onKeydown(e: KeyboardEvent) { if (e.key === 'Escape') close(); }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="modal-backdrop" on:click|self={close} role="dialog" tabindex="-1">
  <div class="settings-modal">
    <button class="modal-close" on:click={close}>&times;</button>
    <h2>Settings</h2>

    <div class="setting-group">
      <label class="setting-label">Theme</label>
      <div class="btn-group">
        <button class="opt" class:active={$theme === 'dark'} on:click={() => $theme = 'dark'}>Dark</button>
        <button class="opt" class:active={$theme === 'light'} on:click={() => $theme = 'light'}>Light</button>
      </div>
    </div>

    <div class="setting-group">
      <label class="setting-label">Unit System</label>
      <div class="btn-group">
        <button class="opt" class:active={$unitSystem === 'EU'} on:click={() => $unitSystem = 'EU'}>EU (SI)</button>
        <button class="opt" class:active={$unitSystem === 'US'} on:click={() => $unitSystem = 'US'}>US</button>
      </div>
    </div>

    <div class="setting-group">
      <label class="setting-label">Range Display</label>
      <div class="btn-group">
        <button class="opt" class:active={$rangeMode === 'optimal'} on:click={() => $rangeMode = 'optimal'}>Optimal</button>
        <button class="opt" class:active={$rangeMode === 'reference'} on:click={() => $rangeMode = 'reference'}>Reference</button>
        <button class="opt" class:active={$rangeMode === 'both'} on:click={() => $rangeMode = 'both'}>Both</button>
      </div>
    </div>

    <div class="setting-group">
      <label class="setting-label">Time Format</label>
      <div class="btn-group">
        <button class="opt" class:active={$timeFormat === '24h'} on:click={() => $timeFormat = '24h'}>24h</button>
        <button class="opt" class:active={$timeFormat === '12h'} on:click={() => $timeFormat = '12h'}>12h (AM/PM)</button>
      </div>
    </div>

    <div class="setting-footer">
      <span style="font-size:11px;color:var(--text3);font-family:var(--font-mono)">v2 dev</span>
    </div>
  </div>
</div>

<style>
  .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; display: flex; justify-content: center; align-items: center; }
  .settings-modal { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 24px; width: 90%; max-width: 440px; position: relative; }
  .modal-close { position: absolute; top: 12px; right: 16px; background: none; border: none; color: var(--text3); font-size: 24px; cursor: pointer; }
  .modal-close:hover { color: var(--text); }
  h2 { font-size: 18px; font-weight: 700; margin-bottom: 20px; }
  .setting-group { margin-bottom: 16px; }
  .setting-label { display: block; font-size: 13px; color: var(--text2); margin-bottom: 6px; }
  .btn-group { display: flex; gap: 4px; }
  .opt { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border); background: transparent; color: var(--text2); font-size: 13px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .opt:hover { border-color: var(--accent); color: var(--text); }
  .opt.active { background: var(--accent); border-color: var(--accent); color: white; font-weight: 600; }
  .setting-footer { margin-top: 24px; text-align: center; }
</style>
