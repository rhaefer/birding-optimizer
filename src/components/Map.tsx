'use client';

import { useEffect, useRef } from 'react';
import { HotspotRecommendation, UserLocation } from '@/types';

// Note: Leaflet CSS must be imported in the page or layout
// We'll load Leaflet dynamically to avoid SSR issues

interface MapProps {
  userLocation: UserLocation | null;
  recommendations: HotspotRecommendation[];
  selectedHotspotId: string | null;
  onHotspotSelect: (locId: string) => void;
  maxDistance: number;
}

export default function Map({
  userLocation,
  recommendations,
  selectedHotspotId,
  onHotspotSelect,
  maxDistance,
}: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // Fix Leaflet's default icon issue
      delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (!mapContainerRef.current || mapRef.current) return;

      // Default to center of US if no location
      const defaultCenter: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [39.8283, -98.5795];

      mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, 10);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update user location marker and circle
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const updateUserMarker = async () => {
      const L = (await import('leaflet')).default;

      // Remove old user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      // Remove old circle
      if (circleRef.current) {
        circleRef.current.remove();
      }

      // Create custom user icon
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<div style="
          background-color: #3b82f6;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      // Add user marker
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .addTo(mapRef.current!)
        .bindPopup('Your location');

      // Add distance circle
      circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: maxDistance * 1000, // Convert km to meters
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        color: '#3b82f6',
        weight: 2,
        dashArray: '5, 5',
      }).addTo(mapRef.current!);

      // Center map on user location
      mapRef.current!.setView([userLocation.lat, userLocation.lng], 10);
    };

    updateUserMarker();
  }, [userLocation, maxDistance]);

  // Update hotspot markers
  useEffect(() => {
    if (!mapRef.current) return;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;

      // Remove old markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add new markers for recommendations
      recommendations.forEach((rec, index) => {
        const { hotspot, potentialNewSpecies, score } = rec;

        // Color based on score
        const getColor = (score: number) => {
          if (score >= 50) return '#22c55e';
          if (score >= 30) return '#84cc16';
          if (score >= 20) return '#eab308';
          if (score >= 10) return '#f97316';
          return '#9ca3af';
        };

        const isSelected = hotspot.locId === selectedHotspotId;
        const size = isSelected ? 30 : Math.min(20 + potentialNewSpecies.length * 2, 35);

        const hotspotIcon = L.divIcon({
          className: 'hotspot-marker',
          html: `<div style="
            background-color: ${getColor(score)};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: ${isSelected ? '3px solid #1d4ed8' : '2px solid white'};
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: ${size > 25 ? '12px' : '10px'};
          ">${index + 1}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker([hotspot.lat, hotspot.lng], {
          icon: hotspotIcon,
        })
          .addTo(mapRef.current!)
          .bindPopup(
            `<div>
              <strong>${hotspot.locName}</strong><br/>
              <span style="color: #22c55e;">${potentialNewSpecies.length} new species</span><br/>
              <span style="color: #6b7280; font-size: 0.85em;">Score: ${score.toFixed(0)}</span>
            </div>`
          )
          .on('click', () => {
            onHotspotSelect(hotspot.locId);
          });

        markersRef.current.push(marker);
      });

      // Fit bounds to show all markers if we have recommendations
      if (recommendations.length > 0 && userLocation) {
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          ...recommendations.map((rec) => [rec.hotspot.lat, rec.hotspot.lng] as [number, number]),
        ]);
        mapRef.current!.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    updateMarkers();
  }, [recommendations, selectedHotspotId, onHotspotSelect, userLocation]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 z-[1000]">
        <div className="text-xs font-medium text-gray-700 mb-2">Hotspot Score</div>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Med</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
