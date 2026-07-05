import type { Institution, Zone } from './types';

/**
 * Deterministic zone lookup by bounding box. Returns the first zone that
 * contains the point, or null when nothing matches.
 */
export function resolveZone(
  lat: number,
  lng: number,
  zones: Zone[],
): Zone | null {
  return (
    zones.find(
      (z) =>
        lat >= z.min_lat &&
        lat <= z.max_lat &&
        lng >= z.min_lng &&
        lng <= z.max_lng,
    ) ?? null
  );
}

/**
 * MVP routing: match by category first, then by zone coverage.
 * Returns the assigned institution id, or null when unassigned.
 *
 * Prefers an institution that covers both the category and the zone; if none
 * covers the zone, falls back to any institution covering the category.
 */
export function resolveInstitution(
  category: string,
  zoneId: string | null,
  institutions: Institution[],
): string | null {
  const approved = institutions.filter((i) => i.status === 'approved');
  const byCategory = approved.filter((i) =>
    i.category_coverage.includes(category),
  );

  if (byCategory.length === 0) return null;

  if (zoneId) {
    const byZone = byCategory.find((i) => i.zone_coverage.includes(zoneId));
    if (byZone) return byZone.id;
  }

  // Category matched but no zone match: assign the first category handler.
  return byCategory[0].id;
}
