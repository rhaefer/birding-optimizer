import {
  EBirdObservation,
  EBirdHotspot,
} from '@/types';

const EBIRD_API_BASE = 'https://api.ebird.org/v2';

interface EBirdClientConfig {
  apiKey: string;
}

export class EBirdClient {
  private apiKey: string;

  constructor(config: EBirdClientConfig) {
    this.apiKey = config.apiKey;
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const url = new URL(`${EBIRD_API_BASE}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'X-eBirdApiToken': this.apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid eBird API key');
      }
      if (response.status === 429) {
        throw new Error('eBird API rate limit exceeded. Please wait and try again.');
      }
      throw new Error(`eBird API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get recent observations for a region
   * @param regionCode - Region code (e.g., "US-CO" for Colorado)
   * @param back - Number of days back to fetch (1-30)
   */
  async getRecentObservations(
    regionCode: string,
    back: number = 14
  ): Promise<EBirdObservation[]> {
    return this.fetch<EBirdObservation[]>(`/data/obs/${regionCode}/recent`, {
      back: Math.min(Math.max(back, 1), 30),
    });
  }

  /**
   * Get recent observations near a location
   * @param lat - Latitude
   * @param lng - Longitude
   * @param dist - Distance in km (max 50)
   * @param back - Number of days back (1-30)
   */
  async getRecentNearbyObservations(
    lat: number,
    lng: number,
    dist: number = 25,
    back: number = 14
  ): Promise<EBirdObservation[]> {
    return this.fetch<EBirdObservation[]>('/data/obs/geo/recent', {
      lat,
      lng,
      dist: Math.min(dist, 50),
      back: Math.min(Math.max(back, 1), 30),
    });
  }

  /**
   * Get hotspots near a location
   * @param lat - Latitude
   * @param lng - Longitude
   * @param dist - Distance in km (max 50)
   */
  async getNearbyHotspots(
    lat: number,
    lng: number,
    dist: number = 25
  ): Promise<EBirdHotspot[]> {
    return this.fetch<EBirdHotspot[]>('/ref/hotspot/geo', {
      lat,
      lng,
      dist: Math.min(dist, 50),
      fmt: 'json',
    });
  }

  /**
   * Get recent observations at a specific hotspot
   * @param locId - Location ID of the hotspot
   * @param back - Number of days back (1-30)
   */
  async getHotspotObservations(
    locId: string,
    back: number = 14
  ): Promise<EBirdObservation[]> {
    return this.fetch<EBirdObservation[]>(`/data/obs/${locId}/recent`, {
      back: Math.min(Math.max(back, 1), 30),
    });
  }

  /**
   * Get species observed at a hotspot
   * Returns unique species codes observed at the location
   */
  async getHotspotSpecies(
    locId: string,
    back: number = 14
  ): Promise<EBirdObservation[]> {
    const observations = await this.getHotspotObservations(locId, back);

    // Deduplicate by species code, keeping the most recent observation
    const speciesMap = new Map<string, EBirdObservation>();

    for (const obs of observations) {
      const existing = speciesMap.get(obs.speciesCode);
      if (!existing || new Date(obs.obsDt) > new Date(existing.obsDt)) {
        speciesMap.set(obs.speciesCode, obs);
      }
    }

    return Array.from(speciesMap.values());
  }

  /**
   * Validate the API key by making a simple request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Make a simple request to check if the key is valid
      await this.fetch<EBirdHotspot[]>('/ref/hotspot/geo', {
        lat: 40.0,
        lng: -105.0,
        dist: 1,
        fmt: 'json',
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid')) {
        return false;
      }
      throw error;
    }
  }
}

// Helper function to create a client instance
export function createEBirdClient(apiKey: string): EBirdClient {
  return new EBirdClient({ apiKey });
}
