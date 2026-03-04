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

export interface EBirdTaxonomy {
  sciName: string;
  comName: string;
  speciesCode: string;
  category: string;
  taxonOrder: number;
  bandingCodes?: string[];
  comNameCodes?: string[];
  sciNameCodes?: string[];
  order?: string;
  familyCode?: string;
  familyComName?: string;
  familySciName?: string;
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

// Rare Bird Alert Types
export interface RareBirdAlert {
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
  locationPrivate?: boolean;
  subId: string;
  distance?: number; // calculated distance from user in km
  isNew?: boolean; // whether this is new for the user's year list
}

// Bird Search Types
export interface SpeciesSearchResult {
  speciesCode: string;
  comName: string;
  sciName: string;
  order?: string;
  familyComName?: string;
  category: string;
}

export interface BirdSearchObservation {
  speciesCode: string;
  comName: string;
  sciName: string;
  locId: string;
  locName: string;
  obsDt: string;
  howMany?: number;
  lat: number;
  lng: number;
  distance?: number; // km from search location
  subId: string;
}

// Big Year Planner Types
export interface PlannedTrip {
  month: number; // 1-12
  destination: string;
  lat?: number;
  lng?: number;
  durationDays: number;
  notes?: string;
}

export interface MonthlyPlan {
  month: number;
  monthName: string;
  targetGain: number;
  cumulativeTarget: number;
  minTarget: number;
  maxTarget: number;
  primaryHabitats: string[];
  keySpeciesTypes: string[];
  recommendedDestinationTypes: string[];
  suggestedTrips: string[];
  localBirdingTips: string;
  plannedTrips: PlannedTrip[];
}

export interface BigYearPlan {
  year: number;
  targetSpecies: number;
  travelIntensity: 'none' | 'light' | 'moderate' | 'aggressive';
  homeRegion: string; // e.g. "western-us", "eastern-us", "midwest"
  months: MonthlyPlan[];
  totalProjected: number;
  feasibilityNote: string;
}

// Social / Community Types (planned feature)
export interface BirdingActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'checklist' | 'lifer' | 'year_bird' | 'rare_find';
  species?: string;
  location: string;
  timestamp: string;
  count?: number;
  notes?: string;
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

export interface BirdSearchRequest {
  apiKey: string;
  query: string;
  lat: number;
  lng: number;
  dist?: number;
  daysBack?: number;
}

export interface BirdSearchResponse {
  matches: SpeciesSearchResult[];
  observations: BirdSearchObservation[];
  selectedSpecies?: SpeciesSearchResult;
}

export interface RareAlertsRequest {
  apiKey: string;
  lat: number;
  lng: number;
  dist?: number;
  daysBack?: number;
  userSpecies?: string[];
}

export interface RareAlertsResponse {
  alerts: RareBirdAlert[];
  total: number;
  generatedAt: string;
}

export interface PlannerRequest {
  lat: number;
  lng: number;
  targetSpecies: number;
  year: number;
  travelIntensity: 'none' | 'light' | 'moderate' | 'aggressive';
  plannedTrips?: PlannedTrip[];
  currentSpeciesCount?: number;
}

export interface PlannerResponse {
  plan: BigYearPlan;
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
