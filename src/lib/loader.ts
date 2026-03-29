// Data loader — reads v1 localStorage or loads demo data
import { importedData, profileSex, profileDob, currentProfile, profiles, unitSystem } from './stores';
import type { ImportedData, Profile, UnitSystem } from './types';

/** Storage key pattern matching v1 */
function storageKey(profileId: string, suffix: string): string {
  return `labcharts-${profileId}-${suffix}`;
}

/** Load a profile's data from v1 localStorage */
export function loadProfile(profileId: string) {
  currentProfile.set(profileId);

  // Load imported data
  const raw = localStorage.getItem(storageKey(profileId, 'imported'));
  if (raw) {
    try {
      const data: ImportedData = JSON.parse(raw);
      importedData.set(data);
    } catch {
      importedData.set({ entries: {}, customMarkers: {}, markerNotes: {}, changeHistory: [], genetics: null, menstrualCycle: null, biometrics: null });
    }
  }

  // Load profile metadata
  const profileList = loadProfiles();
  const profile = profileList.find(p => p.id === profileId);
  if (profile) {
    profileSex.set(profile.sex || null);
    profileDob.set(profile.dob || null);
  }

  // Load unit system
  const units = localStorage.getItem(storageKey(profileId, 'units'));
  if (units === 'US' || units === 'EU') {
    unitSystem.set(units as UnitSystem);
  }
}

/** Load profile list from v1 localStorage */
export function loadProfiles(): Profile[] {
  try {
    const raw = localStorage.getItem('labcharts-profiles');
    if (raw) {
      const list = JSON.parse(raw);
      profiles.set(list);
      return list;
    }
  } catch {}
  return [];
}

/** Auto-detect and load the current profile */
export function autoLoad() {
  const profileList = loadProfiles();

  // Find current profile from v1
  const current = localStorage.getItem('labcharts-current-profile') || 'default';

  if (profileList.length > 0) {
    // Load the current profile or the first one
    const target = profileList.find(p => p.id === current) ? current : profileList[0].id;
    loadProfile(target);
  } else {
    // No profiles — check for legacy default profile data
    const raw = localStorage.getItem(storageKey('default', 'imported'));
    if (raw) loadProfile('default');
  }
}

/** Load demo data from data/ directory */
export async function loadDemo(sex: 'male' | 'female' = 'male') {
  const file = sex === 'female' ? '/data/demo-female.json' : '/data/demo-male.json';
  const resp = await fetch(file);
  if (!resp.ok) throw new Error('Could not load demo data');
  const data = await resp.json();

  // Demo files have { entries, supplements, ... } at top level
  importedData.set(data);
  profileSex.set(sex);
  currentProfile.set('demo');
}
