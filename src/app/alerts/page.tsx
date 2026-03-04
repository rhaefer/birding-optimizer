'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/components/AppProvider';
import { RareBirdAlert } from '@/types';
import { formatDistance, milesToKm } from '@/lib/distance';

const AlertsMap = dynamic(() => import('@/components/AlertsMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-gray-100 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

export default function AlertsPage() {
  const { apiKey, userLocation, userSpecies } = useApp();

  const [lat, setLat] = useState<number | null>(userLocation?.lat ?? null);
  const [lng, setLng] = useState<number | null>(userLocation?.lng ?? null);
  const [locationName, setLocationName] = useState(userLocation?.name ?? '');
  const [dist, setDist] = useState(30); // miles
  const [daysBack, setDaysBack] = useState(14);
  const [showNewOnly, setShowNewOnly] = useState(false);

  const [alerts, setAlerts] = useState<RareBirdAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<RareBirdAlert | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const handleUseMyLocation = () => {
    navigator.geolocation?.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      setLocationName('My Location');
    });
  };

  const handleLocationInput = (val: string) => {
    setLocationName(val);
    const parts = val.split(',').map((s) => s.trim());
    if (parts.length === 2) {
      const parsedLat = parseFloat(parts[0]);
      const parsedLng = parseFloat(parts[1]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        setLat(parsedLat);
        setLng(parsedLng);
      }
    }
  };

  const fetchAlerts = useCallback(async () => {
    if (!apiKey || lat === null || lng === null) return;

    setIsLoading(true);
    setError(null);
    setAlerts([]);
    setSelectedAlert(null);

    try {
      const res = await fetch('/api/rare-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, lat, lng, dist: milesToKm(dist), daysBack, userSpecies }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch alerts');
      setAlerts(data.alerts || []);
      setLastFetched(data.generatedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, lat, lng, dist, daysBack, userSpecies]);

  const displayedAlerts = showNewOnly ? alerts.filter((a) => a.isNew) : alerts;
  const newCount = alerts.filter((a) => a.isNew).length;

  const getDaysAgo = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

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
        <h1 className="text-2xl font-bold text-gray-900">🔔 Rare Bird Alerts</h1>
        <p className="text-gray-500 text-sm mt-1">
          Live feed of notable and rare bird sightings flagged by eBird reviewers near your location.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={locationName}
                onChange={(e) => handleLocationInput(e.target.value)}
                placeholder="lat, lng"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Radius: {dist} mi</label>
            <input
              type="range" min={5} max={30} step={5} value={dist}
              onChange={(e) => setDist(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days back: {daysBack}</label>
            <input
              type="range" min={1} max={30} value={daysBack}
              onChange={(e) => setDaysBack(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={fetchAlerts}
            disabled={lat === null || isLoading}
            className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 font-medium"
          >
            {isLoading ? 'Loading...' : 'Fetch Alerts'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {alerts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Alerts list */}
          <div className="lg:col-span-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold text-gray-800">{displayedAlerts.length} rare sightings</span>
                {newCount > 0 && (
                  <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {newCount} new for you
                  </span>
                )}
              </div>
              {userSpecies.length > 0 && (
                <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNewOnly}
                    onChange={(e) => setShowNewOnly(e.target.checked)}
                    className="rounded"
                  />
                  New only
                </label>
              )}
            </div>

            {lastFetched && (
              <p className="text-xs text-gray-400 mb-3">
                Updated {new Date(lastFetched).toLocaleTimeString()}
              </p>
            )}

            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {displayedAlerts.map((alert, idx) => {
                const isSelected = selectedAlert?.subId === alert.subId;
                return (
                  <div
                    key={`${alert.subId}-${idx}`}
                    onClick={() => setSelectedAlert(isSelected ? null : alert)}
                    className={`bg-white rounded-xl border p-3 cursor-pointer hover:border-orange-400 transition-colors ${
                      isSelected ? 'border-orange-500 ring-1 ring-orange-400' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm truncate">{alert.comName}</span>
                          {alert.isNew && (
                            <span className="bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs italic text-gray-400">{alert.sciName}</p>
                        <p className="text-xs text-gray-600 mt-1 truncate">{alert.locName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {getDaysAgo(alert.obsDt)}
                          {alert.howMany ? ` · ${alert.howMany} bird${alert.howMany > 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-medium text-orange-600">
                          {formatDistance(alert.distance ?? 0, true)}
                        </span>
                        {alert.obsReviewed && (
                          <div className="text-xs text-green-600 mt-0.5">Reviewed ✓</div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3 text-xs">
                        <a
                          href={`https://ebird.org/checklist/${alert.subId}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Checklist →
                        </a>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${alert.lat},${alert.lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Directions →
                        </a>
                        {!alert.locationPrivate && (
                          <a
                            href={`https://ebird.org/hotspot/${alert.locId}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Hotspot →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-64 md:h-[560px]">
              <AlertsMap
                alerts={displayedAlerts}
                selectedAlert={selectedAlert}
                centerLat={lat ?? 39.8}
                centerLng={lng ?? -98.6}
                onAlertSelect={setSelectedAlert}
              />
            </div>
          </div>
        </div>
      )}

      {!isLoading && alerts.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔔</div>
          <p className="text-gray-500">Set your location and fetch alerts to see rare bird sightings near you.</p>
          <p className="text-gray-400 text-sm mt-2">eBird flags unusual sightings for your region — these are birds worth chasing.</p>
        </div>
      )}
    </div>
  );
}
