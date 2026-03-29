// AI provider abstraction for v2
// Supports streaming (chat) and non-streaming (PDF import) via callAI()
import { writable, get } from 'svelte/store';
import type { AIProvider } from './types';

const PROVIDER_KEY = 'labcharts-ai-provider';
const KEY_CACHE: Record<string, string> = {};

function getCachedKey(k: string): string {
  if (KEY_CACHE[k] !== undefined) return KEY_CACHE[k];
  const v = localStorage.getItem(k) || '';
  KEY_CACHE[k] = v;
  return v;
}

// ── Provider state ──
export const aiProvider = writable<AIProvider>((localStorage.getItem(PROVIDER_KEY) as AIProvider) || 'openrouter');
export const aiPaused = writable(localStorage.getItem('labcharts-ai-paused') === 'true');

aiProvider.subscribe(p => localStorage.setItem(PROVIDER_KEY, p));
aiPaused.subscribe(v => localStorage.setItem('labcharts-ai-paused', v ? 'true' : 'false'));

// ── Key/model getters ──
export function getApiKey(): string { return getCachedKey('labcharts-api-key'); }
export function getOpenRouterKey(): string { return getCachedKey('labcharts-openrouter-key'); }
export function getVeniceKey(): string { return getCachedKey('labcharts-venice-key'); }
export function getActiveModelId(): string {
  const p = get(aiProvider);
  if (p === 'ollama') return localStorage.getItem('labcharts-ollama-model') || 'llama3.2';
  if (p === 'venice') return localStorage.getItem('labcharts-venice-model') || 'llama-3.3-70b';
  if (p === 'openrouter') return localStorage.getItem('labcharts-openrouter-model') || 'anthropic/claude-sonnet-4-6';
  return localStorage.getItem('labcharts-anthropic-model') || 'claude-sonnet-4-6';
}

export function hasAIProvider(): boolean {
  const p = get(aiProvider);
  if (p === 'ollama') return true;
  if (p === 'venice') return !!getVeniceKey();
  if (p === 'openrouter') return !!getOpenRouterKey();
  return !!getApiKey();
}

// ── Streaming SSE reader ──
async function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onStream?: (text: string) => void
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const decoder = new TextDecoder();
  let fullText = '';
  let inputTokens = 0, outputTokens = 0;
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        // OpenAI format
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) { fullText += delta; onStream?.(fullText); }
        // Anthropic format
        if (parsed.type === 'content_block_delta') {
          const t = parsed.delta?.text;
          if (t) { fullText += t; onStream?.(fullText); }
        }
        // Usage
        if (parsed.usage) {
          inputTokens = parsed.usage.prompt_tokens || parsed.usage.input_tokens || inputTokens;
          outputTokens = parsed.usage.completion_tokens || parsed.usage.output_tokens || outputTokens;
        }
      } catch {}
    }
  }
  return { text: fullText, inputTokens, outputTokens };
}

// ── Main API call ──
export interface CallAIOptions {
  system?: string;
  messages: { role: string; content: string }[];
  maxTokens?: number;
  onStream?: (text: string) => void;
  signal?: AbortSignal;
}

export async function callAI(opts: CallAIOptions): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number } }> {
  const provider = get(aiProvider);
  const model = getActiveModelId();
  const stream = !!opts.onStream;

  if (provider === 'anthropic') {
    const key = getApiKey();
    if (!key) throw new Error('No Anthropic API key');
    const body: any = {
      model, messages: opts.messages, max_tokens: opts.maxTokens || 4096, stream,
    };
    if (opts.system) body.system = opts.system;
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: opts.signal,
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
    if (stream) {
      const { text, inputTokens, outputTokens } = await readSSEStream(res.body!.getReader(), opts.onStream);
      return { text, usage: { inputTokens, outputTokens } };
    }
    const data = await res.json();
    return { text: data.content?.[0]?.text || '', usage: { inputTokens: data.usage?.input_tokens || 0, outputTokens: data.usage?.output_tokens || 0 } };
  }

  // OpenAI-compatible (OpenRouter, Venice, Ollama)
  let url: string, key: string;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (provider === 'openrouter') {
    url = 'https://openrouter.ai/api/v1/chat/completions';
    key = getOpenRouterKey();
    if (!key) throw new Error('No OpenRouter API key');
    headers['HTTP-Referer'] = 'https://app.getbased.health';
    headers['X-Title'] = 'getbased';
  } else if (provider === 'venice') {
    url = 'https://api.venice.ai/api/v1/chat/completions';
    key = getVeniceKey();
    if (!key) throw new Error('No Venice API key');
  } else {
    const ollamaUrl = localStorage.getItem('labcharts-ollama-url') || 'http://localhost:11434';
    url = ollamaUrl.replace(/\/$/, '') + '/v1/chat/completions';
    key = 'ollama';
  }
  headers['Authorization'] = `Bearer ${key}`;

  const messages = opts.system
    ? [{ role: 'system', content: opts.system }, ...opts.messages]
    : opts.messages;

  const res = await fetch(url, {
    method: 'POST', signal: opts.signal, headers,
    body: JSON.stringify({ model, messages, max_tokens: opts.maxTokens || 4096, stream, temperature: 0.3 }),
  });
  if (!res.ok) throw new Error(`${provider} ${res.status}: ${(await res.text()).slice(0, 200)}`);

  if (stream) {
    const { text, inputTokens, outputTokens } = await readSSEStream(res.body!.getReader(), opts.onStream);
    return { text, usage: { inputTokens, outputTokens } };
  }
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content || '', usage: { inputTokens: data.usage?.prompt_tokens || 0, outputTokens: data.usage?.completion_tokens || 0 } };
}
