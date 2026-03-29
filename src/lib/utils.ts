// Pure utility functions — no DOM, no side effects
import type { MarkerStatus } from './types';

export function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash) + str.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

export function getStatus(value: number | null | undefined, refMin: number | null, refMax: number | null): MarkerStatus {
  if (value === null || value === undefined) return 'missing';
  if (refMin == null && refMax == null) return 'normal';
  if (refMin != null && value < refMin) return 'low';
  if (refMax != null && value > refMax) return 'high';
  return 'normal';
}

export function getRangePosition(value: number | null | undefined, refMin: number | null, refMax: number | null): number | null {
  if (value === null || value === undefined) return null;
  if (refMin == null || refMax == null || refMax === refMin) return 50;
  return ((value - refMin) / (refMax - refMin)) * 100;
}

export interface TrendResult {
  arrow: string;
  cls: string;
}

export function getTrend(values: (number | null)[], refMin: number | null, refMax: number | null): TrendResult {
  const nn = values.filter((v): v is number => v !== null);
  if (nn.length < 2) return { arrow: '\u2014', cls: 'trend-stable' };
  const prev = nn[nn.length - 2];
  if (prev === 0) return { arrow: '\u2192', cls: 'trend-stable' };
  const curr = nn[nn.length - 1];
  const pct = ((curr - prev) / prev) * 100;
  if (Math.abs(pct) < 2) return { arrow: '\u2192', cls: 'trend-stable' };
  const dir = pct > 0 ? 'up' : 'down';
  const arrow = pct > 0 ? `\u2191 +${pct.toFixed(1)}%` : `\u2193 ${pct.toFixed(1)}%`;
  const status = getStatus(curr, refMin, refMax);
  let quality: string;
  if (status === 'high') quality = dir === 'down' ? 'good' : 'bad';
  else if (status === 'low') quality = dir === 'up' ? 'good' : 'bad';
  else quality = 'neutral';
  return { arrow, cls: `trend-${dir} trend-${quality}` };
}

export function formatValue(v: number | null | undefined): string {
  if (v === null || v === undefined) return '\u2014';
  if (Number.isInteger(v)) return v.toString();
  if (Math.abs(v) >= 100) return v.toFixed(0);
  if (Math.abs(v) >= 10) return v.toFixed(1);
  if (Math.abs(v) >= 1) return v.toFixed(2);
  return v.toFixed(3);
}

export interface RegressionResult {
  slope: number;
  intercept: number;
  r2: number;
}

export function linearRegression(points: number[]): RegressionResult {
  const n = points.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += points[i];
    sumXY += i * points[i]; sumX2 += i * i; sumY2 += points[i] * points[i];
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: points[0] || 0, r2: 0 };
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const ssTot = sumY2 - (sumY * sumY) / n;
  const ssRes = points.reduce((s, y, i) => { const e = y - (intercept + slope * i); return s + e * e; }, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, intercept, r2 };
}

export function hasCardContent(obj: Record<string, unknown> | null | undefined): boolean {
  if (!obj) return false;
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'note') { if (typeof val === 'string' && val.trim()) return true; }
    else if (Array.isArray(val)) { if (val.length > 0) return true; }
    else if (val != null && val !== '') return true;
  }
  return false;
}
