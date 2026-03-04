'use client';

import { useState, useEffect } from 'react';
import { FilterSettings, UserLocation } from '@/types';
import { kmToMiles, milesToKm } from '@/lib/distance';

interface FilterPanelProps {
  filters: FilterSettings;
  onFiltersChange: (filters: FilterSettings) => void;
  userLocation: UserLocation | null;
  onLocationChange: (location: UserLocation) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  userLocation,
  onLocationChange,
  onSearch,
  isLoading,
}: FilterPanelProps) {
  const [locationInput, setLocationInput] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Initialize location input when userLocation changes
  useEffect(() => {
    if (userLocation?.name) {
      setLocationInput(userLocation.name);
    }
  }, [userLocation]);

  const handleDistanceChange = (value: number) => {
    const distanceKm = useMiles ? milesToKm(value) : value;
    onFiltersChange({ ...filters, maxDistance: distanceKm });
  };

  const displayDistance = useMiles
    ? Math.round(kmToMiles(filters.maxDistance))
    : Math.round(filters.maxDistance);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Current Location',
        });
        setLocationInput('Current Location');
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enter coordinates manually.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleCoordinateInput = () => {
    // Try to parse coordinates from input (format: lat, lng)
    const parts = locationInput.split(',').map((s) => s.trim());
    if (parts.length === 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onLocationChange({ lat, lng, name: locationInput });
        return true;
      }
    }
    return false;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Search Filters</h2>

      <div className="space-y-6">
        {/* Location Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Location
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onBlur={handleCoordinateInput}
              placeholder="Enter coordinates (lat, lng)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
              title="Use current location"
            >
              {isGettingLocation ? '...' : '📍'}
            </button>
          </div>
          {userLocation && (
            <p className="text-xs text-gray-500 mt-1">
              {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* Distance Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Distance
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={displayDistance}
              onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700 w-16 text-right">
              {displayDistance} mi
            </span>
          </div>
        </div>

        {/* Days Back Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recent Sightings (days back)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={filters.daysBack}
              onChange={(e) =>
                onFiltersChange({ ...filters, daysBack: parseInt(e.target.value) })
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700 w-16 text-right">
              {filters.daysBack} days
            </span>
          </div>
        </div>

        {/* Minimum Species Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Minimum New Species
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={filters.minSpeciesCount}
              onChange={(e) =>
                onFiltersChange({ ...filters, minSpeciesCount: parseInt(e.target.value) })
              }
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700 w-16 text-right">
              {filters.minSpeciesCount}+
            </span>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={onSearch}
          disabled={!userLocation || isLoading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Searching...' : 'Find Birding Hotspots'}
        </button>
      </div>
    </div>
  );
}
