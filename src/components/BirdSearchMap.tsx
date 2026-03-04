'use client';

import { useEffect, useRef, useState } from 'react';
import { BirdSearchObservation } from '@/types';

interface BirdSearchMapProps {
  observations: BirdSearchObservation[];
  selectedObs: BirdSearchObservation | null;
  centerLat: number;
  centerLng: number;
  onObsSelect: (obs: BirdSearchObservation | null) => void;
}

export default function BirdSearchMap({
  observations,
  selectedObs,
  centerLat,
  centerLng,
  onObsSelect,
}: BirdSearchMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initMap = async () => {
      const L = (await import('leaflet')).default;
      delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      if (!mapContainerRef.current || mapRef.current) return;
      mapRef.current = L.map(mapContainerRef.current).setView([centerLat, centerLng], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapRef.current);
      setMapReady(true);
    };
    initMap();
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      if (observations.length === 0) return;

      observations.forEach((obs, idx) => {
        const isSelected = selectedObs?.locId === obs.locId;
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:${isSelected ? '#2563eb' : '#3b82f6'};
            width:${isSelected ? 28 : 20}px;height:${isSelected ? 28 : 20}px;
            border-radius:50%;border:${isSelected ? '3px solid #1e40af' : '2px solid white'};
            box-shadow:0 2px 4px rgba(0,0,0,.3);
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:10px;font-weight:bold;
          ">${idx + 1}</div>`,
          iconSize: [isSelected ? 28 : 20, isSelected ? 28 : 20],
          iconAnchor: [isSelected ? 14 : 10, isSelected ? 14 : 10],
        });

        const daysAgo = Math.floor((Date.now() - new Date(obs.obsDt).getTime()) / 86400000);
        const marker = L.marker([obs.lat, obs.lng], { icon })
          .addTo(mapRef.current!)
          .bindPopup(`<strong>${obs.locName}</strong><br/>${daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}${obs.howMany ? ` &bull; ${obs.howMany} bird${obs.howMany > 1 ? 's' : ''}` : ''}`)
          .on('click', () => onObsSelect(obs));
        markersRef.current.push(marker);
      });

      if (observations.length > 0) {
        const bounds = L.latLngBounds(observations.map((o) => [o.lat, o.lng] as [number, number]));
        mapRef.current!.fitBounds(bounds, { padding: [50, 50] });
      }
    };
    updateMarkers();
  }, [observations, selectedObs, onObsSelect, mapReady]);

  // Pan to selected
  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedObs) return;
    mapRef.current.setView([selectedObs.lat, selectedObs.lng], Math.max(mapRef.current.getZoom(), 12));
  }, [selectedObs, mapReady]);

  return (
    <div className="relative w-full h-full min-h-[350px]">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {observations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-xl">
          <p className="text-gray-400 text-sm">Search results will appear on the map</p>
        </div>
      )}
    </div>
  );
}
