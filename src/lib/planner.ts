import { BigYearPlan, MonthlyPlan, PlannedTrip } from '@/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Seasonal species gain model for North American Big Year birding.
 * Values represent expected species additions per month.
 * base = local birding only, travelBoost = extra species with a day trip.
 */
interface MonthModel {
  base: number;
  travelBoost: number;
  primaryHabitats: string[];
  keySpeciesTypes: string[];
  recommendedDestinationTypes: string[];
  localTips: string;
}

const NORTH_AMERICA_MONTH_MODELS: MonthModel[] = [
  // January
  {
    base: 50, travelBoost: 35,
    primaryHabitats: ['Lakes & Reservoirs', 'Agricultural Fields', 'Coniferous Forest'],
    keySpeciesTypes: ['Waterfowl', 'Raptors', 'Owls', 'Winter Finches', 'Gulls'],
    recommendedDestinationTypes: ['Wildlife refuges', 'Large reservoirs', 'Agricultural valleys'],
    localTips: 'Focus on dawn & dusk for owls. Waterfowl diversity peaks at open water. Check feeders for winter finch irruptions.',
  },
  // February
  {
    base: 15, travelBoost: 15,
    primaryHabitats: ['Coastal Areas', 'Large Lakes', 'River Mouths'],
    keySpeciesTypes: ['Gulls', 'Waterfowl', 'Early Shorebirds', 'Sparrows'],
    recommendedDestinationTypes: ['Coastal bays', 'Sewage ponds (gull magnets)', 'Shoreline refuges'],
    localTips: 'Gull diversity at coastal landfills and bays. First sparrows arriving. Watch for early Red-winged Blackbirds.',
  },
  // March
  {
    base: 20, travelBoost: 20,
    primaryHabitats: ['Wetlands', 'Open Fields', 'Riparian Corridors'],
    keySpeciesTypes: ['Early Migrants', 'Raptors', 'Shorebirds', 'Blackbirds'],
    recommendedDestinationTypes: ['Wet meadows', 'Open country hillsides', 'River valleys'],
    localTips: 'Raptor migration peaks mid-month. Listen for singing meadowlarks. First Tree Swallows arriving.',
  },
  // April
  {
    base: 25, travelBoost: 25,
    primaryHabitats: ['Wetlands', 'Riparian', 'Woodland Edges', 'Grasslands'],
    keySpeciesTypes: ['Mixed Migrants', 'Shorebirds', 'Vireos', 'Early Warblers'],
    recommendedDestinationTypes: ['Shorebird mudflats', 'Valley wetlands', 'Riparian corridors'],
    localTips: 'Shorebird habitat essential — flooded fields and mudflats. First warblers and vireos in trees.',
  },
  // May
  {
    base: 35, travelBoost: 30,
    primaryHabitats: ['Deciduous Forest', 'Riparian', 'Coastal Scrub', 'Wetland Edges'],
    keySpeciesTypes: ['Warblers', 'Flycatchers', 'Tanagers', 'Orioles', 'Shorebirds'],
    recommendedDestinationTypes: ['Mature riparian forest', 'Warbler migration hotspots', 'American River-style corridors'],
    localTips: 'BEST month of the year. Dawn chorus peaks. Hit riparian corridors at first light every day possible.',
  },
  // June
  {
    base: 20, travelBoost: 20,
    primaryHabitats: ['Alpine Meadows', 'Sagebrush', 'High Desert', 'Breeding Wetlands'],
    keySpeciesTypes: ['Breeding Specialties', 'Alpine Birds', 'Sagebrush Birds', 'Nightjars'],
    recommendedDestinationTypes: ['Mountain passes', 'Great Basin sagebrush', 'High desert lakes'],
    localTips: 'Migration is over — focus on breeding specialties. Nighthawk and poorwill active at dusk.',
  },
  // July
  {
    base: 15, travelBoost: 15,
    primaryHabitats: ['Shorebird Mudflats', 'Mountain Lakes', 'High Country'],
    keySpeciesTypes: ['Early-return Shorebirds', 'High Country Breeders', 'Swifts'],
    recommendedDestinationTypes: ['Interior shorebird lakes', 'High elevation roads', 'Marshes with drawn-down water'],
    localTips: 'Shorebirds start returning south by mid-July. Great time for mountain/alpine habitats.',
  },
  // August
  {
    base: 18, travelBoost: 20,
    primaryHabitats: ['Coastal Wetlands', 'Shorebird Flats', 'Open Water'],
    keySpeciesTypes: ['Shorebirds', 'Terns', 'Juvenile Gulls', 'Late Warblers'],
    recommendedDestinationTypes: ['Coast and estuary', 'Inland reservoirs with shorebird habitat', 'Sewage ponds'],
    localTips: 'Peak shorebird diversity month. Coastal day trip pays huge dividends. Learn juvenile plumages.',
  },
  // September
  {
    base: 20, travelBoost: 20,
    primaryHabitats: ['Coastal Scrub', 'Riparian', 'Open Country', 'Marshes'],
    keySpeciesTypes: ['Fall Warblers', 'Sparrows', 'Raptors', 'Shorebirds'],
    recommendedDestinationTypes: ['Fall migration hotspots', 'Delta marshes', 'Coastal vagrant traps'],
    localTips: 'Fall migration underway — sparrows, raptors, and late shorebirds. Check vagrant-prone spots.',
  },
  // October
  {
    base: 15, travelBoost: 18,
    primaryHabitats: ['Open Water', 'Agricultural Fields', 'Wetlands'],
    keySpeciesTypes: ['Waterfowl', 'Raptors', 'Sparrows', 'Thrushes'],
    recommendedDestinationTypes: ['Wildlife refuges', 'Crane staging areas', 'Hawk watch ridges'],
    localTips: 'Waterfowl season opens. Sandhill Cranes staging. Raptor migration still active.',
  },
  // November
  {
    base: 10, travelBoost: 12,
    primaryHabitats: ['Wetlands', 'Coastal Areas', 'Open Fields'],
    keySpeciesTypes: ['Late Migrants', 'Winter Arrivals', 'Waterfowl', 'Gulls'],
    recommendedDestinationTypes: ['Coastal bays', 'Valley refuges', 'CBC count areas'],
    localTips: 'Christmas Bird Count season starts. Late migrants still trickling through. Consolidate your list.',
  },
  // December
  {
    base: 8, travelBoost: 10,
    primaryHabitats: ['Varied — Rarity Chasing'],
    keySpeciesTypes: ['Rarities', 'Winter Residents', 'CBC Species'],
    recommendedDestinationTypes: ['Known rarity sites', 'CBC areas', 'Coastal hotspots'],
    localTips: 'Participate in Christmas Bird Count. Chase any local rarities. Visit wintering habitats you may have missed.',
  },
];

type TravelIntensity = 'none' | 'light' | 'moderate' | 'aggressive';

const TRAVEL_MULTIPLIERS: Record<TravelIntensity, number> = {
  none: 1.0,
  light: 1.25,
  moderate: 1.6,
  aggressive: 2.1,
};

/**
 * Determine broad region from lat/lng for contextual suggestions
 */
function detectRegion(lat: number, lng: number): string {
  if (lng < -100) {
    if (lat > 45) return 'pacific-northwest';
    if (lat > 37) return 'california';
    return 'southwest';
  }
  if (lng < -85) {
    if (lat > 45) return 'great-lakes';
    return 'midwest';
  }
  if (lat > 45) return 'northeast';
  if (lat < 35) return 'southeast';
  return 'mid-atlantic';
}

const REGION_CONTEXT: Record<string, { label: string; strongSuites: string; topSites: string[] }> = {
  'pacific-northwest': {
    label: 'Pacific Northwest',
    strongSuites: 'Marine birds, alcids, and Pacific specialties year-round. Excellent shorebirds in fall.',
    topSites: ['Puget Sound estuaries', 'Coast Range old growth', 'Columbia River wetlands', 'Ocean shores'],
  },
  'california': {
    label: 'California / Great Basin',
    strongSuites: 'Year-round mild climate; huge wintering waterbird diversity; sagebrush & desert specialties.',
    topSites: ['Sacramento NWR complex', 'Mono Lake', 'Point Reyes', 'Salton Sea', 'Marin headlands'],
  },
  'southwest': {
    label: 'Southwest / Desert',
    strongSuites: 'Unique desert species, Sky Island mountain birds, excellent hummingbirds in summer.',
    topSites: ['SE Arizona sky islands', 'Bosque del Apache', 'Salt River valley parks', 'Salton Sea'],
  },
  'midwest': {
    label: 'Midwest / Great Plains',
    strongSuites: 'Massive waterfowl migration, grassland specialties, Sandhill Crane staging.',
    topSites: ['Platte River (cranes)', 'Cheyenne Bottoms', 'Lake Erie shoreline', 'Prairie pothole country'],
  },
  'great-lakes': {
    label: 'Great Lakes',
    strongSuites: 'Spectacular spring/fall warbler migration on lake shorelines; diverse breeding forest birds.',
    topSites: ['Magee Marsh (warblers)', 'Hawk Ridge Duluth', 'Whitefish Point', 'Ontario lakeshores'],
  },
  'northeast': {
    label: 'Northeast',
    strongSuites: 'World-class spring migration; seabird watching; diverse breeding forest birds.',
    topSites: ['Cape May', 'Plum Island', 'Quabbin Reservoir', 'Acadia National Park'],
  },
  'southeast': {
    label: 'Southeast',
    strongSuites: 'Excellent wintering birds; subtropical specialties in Florida; strong spring migration.',
    topSites: ['Everglades', 'Dry Tortugas', 'High Island TX (spring)', 'Outer Banks NC'],
  },
  'mid-atlantic': {
    label: 'Mid-Atlantic',
    strongSuites: 'Major migration corridor; outstanding shorebirds; great coastal access.',
    topSites: ['Delaware Bay (shorebirds)', 'Bombay Hook NWR', 'Cape May NJ', 'Chesapeake Bay'],
  },
};

/**
 * Generate a month-by-month Big Year plan
 */
export function generateBigYearPlan(params: {
  lat: number;
  lng: number;
  targetSpecies: number;
  year: number;
  travelIntensity: TravelIntensity;
  plannedTrips?: PlannedTrip[];
  currentSpeciesCount?: number;
}): BigYearPlan {
  const { lat, lng, targetSpecies, year, travelIntensity, plannedTrips = [], currentSpeciesCount = 0 } = params;

  const multiplier = TRAVEL_MULTIPLIERS[travelIntensity];
  const region = detectRegion(lat, lng);
  const regionCtx = REGION_CONTEXT[region] || REGION_CONTEXT['midwest'];

  let cumulativeTarget = currentSpeciesCount;
  const months: MonthlyPlan[] = [];

  // Calculate total projected without custom trips
  const rawTotal = NORTH_AMERICA_MONTH_MODELS.reduce((sum, m) => {
    const gain = m.base + (travelIntensity !== 'none' ? m.travelBoost * (multiplier - 1) : 0);
    return sum + gain;
  }, currentSpeciesCount);

  // Scale factor to hit target if projection is off
  const scaleFactor = targetSpecies > currentSpeciesCount
    ? Math.min(2.0, Math.max(0.5, (targetSpecies - currentSpeciesCount) / Math.max(1, rawTotal - currentSpeciesCount)))
    : 1.0;

  for (let i = 0; i < 12; i++) {
    const model = NORTH_AMERICA_MONTH_MODELS[i];
    const tripsThisMonth = plannedTrips.filter(t => t.month === i + 1);

    // Calculate base gain for this month
    let baseGain = model.base;
    if (travelIntensity !== 'none') {
      baseGain += model.travelBoost * (multiplier - 1);
    }

    // Bonus for pre-planned trips
    const tripBonus = tripsThisMonth.length > 0 ? Math.min(25, tripsThisMonth.reduce((s, t) => s + t.durationDays * 8, 0)) : 0;
    baseGain += tripBonus;

    const scaledGain = Math.round(baseGain * scaleFactor);
    const minGain = Math.round(model.base * 0.6 * scaleFactor);
    const maxGain = Math.round((model.base + model.travelBoost) * multiplier * 1.1 * scaleFactor + tripBonus);

    cumulativeTarget += scaledGain;

    // Build suggested trips list from region context + general advice
    const suggestedTrips: string[] = [];
    if (travelIntensity !== 'none' && i < regionCtx.topSites.length) {
      suggestedTrips.push(regionCtx.topSites[i % regionCtx.topSites.length]);
    }
    model.recommendedDestinationTypes.forEach(d => suggestedTrips.push(d));

    months.push({
      month: i + 1,
      monthName: MONTH_NAMES[i],
      targetGain: scaledGain,
      cumulativeTarget: Math.min(cumulativeTarget, targetSpecies + 20),
      minTarget: Math.min(currentSpeciesCount + months.reduce((s, m) => s + m.minTarget, 0) + minGain,
        cumulativeTarget - 5),
      maxTarget: cumulativeTarget + 15,
      primaryHabitats: model.primaryHabitats,
      keySpeciesTypes: model.keySpeciesTypes,
      recommendedDestinationTypes: model.recommendedDestinationTypes,
      suggestedTrips,
      localBirdingTips: model.localTips,
      plannedTrips: tripsThisMonth,
    });
  }

  // Feasibility assessment
  const projectedTotal = months[11].cumulativeTarget;
  let feasibilityNote = '';
  if (projectedTotal >= targetSpecies) {
    feasibilityNote = `Your plan is on track to reach ${projectedTotal} species — above your ${targetSpecies} goal! ${travelIntensity === 'none' ? 'Even without dedicated trips, consistent local birding can build a strong list.' : 'Your travel plans give a solid boost each month.'}`;
  } else {
    const gap = targetSpecies - projectedTotal;
    feasibilityNote = `Your current plan projects ${projectedTotal} species — about ${gap} short of ${targetSpecies}. Consider increasing travel intensity or adding targeted trips in May (peak migration) and August (shorebird peak) to close the gap.`;
  }

  return {
    year,
    targetSpecies,
    travelIntensity,
    homeRegion: regionCtx.label,
    months,
    totalProjected: projectedTotal,
    feasibilityNote,
  };
}
