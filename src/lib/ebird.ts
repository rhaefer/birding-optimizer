import {
  EBirdObservation,
  EBirdHotspot,
  EBirdTaxonomy,
  RareBirdAlert,
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
   * Get species observed at a hotspot (deduplicated)
   */
  async getHotspotSpecies(
    locId: string,
    back: number = 14
  ): Promise<EBirdObservation[]> {
    const observations = await this.getHotspotObservations(locId, back);

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
   * Get notable/rare observations near a location
   * These are observations flagged as rare or unusual for the area
   */
  async getNotableNearbyObservations(
    lat: number,
    lng: number,
    dist: number = 50,
    back: number = 14
  ): Promise<RareBirdAlert[]> {
    const observations = await this.fetch<EBirdObservation[]>('/data/obs/geo/recent/notable', {
      lat,
      lng,
      dist: Math.min(dist, 50),
      back: Math.min(Math.max(back, 1), 30),
      detail: 'simple',
    });

    return observations.map(obs => ({
      ...obs,
      locationPrivate: obs.locationPrivate ?? false,
    }));
  }

  /**
   * Get recent observations of a specific species near a location
   */
  async getSpeciesNearbyObservations(
    speciesCode: string,
    lat: number,
    lng: number,
    dist: number = 50,
    back: number = 30
  ): Promise<EBirdObservation[]> {
    return this.fetch<EBirdObservation[]>(`/data/obs/geo/recent/${speciesCode}`, {
      lat,
      lng,
      dist: Math.min(dist, 50),
      back: Math.min(Math.max(back, 1), 30),
    });
  }

  /**
   * Search eBird taxonomy by common or scientific name
   * Returns matching species entries
   */
  async searchTaxonomy(query: string, maxResults: number = 10): Promise<EBirdTaxonomy[]> {
    // Fetch full taxonomy - filtered server-side
    const all = await this.fetch<EBirdTaxonomy[]>('/ref/taxonomy/ebird', {
      fmt: 'json',
      locale: 'en',
      cat: 'species',
    });

    const lowerQuery = query.toLowerCase().trim();

    // Score and filter matches
    const scored = all
      .filter(t => t.category === 'species')
      .map(t => {
        const comLower = t.comName.toLowerCase();
        const sciLower = t.sciName.toLowerCase();
        let score = 0;

        if (comLower === lowerQuery) score = 100;
        else if (comLower.startsWith(lowerQuery)) score = 80;
        else if (comLower.includes(lowerQuery)) score = 60;
        else if (sciLower.includes(lowerQuery)) score = 40;
        else return null;

        return { ...t, _score: score };
      })
      .filter((t): t is EBirdTaxonomy & { _score: number } => t !== null)
      .sort((a, b) => b._score - a._score || a.comName.localeCompare(b.comName))
      .slice(0, maxResults);

    return scored.map(({ _score: _s, ...t }) => t);
  }

  /**
   * Validate the API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
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

export function createEBirdClient(apiKey: string): EBirdClient {
  return new EBirdClient({ apiKey });
}
