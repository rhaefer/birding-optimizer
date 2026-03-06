'use client';

import { useState, useRef } from 'react';
import { useApp } from '@/components/AppProvider';
import { BigYearPlan, EBirdHotspot, PlannedTrip } from '@/types';
import { calculateDistance, kmToMiles } from '@/lib/distance';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TRAVEL_OPTIONS = [
  { value: 'none', label: 'Local only', description: 'Patch birding only, no dedicated trips' },
  { value: 'light', label: 'Light travel', description: '1–2 day trips per month, within 2 hours' },
  { value: 'moderate', label: 'Moderate travel', description: '1–2 overnight trips per month, within 5 hours' },
  { value: 'aggressive', label: 'Aggressive travel', description: 'Multiple multi-day trips, occasional flights' },
];

export default function PlannerPage() {
  const { userLocation, userSpecies, bigYearGoal, setBigYearGoal, bigYearYear, setBigYearYear, setUserLocation } = useApp();

  const [lat, setLat] = useState<number | null>(userLocation?.lat ?? null);
  const [lng, setLng] = useState<number | null>(userLocation?.lng ?? null);
  const [locationName, setLocationName] = useState(userLocation?.name ?? '');
  const [targetSpecies, setTargetSpecies] = useState(bigYearGoal);
  const [year, setYear] = useState(bigYearYear);
  const [travelIntensity, setTravelIntensity] = useState<'none' | 'light' | 'moderate' | 'aggressive'>('moderate');
  const [currentCount, setCurrentCount] = useState(userSpecies.length);
  const [plannedTrips, setPlannedTrips] = useState<PlannedTrip[]>([]);

  const [plan, setPlan] = useState<BigYearPlan | null>(null);
  const [nearbyHotspots, setNearbyHotspots] = useState<EBirdHotspot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

  const handleUseMyLocation = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      setLocationName('My Location');
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, name: 'My Location' });
    });
  };

  const addTrip = (month: number) => {
    setPlannedTrips([...plannedTrips, { month, destination: '', durationDays: 2 }]);
  };

  const updateTrip = (idx: number, updates: Partial<PlannedTrip>) => {
    setPlannedTrips(plannedTrips.map((t, i) => (i === idx ? { ...t, ...updates } : t)));
  };

  const removeTrip = (idx: number) => {
    setPlannedTrips(plannedTrips.filter((_, i) => i !== idx));
  };

  const generatePlan = async () => {
    if (lat === null || lng === null) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, targetSpecies, year, travelIntensity, plannedTrips, currentSpeciesCount: currentCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');
      setPlan(data.plan);
      setBigYearGoal(targetSpecies);
      setBigYearYear(year);
      setExpandedMonth(null);

      // Fetch nearby hotspots
      try {
        const params = new URLSearchParams({ lat: String(lat), lng: String(lng), dist: '50' });
        const hsRes = await fetch(`/api/hotspots?${params}`);
        if (hsRes.ok) {
          const hsData = await hsRes.json();
          const sorted = (hsData.hotspots as EBirdHotspot[])
            .sort((a, b) => (b.numSpeciesAllTime ?? 0) - (a.numSpeciesAllTime ?? 0))
            .slice(0, 20);
          setNearbyHotspots(sorted);
        }
      } catch {
        // Hotspot fetch failing shouldn't break the plan
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsLoading(false);
    }
  };

  const getMonthColor = (gain: number) => {
    if (gain >= 40) return 'bg-green-500';
    if (gain >= 25) return 'bg-green-400';
    if (gain >= 15) return 'bg-yellow-400';
    if (gain >= 10) return 'bg-yellow-300';
    return 'bg-gray-300';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">📅 Big Year Planner</h1>
        <p className="text-gray-500 text-sm mt-1">
          Build a month-by-month plan to reach your species target based on your location, travel budget, and seasonal migration patterns.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Plan Settings</h2>
            <div className="space-y-4">

              {/* Location */}
              <LocationSearch
                initialName={locationName}
                lat={lat}
                lng={lng}
                onLocationSet={(newLat, newLng, name) => {
                  setLat(newLat);
                  setLng(newLng);
                  setLocationName(name);
                  setUserLocation({ lat: newLat, lng: newLng, name });
                }}
                onUseMyLocation={handleUseMyLocation}
              />

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  min={2024} max={2030}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Species: <span className="font-bold text-purple-700">{targetSpecies}</span>
                </label>
                <input
                  type="range" min={100} max={700} step={25} value={targetSpecies}
                  onChange={(e) => setTargetSpecies(parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>100 (casual)</span><span>700 (elite)</span>
                </div>
              </div>

              {/* Current count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Species Already This Year: <span className="font-bold">{currentCount}</span>
                </label>
                <input
                  type="range" min={0} max={targetSpecies} value={currentCount}
                  onChange={(e) => setCurrentCount(parseInt(e.target.value))}
                  className="w-full"
                />
                {userSpecies.length > 0 && currentCount !== userSpecies.length && (
                  <button
                    onClick={() => setCurrentCount(userSpecies.length)}
                    className="text-xs text-purple-600 hover:underline mt-1"
                  >
                    Use my list count ({userSpecies.length})
                  </button>
                )}
              </div>

              {/* Travel intensity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Travel Intensity</label>
                <div className="space-y-2">
                  {TRAVEL_OPTIONS.map((opt) => (
                    <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="travel"
                        value={opt.value}
                        checked={travelIntensity === opt.value}
                        onChange={() => setTravelIntensity(opt.value as typeof travelIntensity)}
                        className="mt-0.5 accent-purple-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={generatePlan}
                disabled={lat === null || isLoading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium"
              >
                {isLoading ? 'Generating...' : 'Generate My Big Year Plan'}
              </button>

              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>
          </div>

          {/* Planned trips */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-800">Pre-Planned Trips</h3>
              <span className="text-xs text-gray-400">{plannedTrips.length} added</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">Add trips you already have scheduled — e.g. a business trip or family vacation.</p>
            <div className="space-y-3 mb-3">
              {plannedTrips.map((trip, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <select
                      value={trip.month}
                      onChange={(e) => updateTrip(idx, { month: parseInt(e.target.value) })}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      {MONTH_SHORT.map((m, i) => (
                        <option key={i} value={i + 1}>{m}</option>
                      ))}
                    </select>
                    <button onClick={() => removeTrip(idx)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                  </div>
                  <input
                    type="text"
                    value={trip.destination}
                    onChange={(e) => updateTrip(idx, { destination: e.target.value })}
                    placeholder="Destination (e.g. Point Reyes)"
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1 mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Days:</span>
                    <input
                      type="number"
                      value={trip.durationDays}
                      onChange={(e) => updateTrip(idx, { durationDays: parseInt(e.target.value) || 1 })}
                      min={1} max={14}
                      className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => addTrip(new Date().getMonth() + 1)}
              className="w-full text-sm text-purple-600 border border-purple-300 rounded-lg py-2 hover:bg-purple-50"
            >
              + Add a Trip
            </button>
          </div>
        </div>

        {/* Plan output */}
        <div className="lg:col-span-2">
          {plan ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-purple-900 text-white rounded-2xl p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <h2 className="text-xl font-bold">{plan.year} Big Year Plan</h2>
                    <p className="text-purple-300 text-sm mt-1">{plan.homeRegion} &bull; {plan.travelIntensity} travel</p>
                  </div>
                  <div className="flex gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-300">{plan.totalProjected}</div>
                      <div className="text-xs text-purple-300 uppercase tracking-wide">Projected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{plan.targetSpecies}</div>
                      <div className="text-xs text-purple-300 uppercase tracking-wide">Target</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${plan.totalProjected >= plan.targetSpecies ? 'text-green-300' : 'text-yellow-300'}`}>
                        {plan.totalProjected >= plan.targetSpecies ? 'On Track' : 'Short'}
                      </div>
                      <div className="text-xs text-purple-300 uppercase tracking-wide">Status</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-purple-800 rounded-lg p-3">
                  <p className="text-sm text-purple-200">{plan.feasibilityNote}</p>
                </div>
              </div>

              {/* Monthly bar chart overview */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-3">Monthly Species Gain Projection</h3>
                <div className="flex items-end gap-1 h-24">
                  {plan.months.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-500 font-medium">{m.targetGain}</span>
                      <div
                        className={`w-full rounded-t ${getMonthColor(m.targetGain)} cursor-pointer hover:opacity-80`}
                        style={{ height: `${Math.max(8, (m.targetGain / 70) * 80)}px` }}
                        onClick={() => setExpandedMonth(expandedMonth === m.month ? null : m.month)}
                        title={`${m.monthName}: +${m.targetGain} species`}
                      />
                      <span className="text-xs text-gray-400">{MONTH_SHORT[m.month - 1]}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Click a bar to expand month details below.</p>
              </div>

              {/* Month cards */}
              <div className="space-y-2">
                {plan.months.map((m) => {
                  const isExpanded = expandedMonth === m.month;
                  const hasTrips = m.plannedTrips.length > 0;
                  return (
                    <div key={m.month} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                        onClick={() => setExpandedMonth(isExpanded ? null : m.month)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-8 rounded-full ${getMonthColor(m.targetGain)}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800">{m.monthName}</span>
                              {hasTrips && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                  {m.plannedTrips.length} trip{m.plannedTrips.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              +{m.targetGain} species &bull; Cumulative: {m.cumulativeTarget}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right hidden sm:block">
                            <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                              {m.keySpeciesTypes.slice(0, 3).map((t) => (
                                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="text-gray-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Target Species Types</h4>
                            <div className="flex flex-wrap gap-1">
                              {m.keySpeciesTypes.map((t) => (
                                <span key={t} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                                  {t}
                                </span>
                              ))}
                            </div>

                            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-3 mb-2">Key Habitats</h4>
                            <div className="flex flex-wrap gap-1">
                              {m.primaryHabitats.map((h) => (
                                <span key={h} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                                  {h}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            {nearbyHotspots.length > 0 ? (
                              <>
                                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                                  Top Nearby Hotspots
                                  <span className="ml-1 text-gray-400 font-normal normal-case">within 50 km</span>
                                </h4>
                                <ul className="space-y-1.5 mb-1">
                                  {nearbyHotspots.slice(0, 8).map((hs) => {
                                    const distKm = lat !== null && lng !== null
                                      ? calculateDistance(lat, lng, hs.lat, hs.lng)
                                      : null;
                                    return (
                                      <li key={hs.locId} className="flex items-start gap-1.5 text-xs">
                                        <span className="text-green-500 shrink-0 mt-0.5">📍</span>
                                        <div>
                                          <a
                                            href={`https://ebird.org/hotspot/${hs.locId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-blue-600 hover:underline"
                                          >
                                            {hs.locName}
                                          </a>
                                          <span className="text-gray-400 ml-1">
                                            {distKm !== null && `${kmToMiles(distKm).toFixed(1)} mi`}
                                            {hs.numSpeciesAllTime ? ` · ${hs.numSpeciesAllTime} spp` : ''}
                                          </span>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                                {lat !== null && lng !== null && (
                                  <a
                                    href={`https://ebird.org/hotspots?lat=${lat}&lng=${lng}&dist=50&yr=cur&m=${m.month}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline"
                                  >
                                    View all hotspots in eBird for {m.monthName} →
                                  </a>
                                )}
                              </>
                            ) : (
                              <>
                                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Recommended Destinations</h4>
                                <ul className="space-y-1">
                                  {m.suggestedTrips.slice(0, 4).map((d, i) => (
                                    <li key={i} className="text-xs text-gray-700 flex gap-1.5">
                                      <span className="text-green-500 shrink-0">→</span>
                                      {d}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            )}

                            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mt-3 mb-1">Local Tip</h4>
                            <p className="text-xs text-gray-600 italic">{m.localBirdingTips}</p>
                          </div>

                          {m.plannedTrips.length > 0 && (
                            <div className="sm:col-span-2">
                              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Your Planned Trips</h4>
                              <div className="flex flex-wrap gap-2">
                                {m.plannedTrips.map((t, i) => (
                                  <div key={i} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                                    <span className="text-sm font-medium text-blue-800">
                                      {t.destination || 'Unnamed trip'} ({t.durationDays}d)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-white rounded-xl border border-gray-200">
              <div className="text-6xl mb-4">📅</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Build Your Big Year Plan</h2>
              <p className="text-gray-500 text-sm max-w-md text-center">
                Fill in your settings on the left and click Generate to get a personalized month-by-month birding plan.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm text-sm text-gray-600">
                <div className="flex gap-2"><span>📍</span>Set home location</div>
                <div className="flex gap-2"><span>🎯</span>Set species goal</div>
                <div className="flex gap-2"><span>✈️</span>Choose travel intensity</div>
                <div className="flex gap-2"><span>📅</span>Add planned trips</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface NominatimResult { lat: string; lon: string; display_name: string; }

function LocationSearch({ initialName, lat, lng, onLocationSet, onUseMyLocation }: {
  initialName: string;
  lat: number | null;
  lng: number | null;
  onLocationSet: (lat: number, lng: number, name: string) => void;
  onUseMyLocation: () => void;
}) {
  const [query, setQuery] = useState(initialName);
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
    } catch { setResults([]); }
    finally { setIsSearching(false); }
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
    onLocationSet(parseFloat(r.lat), parseFloat(r.lon), name);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Home Location</label>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search city or location…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 pr-7"
          />
          {isSearching && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          )}
          {showDropdown && (
            <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg text-sm overflow-hidden">
              {results.map((r, i) => (
                <li key={i}>
                  <button onMouseDown={() => handleSelect(r)} className="w-full text-left px-3 py-2 hover:bg-purple-50 truncate">
                    {r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={onUseMyLocation} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 shrink-0" title="Use my location">📍</button>
      </div>
      {lat !== null && <p className="text-xs text-gray-400 mt-1">{lat.toFixed(4)}, {lng?.toFixed(4)}</p>}
    </div>
  );
}

function getMonthColor(gain: number) {
  if (gain >= 40) return 'bg-green-500';
  if (gain >= 25) return 'bg-green-400';
  if (gain >= 15) return 'bg-yellow-400';
  if (gain >= 10) return 'bg-yellow-300';
  return 'bg-gray-300';
}
