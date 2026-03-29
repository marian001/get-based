// Core types for getbased v2

/** Biomarker definition from schema */
export interface MarkerDef {
  name: string;
  unit: string;
  refMin: number;
  refMax: number;
  refMin_f?: number;
  refMax_f?: number;
  optimalMin?: number;
  optimalMax?: number;
  optimalMin_f?: number;
  optimalMax_f?: number;
  desc?: string;
}

/** Category of markers */
export interface CategoryDef {
  label: string;
  icon: string;
  markers: Record<string, MarkerDef>;
}

/** Full marker schema */
export type MarkerSchema = Record<string, CategoryDef>;

/** Marker status */
export type MarkerStatus = 'normal' | 'high' | 'low' | 'missing';

/** Unit system */
export type UnitSystem = 'EU' | 'US';

/** Range display mode */
export type RangeMode = 'optimal' | 'reference' | 'both';

/** Theme */
export type Theme = 'dark' | 'light';

/** Time format */
export type TimeFormat = '24h' | '12h';

/** Profile sex */
export type ProfileSex = 'male' | 'female' | null;

/** AI provider */
export type AIProvider = 'openrouter' | 'anthropic' | 'venice' | 'ollama';

/** Fitzpatrick skin type */
export type SkinType = 'I — very fair' | 'II — fair' | 'III — medium' | 'IV — olive' | 'V — brown' | 'VI — dark';

/** Marker value entry (aligned with dates array) */
export type MarkerValues = (number | null)[];

/** Active marker data (from getActiveData pipeline) */
export interface ActiveMarker extends MarkerDef {
  values: MarkerValues;
  singlePoint?: boolean;
  singleDateLabel?: string;
  phaseLabels?: string[];
}

/** Active data returned by the data pipeline */
export interface ActiveData {
  categories: Record<string, {
    label: string;
    icon: string;
    markers: Record<string, ActiveMarker>;
  }>;
  dateLabels: string[];
  dates: string[];
  phaseLabels?: string[];
}

/** Imported data stored per profile */
export interface ImportedData {
  entries: Record<string, any>;
  dates?: string[];
  customMarkers?: Record<string, any>;
  refOverrides?: Record<string, any>;
  categoryLabels?: Record<string, string>;
  categoryIcons?: Record<string, string>;
  markerLabels?: Record<string, string>;
  markerNotes?: Record<string, string>;
  changeHistory?: any[];
  biometrics?: {
    weight: { date: string; value: number; unit: string; source: string }[];
    bp: { date: string; sys: number; dia: number; source: string }[];
    pulse: { date: string; value: number; source: string }[];
  } | null;
  // Context cards
  healthGoals?: any;
  diagnoses?: any;
  diet?: any;
  exercise?: any;
  sleepRest?: any;
  lightCircadian?: any;
  stress?: any;
  loveLife?: any;
  environment?: any;
  // DNA
  genetics?: {
    snps?: Record<string, string>;
    apoe?: string;
    rawFormat?: string;
  } | null;
  // Supplements
  supplements?: any[];
  // Cycle
  menstrualCycle?: any;
}

/** Profile */
export interface Profile {
  id: string;
  name: string;
  sex: ProfileSex;
  dob?: string;
  country?: string;
  zip?: string;
  height?: number;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}
