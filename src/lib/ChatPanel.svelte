<script lang="ts">
  import { callAI, hasAIProvider, aiPaused } from './ai';
  import { activeData } from './data';
  import { importedData, profileSex } from './stores';
  import { formatValue, getStatus, hasCardContent } from './utils';
  import type { ActiveMarker } from './types';

  let open = false;
  let messages: { role: string; content: string }[] = [];
  let input = '';
  let streaming = false;
  let streamText = '';
  let abortCtrl: AbortController | null = null;

  function toggle() { open = !open; }

  function buildContext(): string {
    const parts: string[] = [];
    const data = activeData; // use derived store value
    let dataVal: any;
    const unsub = data.subscribe(d => dataVal = d); unsub();

    // Lab summary
    const flagged: string[] = [];
    const normal: string[] = [];
    for (const [catKey, cat] of Object.entries(dataVal.categories)) {
      for (const [mKey, marker] of Object.entries(cat.markers)) {
        const m = marker as ActiveMarker;
        const latest = m.values?.filter(v => v !== null).pop();
        if (latest == null) continue;
        const s = getStatus(latest, m.refMin, m.refMax);
        const line = `${m.name}: ${formatValue(latest)} ${m.unit} (ref ${m.refMin}-${m.refMax})`;
        if (s !== 'normal') flagged.push(`⚠ ${line} [${s}]`);
        else normal.push(line);
      }
    }
    if (flagged.length) parts.push('OUT OF RANGE:\n' + flagged.join('\n'));
    if (normal.length) parts.push('IN RANGE:\n' + normal.join('\n'));

    // Context cards
    let importData: any;
    const unsub2 = importedData.subscribe(d => importData = d); unsub2();
    const cards = ['healthGoals', 'diagnoses', 'diet', 'exercise', 'sleepRest', 'lightCircadian', 'stress', 'environment'];
    for (const key of cards) {
      const card = importData[key];
      if (hasCardContent(card)) {
        parts.push(`${key.toUpperCase()}: ${JSON.stringify(card)}`);
      }
    }

    // Sex
    let sex: any;
    const unsub3 = profileSex.subscribe(s => sex = s); unsub3();
    if (sex) parts.push(`Sex: ${sex}`);

    return parts.join('\n\n');
  }

  async function send() {
    if (!input.trim() || streaming) return;
    if (!hasAIProvider()) { messages = [...messages, { role: 'system', content: 'No AI provider configured. Go to Settings to set up an API key.' }]; return; }

    const userMsg = input.trim();
    input = '';
    messages = [...messages, { role: 'user', content: userMsg }];

    streaming = true;
    streamText = '';
    abortCtrl = new AbortController();

    try {
      const context = buildContext();
      const system = `You are a health data assistant for a blood work dashboard called getbased. Analyze the user's lab results and health context to provide personalized insights. Be concise and specific. Reference actual marker values. You are NOT a doctor — always recommend consulting a physician for medical decisions.\n\nUSER DATA:\n${context}`;

      const result = await callAI({
        system,
        messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
        onStream: (text) => { streamText = text; },
        signal: abortCtrl.signal,
      });

      messages = [...messages, { role: 'assistant', content: result.text }];
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        messages = [...messages, { role: 'system', content: `Error: ${e.message}` }];
      }
    } finally {
      streaming = false;
      streamText = '';
      abortCtrl = null;
    }
  }

  function stop() { abortCtrl?.abort(); }
  function clear() { messages = []; }
  function onKeydown(e: KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }
</script>

<!-- FAB -->
<button class="chat-fab" class:open on:click={toggle}>
  {open ? '✕' : '💬'}
</button>

{#if open}
  <div class="chat-panel">
    <div class="chat-header">
      <span class="chat-title">AI Chat</span>
      <button class="chat-clear" on:click={clear}>Clear</button>
    </div>

    <div class="chat-messages">
      {#each messages as msg (msg)}
        <div class="chat-msg {msg.role}">
          <div class="msg-content">{msg.content}</div>
        </div>
      {/each}
      {#if streaming}
        <div class="chat-msg assistant">
          <div class="msg-content">{streamText || '...'}</div>
        </div>
      {/if}
      {#if messages.length === 0 && !streaming}
        <div class="chat-empty">
          <p>Ask about your lab results, health context, or any marker.</p>
          <p style="font-size:11px;color:var(--text3);margin-top:8px">Your data is sent to your configured AI provider.</p>
        </div>
      {/if}
    </div>

    <div class="chat-input-area">
      {#if streaming}
        <button class="chat-stop" on:click={stop}>Stop</button>
      {/if}
      <div class="chat-input-wrap">
        <textarea
          class="chat-input"
          placeholder="Ask about your labs..."
          bind:value={input}
          on:keydown={onKeydown}
          disabled={streaming}
          rows="1"
        ></textarea>
        <button class="chat-send" on:click={send} disabled={streaming || !input.trim()}>→</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .chat-fab { position: fixed; bottom: 24px; right: 24px; width: 52px; height: 52px; border-radius: 50%; border: none; background: var(--accent); color: white; font-size: 22px; cursor: pointer; box-shadow: var(--shadow-lg); z-index: 90; transition: all 0.2s; }
  .chat-fab:hover { transform: scale(1.05); }
  .chat-fab.open { background: var(--bg3); color: var(--text); }

  .chat-panel { position: fixed; bottom: 88px; right: 24px; width: 400px; height: 520px; background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; z-index: 90; display: flex; flex-direction: column; box-shadow: var(--shadow-lg); }

  .chat-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .chat-title { font-weight: 600; font-size: 14px; }
  .chat-clear { background: none; border: none; color: var(--text3); cursor: pointer; font-size: 12px; font-family: inherit; }
  .chat-clear:hover { color: var(--text); }

  .chat-messages { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }
  .chat-msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; word-wrap: break-word; white-space: pre-wrap; }
  .chat-msg.user { align-self: flex-end; background: var(--accent); color: white; border-bottom-right-radius: 4px; }
  .chat-msg.assistant { align-self: flex-start; background: var(--bg3); border-bottom-left-radius: 4px; }
  .chat-msg.system { align-self: center; background: transparent; color: var(--text3); font-size: 12px; text-align: center; }
  .chat-empty { text-align: center; color: var(--text3); padding: 40px 16px; font-size: 13px; }

  .chat-input-area { padding: 12px 16px; border-top: 1px solid var(--border); }
  .chat-stop { width: 100%; padding: 6px; margin-bottom: 8px; border-radius: 6px; border: 1px solid var(--red); background: transparent; color: var(--red); cursor: pointer; font-size: 12px; font-family: inherit; }
  .chat-input-wrap { display: flex; gap: 8px; }
  .chat-input { flex: 1; background: var(--bg3); border: 1px solid var(--border); color: var(--text); padding: 10px 12px; border-radius: 8px; font-size: 14px; font-family: inherit; resize: none; }
  .chat-input:focus { outline: none; border-color: var(--accent); }
  .chat-send { width: 40px; border-radius: 8px; border: none; background: var(--accent); color: white; font-size: 18px; cursor: pointer; }
  .chat-send:disabled { opacity: 0.3; cursor: not-allowed; }

  @media (max-width: 480px) {
    .chat-panel { width: calc(100vw - 16px); right: 8px; bottom: 80px; height: 60vh; }
  }
</style>
