'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import ApiKeyInput from '@/components/ApiKeyInput';
import FilterPanel from '@/components/FilterPanel';
import HotspotCard from '@/components/HotspotCard';
import UserSpeciesInput from '@/components/UserSpeciesInput';
import { FilterSettings, UserLocation, HotspotRecommendation } from '@/types';
import { milesToKm } from '@/lib/distance';

// Dynamically import Map to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

const DEFAULT_FILTERS: FilterSettings = {
  maxDistance: milesToKm(25), // 25 miles default
  daysBack: 14,
  minSpeciesCount: 1,
};

export default function Home() {
  // Auth state
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // App state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [filters, setFilters] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [userSpecies, setUserSpecies] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<HotspotRecommendation[]>([]);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);

  // Loading/error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<{
    totalHotspotsAnalyzed: number;
    generatedAt: string;
  } | null>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('ebird-api-key');
    if (savedKey) {
      setApiKey(savedKey);
    }
    setIsInitialized(true);
  }, []);

  // Fetch recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!apiKey || !userLocation) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          lat: userLocation.lat,
          lng: userLocation.lng,
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

      // Filter by minimum species count
      const filteredRecommendations = data.recommendations.filter(
        (rec: HotspotRecommendation) => rec.potentialNewSpecies.length >= filters.minSpeciesCount
      );

      setRecommendations(filteredRecommendations);
      setStats({
        totalHotspotsAnalyzed: data.totalHotspotsAnalyzed,
        generatedAt: data.generatedAt,
      });
      setSelectedHotspotId(null);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, userLocation, filters, userSpecies]);

  // Handle API key set
  const handleApiKeySet = (key: string) => {
    setApiKey(key);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('ebird-api-key');
    setApiKey(null);
    setRecommendations([]);
    setStats(null);
  };

  // Show loading while checking for saved API key
  if (!isInitialized) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </main>
    );
  }

  // Show API key input if not authenticated
  if (!apiKey) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Big Year Birding Optimizer
            </h1>
            <p className="text-gray-600">
              Find the best birding hotspots to maximize new species for your Big Year
            </p>
          </header>

          <div className="flex justify-center">
            <ApiKeyInput onApiKeySet={handleApiKeySet} />
          </div>

          <div className="mt-12 max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">How it works</h2>
            <ol className="list-decimal list-inside space-y-3 text-gray-600">
              <li>Enter your eBird API key (free from ebird.org)</li>
              <li>Set your current location and search radius</li>
              <li>Optionally enter species you&apos;ve already seen this year</li>
              <li>Get personalized recommendations for hotspots with potential new species</li>
            </ol>
          </div>
        </div>
      </main>
    );
  }

  // Main app view
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">
            Big Year Birding Optimizer
          </h1>
          <div className="flex items-center gap-4">
            {stats && (
              <span className="text-sm text-gray-500">
                {recommendations.length} hotspots found
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Change API Key
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar - Filters */}
          <div className="lg:col-span-1 space-y-4">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              userLocation={userLocation}
              onLocationChange={setUserLocation}
              onSearch={fetchRecommendations}
              isLoading={isLoading}
            />

            <UserSpeciesInput
              userSpecies={userSpecies}
              onSpeciesChange={setUserSpecies}
            />

            {/* Error display */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Right content - Map and Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden h-[400px]">
              <Map
                userLocation={userLocation}
                recommendations={recommendations}
                selectedHotspotId={selectedHotspotId}
                onHotspotSelect={setSelectedHotspotId}
                maxDistance={filters.maxDistance}
              />
            </div>

            {/* Results list */}
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Analyzing hotspots and finding new species...
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  This may take a moment depending on the number of hotspots
                </p>
              </div>
            ) : recommendations.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Recommended Hotspots
                  </h2>
                  {stats && (
                    <span className="text-sm text-gray-500">
                      Analyzed {stats.totalHotspotsAnalyzed} hotspots
                    </span>
                  )}
                </div>

                {recommendations.map((rec, index) => (
                  <HotspotCard
                    key={rec.hotspot.locId}
                    recommendation={rec}
                    rank={index + 1}
                    isSelected={selectedHotspotId === rec.hotspot.locId}
                    onClick={() =>
                      setSelectedHotspotId(
                        selectedHotspotId === rec.hotspot.locId
                          ? null
                          : rec.hotspot.locId
                      )
                    }
                  />
                ))}
              </div>
            ) : stats ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <p className="text-gray-600">
                  No hotspots found with new species matching your criteria.
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try increasing the search radius or days back.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="text-4xl mb-4">🐦</div>
                <p className="text-gray-600">
                  Set your location and click &quot;Find Birding Hotspots&quot; to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
