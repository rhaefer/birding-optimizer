/**
 * Calculate the distance between two points using the Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Convert kilometers to miles
 */
export function kmToMiles(km: number): number {
  return km * 0.621371;
}

/**
 * Convert miles to kilometers
 */
export function milesToKm(miles: number): number {
  return miles * 1.60934;
}

/**
 * Format distance for display
 * @param km - Distance in kilometers
 * @param useMiles - Whether to display in miles
 */
export function formatDistance(km: number, useMiles: boolean = false): string {
  if (useMiles) {
    const miles = kmToMiles(km);
    return `${miles.toFixed(1)} mi`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Check if a point is within a certain distance from another point
 */
export function isWithinDistance(
  userLat: number,
  userLng: number,
  pointLat: number,
  pointLng: number,
  maxDistanceKm: number
): boolean {
  const distance = calculateDistance(userLat, userLng, pointLat, pointLng);
  return distance <= maxDistanceKm;
}

/**
 * Sort locations by distance from a point
 */
export function sortByDistance<T extends { lat: number; lng: number }>(
  locations: T[],
  fromLat: number,
  fromLng: number
): Array<T & { distance: number }> {
  return locations
    .map((loc) => ({
      ...loc,
      distance: calculateDistance(fromLat, fromLng, loc.lat, loc.lng),
    }))
    .sort((a, b) => a.distance - b.distance);
}
