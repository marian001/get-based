// Reactive stores — replaces v1's mutable state object
import { writable, derived } from 'svelte/store';
import type { UnitSystem, RangeMode, Theme, TimeFormat, ProfileSex, ImportedData, Profile } from './types';

// ── App settings ──
export const unitSystem = writable<UnitSystem>('EU');
export const rangeMode = writable<RangeMode>('optimal');
export const theme = writable<Theme>((localStorage.getItem('labcharts-theme') as Theme) || 'dark');
export const timeFormat = writable<TimeFormat>((localStorage.getItem('labcharts-time-format') as TimeFormat) || '24h');

// ── Profile ──
export const currentProfile = writable<string>('default');
export const profileSex = writable<ProfileSex>(null);
export const profileDob = writable<string | null>(null);
export const profiles = writable<Profile[]>([]);

// ── Data ──
export const importedData = writable<ImportedData>({
  entries: [],
  supplements: [],
  healthGoals: [],
  diagnoses: null,
  diet: null,
  exercise: null,
  sleepRest: null,
  lightCircadian: null,
  stress: null,
  loveLife: null,
  environment: null,
  customMarkers: {},
  markerNotes: {},
  changeHistory: [],
  genetics: null,
  menstrualCycle: null,
  biometrics: null,
});

// ── Persistence helper — saves importedData to v1 localStorage + triggers sync ──
export function persistImportedData() {
  const pid = localStorage.getItem('labcharts-current-profile') || 'default';
  const unsub = importedData.subscribe(d => localStorage.setItem(`labcharts-${pid}-imported`, JSON.stringify(d)));
  unsub();
  // Trigger sync if available
  try { import('./sync').then(m => m.onDataSaved()); } catch {}
}

// ── Persist theme changes ──
theme.subscribe(t => {
  localStorage.setItem('labcharts-theme', t);
  document.documentElement.dataset.theme = t;
});

timeFormat.subscribe(f => {
  localStorage.setItem('labcharts-time-format', f);
});
