// Sync — Evolu CRDT sync layer for v2
// Opt-in E2E encrypted cross-device sync via Evolu
import { writable, get } from 'svelte/store';
import { importedData, currentProfile, profiles } from './stores';

const SYNC_KEY = 'labcharts-sync-enabled';
const RELAY_KEY = 'labcharts-sync-relay';
const DEFAULT_RELAY = 'wss://sync.getbased.health';

// ── Sync status store ──
export interface SyncStatus {
  enabled: boolean;
  relay: 'unknown' | 'connected' | 'unreachable';
  push: 'idle' | 'pending' | 'confirmed' | 'error';
  pull: 'idle' | 'pulling' | 'received';
  lastError: string | null;
}

export const syncStatus = writable<SyncStatus>({
  enabled: localStorage.getItem(SYNC_KEY) === 'true',
  relay: 'unknown',
  push: 'idle',
  pull: 'idle',
  lastError: null,
});

// ── Evolu instance ──
let evolu: any = null;
let profileQuery: any = null;
let appOwner: any = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;

export function isSyncEnabled(): boolean {
  return localStorage.getItem(SYNC_KEY) === 'true';
}

export function getSyncRelay(): string {
  return localStorage.getItem(RELAY_KEY) || DEFAULT_RELAY;
}

export function setSyncRelay(url: string) {
  localStorage.setItem(RELAY_KEY, url);
}

export function getMnemonic(): string | null {
  return appOwner?.mnemonic || null;
}

// ── Init ──
export async function initSync() {
  if (!isSyncEnabled() || evolu) return;

  try {
    const { createEvolu, id, nullOr, SimpleName, NonEmptyString, evoluWebDeps } =
      await import('../../vendor/evolu/evolu-bundle.js');

    const ProfileDataId = id('ProfileData');
    const Schema = {
      profileData: {
        id: ProfileDataId,
        profileId: NonEmptyString,
        dataJson: NonEmptyString,
        syncedAt: nullOr(NonEmptyString),
      },
    };

    const relay = getSyncRelay();
    evolu = createEvolu(evoluWebDeps)(Schema, {
      name: SimpleName.orThrow('getbased4'),
      reloadUrl: window.location.pathname,
      transports: [{ type: 'WebSocket', url: relay }],
    });

    profileQuery = evolu.createQuery((db: any) =>
      db.selectFrom('profileData').selectAll().where('isDeleted', 'is not', 1)
    );

    // Subscribe to sync updates
    evolu.subscribeQuery(profileQuery)(() => {
      onSyncReceived();
    });

    await evolu.loadQuery(profileQuery);
    appOwner = await evolu.appOwner;

    // Poll as safety net
    pollInterval = setInterval(() => {
      if (!evolu || !profileQuery) return;
      onSyncReceived();
    }, 30000);

    // Relay health check
    checkRelay();
    setInterval(checkRelay, 60000);

    syncStatus.update(s => ({ ...s, enabled: true }));
  } catch (e) {
    console.error('[sync] Init failed:', e);
    syncStatus.update(s => ({ ...s, lastError: String(e) }));
  }
}

// ── Enable / Disable ──
export async function enableSync() {
  localStorage.setItem(SYNC_KEY, 'true');
  await initSync();
  if (evolu) await pushCurrentProfile();
  syncStatus.update(s => ({ ...s, enabled: true }));
}

export async function disableSync() {
  localStorage.setItem(SYNC_KEY, 'false');
  if (pollInterval) clearInterval(pollInterval);
  evolu = null;
  profileQuery = null;
  appOwner = null;
  syncStatus.update(s => ({ ...s, enabled: false, relay: 'unknown', push: 'idle', pull: 'idle' }));
}

export async function restoreFromMnemonic(mnemonic: string): Promise<boolean> {
  if (!evolu) return false;
  try {
    await evolu.restoreAppOwner(mnemonic);
    return true;
  } catch {
    return false;
  }
}

// ── Push ──
export async function pushCurrentProfile() {
  if (!evolu || !profileQuery) return;
  const pid = get(currentProfile);
  const data = get(importedData);
  const profileList = get(profiles);
  const profile = profileList.find(p => p.id === pid);

  syncStatus.update(s => ({ ...s, push: 'pending' }));

  try {
    const payload = JSON.stringify({
      importedData: data,
      profile: profile || { id: pid },
      syncedAt: new Date().toISOString(),
    });

    // Find existing row or create new
    const rows = evolu.getQueryRows(profileQuery);
    const existing = rows?.find((r: any) => r.profileId === pid);

    if (existing) {
      evolu.update('profileData', { id: existing.id, dataJson: payload, syncedAt: new Date().toISOString() });
    } else {
      evolu.create('profileData', { profileId: pid, dataJson: payload, syncedAt: new Date().toISOString() });
    }

    localStorage.setItem(`labcharts-${pid}-sync-ts`, String(Date.now()));
    syncStatus.update(s => ({ ...s, push: 'confirmed' }));
  } catch (e) {
    syncStatus.update(s => ({ ...s, push: 'error', lastError: String(e) }));
  }
}

// ── Pull ──
async function onSyncReceived() {
  if (!evolu || !profileQuery) return;
  syncStatus.update(s => ({ ...s, pull: 'pulling' }));

  try {
    const rows = evolu.getQueryRows(profileQuery);
    if (!rows?.length) return;

    const pid = get(currentProfile);

    for (const row of rows) {
      const profileId = row.profileId;
      if (!profileId) continue;

      const remoteTs = row.syncedAt ? new Date(row.syncedAt).getTime() : 0;
      const localTs = parseInt(localStorage.getItem(`labcharts-${profileId}-sync-ts`) || '0', 10);

      if (remoteTs <= localTs) continue;

      // Remote is newer — parse and apply
      try {
        const payload = JSON.parse(row.dataJson);
        if (!payload.importedData) continue;

        // Save to localStorage
        localStorage.setItem(`labcharts-${profileId}-imported`, JSON.stringify(payload.importedData));
        localStorage.setItem(`labcharts-${profileId}-sync-ts`, String(remoteTs));

        // If active profile, update store
        if (profileId === pid) {
          importedData.set(payload.importedData);
        }
      } catch {}
    }
  } finally {
    syncStatus.update(s => ({ ...s, pull: 'received' }));
  }
}

// ── Hook — call after data saves ──
export function onDataSaved() {
  if (!isSyncEnabled() || !evolu) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => pushCurrentProfile(), 2000);
}

// ── Relay check ──
async function checkRelay() {
  try {
    const relay = getSyncRelay().replace('wss://', 'https://').replace('ws://', 'http://');
    const res = await fetch(relay, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
    syncStatus.update(s => ({ ...s, relay: 'connected' }));
  } catch {
    syncStatus.update(s => ({ ...s, relay: 'unreachable' }));
  }
}

// ── Relay connection check (exposed for settings UI) ──
export async function checkRelayConnection(): Promise<boolean> {
  try {
    const relay = getSyncRelay().replace('wss://', 'https://').replace('ws://', 'http://');
    const res = await fetch(relay, { method: 'HEAD', signal: AbortSignal.timeout(4000) });
    return true;
  } catch { return false; }
}
