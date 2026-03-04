'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/components/AppProvider';
import { BirdSearchObservation, SpeciesSearchResult } from '@/types';
import { formatDistance, milesToKm } from '@/lib/distance';

const BirdSearchMap = dynamic(() => import('@/components/BirdSearchMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-gray-100 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

export default function BirdSearchPage() {
  const { apiKey, userLocation, userSpecies } = useApp();

  const [query, setQuery] = useState('');
  const [searchLat, setSearchLat] = useState<number | null>(userLocation?.lat ?? null);
  const [searchLng, setSearchLng] = useState<number | null>(userLocation?.lng ?? null);
  const [locationName, setLocationName] = useState(userLocation?.name ?? '');
  const [dist, setDist] = useState(30); // miles
  const [daysBack, setDaysBack] = useState(14);

  const [matches, setMatches] = useState<SpeciesSearchResult[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesSearchResult | null>(null);
  const [observations, setObservations] = useState<BirdSearchObservation[]>([]);
  const [selectedObs, setSelectedObs] = useState<BirdSearchObservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const userSpeciesSet = new Set(userSpecies.map((s) => s.toLowerCase()));

  const handleUseMyLocation = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setSearchLat(pos.coords.latitude);
      setSearchLng(pos.coords.longitude);
      setLocationName('My Location');
    });
  };

  const handleLocationInput = (val: string) => {
    setLocationName(val);
    const parts = val.split(',').map((s) => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setSearchLat(lat);
        setSearchLng(lng);
      }
    }
  };

  const doSearch = useCallback(async (speciesQuery: string) => {
    if (!apiKey || !speciesQuery.trim() || searchLat === null || searchLng === null) return;

    setIsLoading(true);
    setError(null);
    setObservations([]);
    setSelectedSpecies(null);
    setSearched(true);

    try {
      const res = await fetch('/api/bird-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, query: speciesQuery, lat: searchLat, lng: searchLng, dist: milesToKm(dist), daysBack }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');

      setMatches(data.matches || []);
      setObservations(data.observations || []);
      setSelectedSpecies(data.selectedSpecies || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, searchLat, searchLng, dist, daysBack]);

  const switchSpecies = async (species: SpeciesSearchResult) => {
    if (!apiKey || searchLat === null || searchLng === null) return;
    setIsLoading(true);
    setSelectedSpecies(species);
    setObservations([]);

    try {
      const res = await fetch('/api/bird-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, query: species.comName, lat: searchLat, lng: searchLng, dist: milesToKm(dist), daysBack }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setObservations(data.observations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const alreadySeen = selectedSpecies
    ? userSpecies.some((s) => s.toLowerCase() === selectedSpecies.comName.toLowerCase() || s === selectedSpecies.speciesCode)
    : false;

  if (!apiKey) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <div className="text-5xl mb-4">🔑</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">API Key Required</h2>
        <p className="text-gray-600">Please return to the Dashboard and connect your eBird API key first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">🔍 Bird Search</h1>
        <p className="text-gray-500 text-sm mt-1">
          Search any species by name and see where it has been reported near you.
        </p>
      </div>

      {/* Search form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Species search */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Species Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch(query)}
                placeholder="e.g. Painted Bunting"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Near</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationName}
                onChange={(e) => handleLocationInput(e.target.value)}
                placeholder="lat, lng or use current"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleUseMyLocation}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200"
                title="Use my location"
              >
                📍
              </button>
            </div>
          </div>

          {/* Radius + Days */}
          <div className="md:col-span-1 flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Radius: {dist} mi
              </label>
              <input
                type="range" min={5} max={30} step={5} value={dist}
                onChange={(e) => setDist(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days: {daysBack}
              </label>
              <input
                type="range" min={1} max={30} value={daysBack}
                onChange={(e) => setDaysBack(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <button
              onClick={() => doSearch(query)}
              disabled={!query.trim() || searchLat === null || isLoading}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm whitespace-nowrap"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {/* Alternate matches */}
      {matches.length > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-sm font-medium text-blue-800 mb-2">Did you mean one of these?</p>
          <div className="flex flex-wrap gap-2">
            {matches.map((m) => (
              <button
                key={m.speciesCode}
                onClick={() => switchSpecies(m)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedSpecies?.speciesCode === m.speciesCode
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {m.comName}
                <span className="text-xs opacity-70 ml-1 italic">{m.sciName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSpecies && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Species info + results list */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedSpecies.comName}</h2>
                  <p className="text-sm italic text-gray-500">{selectedSpecies.sciName}</p>
                  {selectedSpecies.familyComName && (
                    <p className="text-xs text-gray-400 mt-0.5">{selectedSpecies.familyComName}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {alreadySeen ? (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                      On your list ✓
                    </span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
                      Not on list yet
                    </span>
                  )}
                  <a
                    href={`https://ebird.org/species/${selectedSpecies.speciesCode}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View on eBird →
                  </a>
                </div>
              </div>
            </div>

            {/* Locations list */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="bg-white rounded-xl p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : observations.length > 0 ? (
                observations.map((obs) => (
                  <div
                    key={`${obs.locId}-${obs.obsDt}`}
                    onClick={() => setSelectedObs(selectedObs?.locId === obs.locId ? null : obs)}
                    className={`bg-white rounded-xl border p-3 cursor-pointer hover:border-blue-400 transition-colors ${
                      selectedObs?.locId === obs.locId ? 'border-blue-500 ring-1 ring-blue-400' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{obs.locName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(obs.obsDt).toLocaleDateString()} &bull;{' '}
                          {obs.howMany ? `${obs.howMany} bird${obs.howMany > 1 ? 's' : ''}` : 'Seen'}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-xs font-medium text-blue-600">
                          {formatDistance(obs.distance ?? 0, true)}
                        </span>
                      </div>
                    </div>
                    {selectedObs?.locId === obs.locId && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3 text-xs">
                        <a
                          href={`https://ebird.org/hotspot/${obs.locId}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          eBird Hotspot →
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${obs.lat},${obs.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Directions →
                        </a>
                      </div>
                    )}
                  </div>
                ))
              ) : searched && !isLoading ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
                  <p className="text-gray-500 text-sm">
                    No recent sightings within {dist} mi in the last {daysBack} days.
                  </p>
                  <p className="text-gray-400 text-xs mt-1">Try expanding your radius or days back.</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-[500px]">
              <BirdSearchMap
                observations={observations}
                selectedObs={selectedObs}
                centerLat={searchLat ?? 39.8}
                centerLng={searchLng ?? -98.6}
                onObsSelect={setSelectedObs}
              />
            </div>
          </div>
        </div>
      )}

      {!selectedSpecies && !isLoading && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500">Enter a species name above to find recent sightings near you.</p>
          <p className="text-gray-400 text-sm mt-2">
            Try: Painted Bunting, Snowy Owl, Roseate Spoonbill, Common Redpoll
          </p>
        </div>
      )}
    </div>
  );
}
