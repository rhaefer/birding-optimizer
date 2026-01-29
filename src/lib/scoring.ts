import { EBirdHotspot, EBirdObservation, HotspotRecommendation, SpeciesSighting } from '@/types';
import { calculateDistance } from './distance';

interface ScoringConfig {
  // Weight factors for the scoring algorithm
  newSpeciesWeight: number;      // How much to value number of new species (default: 10)
  recencyWeight: number;         // How much to value recent sightings (default: 2)
  distancePenalty: number;       // How much to penalize distance (default: 0.5)
  frequencyBonus: number;        // Bonus for frequently seen species (default: 1)
}

const DEFAULT_CONFIG: ScoringConfig = {
  newSpeciesWeight: 10,
  recencyWeight: 2,
  distancePenalty: 0.5,
  frequencyBonus: 1,
};

/**
 * Normalize a species name for comparison
 * Handles case differences, extra whitespace, and common variations
 */
function normalizeSpeciesName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['']/g, "'") // Normalize apostrophes
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Check if a species has already been seen by the user
 * Matches against species code, common name, and scientific name
 */
function hasUserSeenSpecies(
  obs: EBirdObservation,
  userSpeciesSet: Set<string>,
  userSpeciesNormalized: Set<string>
): boolean {
  // Check species code
  if (userSpeciesSet.has(obs.speciesCode)) {
    return true;
  }

  // Check common name (normalized)
  const normalizedComName = normalizeSpeciesName(obs.comName);
  if (userSpeciesNormalized.has(normalizedComName)) {
    return true;
  }

  // Check scientific name (normalized)
  const normalizedSciName = normalizeSpeciesName(obs.sciName);
  if (userSpeciesNormalized.has(normalizedSciName)) {
    return true;
  }

  return false;
}

/**
 * Calculate the recommendation score for a hotspot
 * Higher scores indicate better recommendations
 */
export function calculateHotspotScore(
  hotspot: EBirdHotspot,
  observations: EBirdObservation[],
  userSpecies: Set<string>,
  userLat: number,
  userLng: number,
  config: Partial<ScoringConfig> = {}
): HotspotRecommendation {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Calculate distance
  const distance = calculateDistance(userLat, userLng, hotspot.lat, hotspot.lng);

  // Create a normalized set for fuzzy matching on common names
  const userSpeciesNormalized = new Set(
    Array.from(userSpecies).map(normalizeSpeciesName)
  );

  // Find species at this hotspot that the user hasn't seen
  const speciesMap = new Map<string, { obs: EBirdObservation; count: number }>();

  for (const obs of observations) {
    if (!hasUserSeenSpecies(obs, userSpecies, userSpeciesNormalized)) {
      const existing = speciesMap.get(obs.speciesCode);
      if (existing) {
        existing.count++;
        // Keep the most recent observation
        if (new Date(obs.obsDt) > new Date(existing.obs.obsDt)) {
          existing.obs = obs;
        }
      } else {
        speciesMap.set(obs.speciesCode, { obs, count: 1 });
      }
    }
  }

  // Convert to SpeciesSighting array
  const potentialNewSpecies: SpeciesSighting[] = Array.from(speciesMap.entries()).map(
    ([speciesCode, { obs, count }]) => ({
      speciesCode,
      comName: obs.comName,
      sciName: obs.sciName,
      lastSeen: obs.obsDt,
      count: obs.howMany,
      frequency: count / observations.length, // Rough frequency estimate
    })
  );

  // Sort by recency (most recent first)
  potentialNewSpecies.sort(
    (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
  );

  // Calculate score
  let score = 0;

  // Base score from number of new species
  score += potentialNewSpecies.length * cfg.newSpeciesWeight;

  // Recency bonus: add points for recently seen species
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const species of potentialNewSpecies) {
    const daysAgo = (now - new Date(species.lastSeen).getTime()) / dayMs;

    // More recent sightings get higher bonus (max 2 points for today, 0 for 30 days ago)
    const recencyBonus = Math.max(0, cfg.recencyWeight * (1 - daysAgo / 30));
    score += recencyBonus;

    // Frequency bonus
    if (species.frequency && species.frequency > 0.1) {
      score += cfg.frequencyBonus * species.frequency;
    }
  }

  // Distance penalty: reduce score for farther locations
  // Penalty increases as distance increases
  const distancePenaltyValue = distance * cfg.distancePenalty * 0.1;
  score = Math.max(0, score - distancePenaltyValue);

  return {
    hotspot,
    distance,
    potentialNewSpecies,
    score: Math.round(score * 100) / 100, // Round to 2 decimal places
  };
}

/**
 * Rank hotspots by recommendation score
 */
export function rankHotspots(
  recommendations: HotspotRecommendation[],
  minNewSpecies: number = 1
): HotspotRecommendation[] {
  return recommendations
    .filter((rec) => rec.potentialNewSpecies.length >= minNewSpecies)
    .sort((a, b) => b.score - a.score);
}

/**
 * Get unique species across all recommendations
 */
export function getUniqueNewSpecies(
  recommendations: HotspotRecommendation[]
): SpeciesSighting[] {
  const speciesMap = new Map<string, SpeciesSighting>();

  for (const rec of recommendations) {
    for (const species of rec.potentialNewSpecies) {
      const existing = speciesMap.get(species.speciesCode);
      if (!existing || new Date(species.lastSeen) > new Date(existing.lastSeen)) {
        speciesMap.set(species.speciesCode, species);
      }
    }
  }

  return Array.from(speciesMap.values()).sort(
    (a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
  );
}

/**
 * Filter recommendations by distance
 */
export function filterByDistance(
  recommendations: HotspotRecommendation[],
  maxDistanceKm: number
): HotspotRecommendation[] {
  return recommendations.filter((rec) => rec.distance <= maxDistanceKm);
}

/**
 * Get statistics about recommendations
 */
export function getRecommendationStats(recommendations: HotspotRecommendation[]) {
  if (recommendations.length === 0) {
    return {
      totalHotspots: 0,
      totalUniqueNewSpecies: 0,
      avgNewSpeciesPerHotspot: 0,
      closestHotspot: null,
      bestHotspot: null,
    };
  }

  const uniqueSpecies = getUniqueNewSpecies(recommendations);
  const totalNewSpecies = recommendations.reduce(
    (sum, rec) => sum + rec.potentialNewSpecies.length,
    0
  );

  const closestHotspot = [...recommendations].sort((a, b) => a.distance - b.distance)[0];
  const bestHotspot = [...recommendations].sort((a, b) => b.score - a.score)[0];

  return {
    totalHotspots: recommendations.length,
    totalUniqueNewSpecies: uniqueSpecies.length,
    avgNewSpeciesPerHotspot: Math.round((totalNewSpecies / recommendations.length) * 10) / 10,
    closestHotspot,
    bestHotspot,
  };
}
