// eBird API Types
export interface EBirdObservation {
  speciesCode: string;
  comName: string;
  sciName: string;
  locId: string;
  locName: string;
  obsDt: string;
  howMany?: number;
  lat: number;
  lng: number;
  obsValid: boolean;
  obsReviewed: boolean;
  locationPrivate: boolean;
  subId: string;
}

export interface EBirdHotspot {
  locId: string;
  locName: string;
  countryCode: string;
  subnational1Code: string;
  subnational2Code: string;
  lat: number;
  lng: number;
  latestObsDt?: string;
  numSpeciesAllTime?: number;
}

export interface EBirdChecklist {
  subId: string;
  locId: string;
  userDisplayName: string;
  numSpecies: number;
  obsDt: string;
  obsTime?: string;
  subID: string;
}

// Application Types
export interface UserLocation {
  lat: number;
  lng: number;
  name?: string;
}

export interface FilterSettings {
  maxDistance: number; // in kilometers
  daysBack: number; // how many days of recent sightings to consider
  minSpeciesCount: number; // minimum new species to show hotspot
}

export interface HotspotRecommendation {
  hotspot: EBirdHotspot;
  distance: number; // distance from user in km
  potentialNewSpecies: SpeciesSighting[];
  score: number; // recommendation score
}

export interface SpeciesSighting {
  speciesCode: string;
  comName: string;
  sciName: string;
  lastSeen: string;
  count?: number;
  frequency?: number; // how often seen at this location (0-1)
}

export interface UserYearList {
  year: number;
  species: string[]; // species codes
  speciesDetails: Map<string, { comName: string; sciName: string }>;
}

// API Request/Response Types
export interface MySpeciesRequest {
  apiKey: string;
  region: string; // e.g., "US-CO" for Colorado
  year: number;
}

export interface MySpeciesResponse {
  year: number;
  speciesCount: number;
  species: Array<{
    speciesCode: string;
    comName: string;
    sciName: string;
  }>;
}

export interface HotspotsRequest {
  apiKey: string;
  lat: number;
  lng: number;
  dist: number; // distance in km (max 50)
}

export interface HotspotsResponse {
  hotspots: EBirdHotspot[];
}

export interface RecommendationsRequest {
  apiKey: string;
  lat: number;
  lng: number;
  maxDistance: number;
  daysBack: number;
  userSpecies: string[]; // species codes the user has already seen
}

export interface RecommendationsResponse {
  recommendations: HotspotRecommendation[];
  totalHotspotsAnalyzed: number;
  generatedAt: string;
}

// App State
export interface AppState {
  apiKey: string | null;
  userLocation: UserLocation | null;
  filters: FilterSettings;
  userSpecies: string[];
  recommendations: HotspotRecommendation[];
  isLoading: boolean;
  error: string | null;
}
