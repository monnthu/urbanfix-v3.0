import type { ReportPriority, ReportStatus } from './types';

export const PRIORITY_STYLES: Record<ReportPriority, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export const STATUS_STYLES: Record<ReportStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700',
  assigned: 'bg-brand-100 text-brand-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  resolved: 'bg-green-100 text-green-800',
  unassigned: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: 'Submitted',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  unassigned: 'Unassigned',
  rejected: 'Rejected',
};

// Category marker colors for the map + legend (keyed by category id).
export const CATEGORY_COLORS: Record<string, string> = {
  flooding: '#2563eb',
  pothole: '#78350f',
  streetlight: '#f59e0b',
  garbage: '#16a34a',
  graffiti: '#db2777',
  water: '#0891b2',
  other: '#64748b',
};

export function categoryColor(id: string): string {
  return CATEGORY_COLORS[id] ?? CATEGORY_COLORS.other;
}

// Default map center (demo city). Overridden once reports/geolocation exist.
export const DEFAULT_CENTER: [number, number] = [40.7328, -73.9911];
export const DEFAULT_ZOOM = 12;
