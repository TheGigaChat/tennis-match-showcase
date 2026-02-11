const KM_PER_MILE = 1.609344;

export function kmToMiles(km: number, digits = 1): number {
  if (!Number.isFinite(km)) return 0;
  const miles = km / KM_PER_MILE;
  const factor = Math.pow(10, digits);
  return Math.round(miles * factor) / factor;
}

export function milesToKm(miles: number, digits = 0): number {
  if (!Number.isFinite(miles)) return 0;
  const km = miles * KM_PER_MILE;
  const factor = Math.pow(10, digits);
  return Math.round(km * factor) / factor;
}
