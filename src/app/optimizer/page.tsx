'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/components/AppProvider';
import FilterPanel from '@/components/FilterPanel';
import HotspotCard from '@/components/HotspotCard';
import UserSpeciesInput from '@/components/UserSpeciesInput';
import { FilterSettings, UserLocation, HotspotRecommendation } from '@/types';
import { milesToKm } from '@/lib/distance';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

const DEFAULT_FILTERS: FilterSettings = {
  maxDistance: milesToKm(25),
  daysBack: 14,
  minSpeciesCount: 1,
};

export default function OptimizerPage() {
  const { apiKey, userLocation: savedLocation, setUserLocation: saveLocation, userSpecies, setUserSpecies } = useApp();

  const [userLocation, setUserLocation] = useState<UserLocation | null>(savedLocation);
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [recommendations, setRecommendations] = useState<HotspotRecommendation[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ totalHotspotsAnalyzed: number; generatedAt: string } | null>(null);

  // Business trip mode: search near a different destination
  const [tripMode, setTripMode] = useState(false);
  const [tripLocation, setTripLocation] = useState<UserLocation | null>(null);

  const searchLocation = tripMode ? tripLocation : userLocation;

  const handleLocationChange = (loc: UserLocation) => {
    setUserLocation(loc);
    saveLocation(loc);
  };

  const fetchRecommendations = useCallback(async () => {
    if (!apiKey || !searchLocation) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          lat: searchLocation.lat,
          lng: searchLocation.lng,
          maxDistance: filters.maxDistance,
          daysBack: filters.daysBack,
          userSpecies,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch recommendations');
      }

      const data = await response.json();
      const filtered = data.recommendations.filter(
        (rec: HotspotRecommendation) => rec.potentialNewSpecies.length >= filters.minSpeciesCount
      );

      setRecommendations(filtered);
      setStats({ totalHotspotsAnalyzed: data.totalHotspotsAnalyzed, generatedAt: data.generatedAt });
      setSelectedHotspotId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, searchLocation, filters, userSpecies]);

  if (!apiKey) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="text-5xl mb-4">🔑</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">API Key Required</h2>
        <p className="text-gray-600 mb-4">Please return to the Dashboard and connect your eBird API key first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">🎯 Hotspot Optimizer</h1>
        <p className="text-gray-500 text-sm mt-1">
          Find nearby birding hotspots ranked by potential new species for your year list.
        </p>
      </div>

      {/* Business Trip Mode Toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-800">Business Trip Mode</h3>
            <p className="text-sm text-blue-600 mt-0.5">
              Going somewhere for work? Search hotspots near your destination instead of home.
            </p>
          </div>
          <button
            onClick={() => { setTripMode(!tripMode); setRecommendations([]); setStats(null); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              tripMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              tripMode ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
        {tripMode && (
          <div className="mt-3">
            <TripLocationInput onLocationSet={setTripLocation} tripLocation={tripLocation} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {!tripMode && (
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              userLocation={userLocation}
              onLocationChange={handleLocationChange}
              onSearch={fetchRecommendations}
              isLoading={isLoading}
            />
          )}
          {tripMode && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Search Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Days Back</label>
                  <input
                    type="range" min={1} max={30} value={filters.daysBack}
                    onChange={(e) => setFilters({ ...filters, daysBack: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600">{filters.daysBack} days</span>
                </div>
                <button
                  onClick={fetchRecommendations}
                  disabled={!tripLocation || isLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {isLoading ? 'Searching...' : 'Find Hotspots Near Trip Destination'}
                </button>
              </div>
            </div>
          )}

          <UserSpeciesInput userSpecies={userSpecies} onSpeciesChange={setUserSpecies} />

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Map + Results */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden h-64 md:h-[400px]">
            <Map
              userLocation={searchLocation}
              recommendations={recommendations}
              selectedHotspotId={selectedHotspotId}
              onHotspotSelect={setSelectedHotspotId}
              maxDistance={filters.maxDistance}
            />
          </div>

          {isLoading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing hotspots and finding new species...</p>
              <p className="text-gray-400 text-sm mt-2">This may take a moment for large areas</p>
            </div>
          ) : recommendations.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">
                  Recommended Hotspots
                  {tripMode && tripLocation?.name && (
                    <span className="text-blue-600 font-normal text-sm ml-2">near {tripLocation.name}</span>
                  )}
                </h2>
                {stats && (
                  <span className="text-sm text-gray-500">Analyzed {stats.totalHotspotsAnalyzed} hotspots</span>
                )}
              </div>
              {recommendations.map((rec, index) => (
                <HotspotCard
                  key={rec.hotspot.locId}
                  recommendation={rec}
                  rank={index + 1}
                  isSelected={selectedHotspotId === rec.hotspot.locId}
                  onClick={() =>
                    setSelectedHotspotId(selectedHotspotId === rec.hotspot.locId ? null : rec.hotspot.locId)
                  }
                />
              ))}
            </div>
          ) : stats ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">No hotspots found matching your criteria.</p>
              <p className="text-gray-400 text-sm mt-2">Try increasing the search radius or days back.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="text-4xl mb-4">🐦</div>
              <p className="text-gray-600">
                {tripMode
                  ? 'Enter a trip destination above and click Find Hotspots'
                  : 'Set your location and click Find Birding Hotspots to get started'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

function TripLocationInput({
  onLocationSet,
  tripLocation,
}: {
  onLocationSet: (loc: UserLocation) => void;
  tripLocation: UserLocation | null;
}) {
  const [query, setQuery] = useState(tripLocation?.name || '');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setShowDropdown(false); return; }
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setShowDropdown(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (r: NominatimResult) => {
    const name = r.display_name.split(',').slice(0, 2).join(',').trim();
    setQuery(name);
    setShowDropdown(false);
    onLocationSet({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), name });
  };

  return (
    <div className="relative">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search city or destination…"
            className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
          />
          {isSearching && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        {tripLocation && (
          <span className="text-xs text-green-600 whitespace-nowrap font-medium">Set ✓</span>
        )}
      </div>
      {showDropdown && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg text-sm overflow-hidden">
          {results.map((r, i) => (
            <li key={i}>
              <button
                onMouseDown={() => handleSelect(r)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 truncate"
              >
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
