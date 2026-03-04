'use client';

import { useEffect, useRef, useState } from 'react';
import { RareBirdAlert } from '@/types';

interface AlertsMapProps {
  alerts: RareBirdAlert[];
  selectedAlert: RareBirdAlert | null;
  centerLat: number;
  centerLng: number;
  onAlertSelect: (alert: RareBirdAlert | null) => void;
}

export default function AlertsMap({ alerts, selectedAlert, centerLat, centerLng, onAlertSelect }: AlertsMapProps) {
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
      if (alerts.length === 0) return;

      alerts.forEach((alert) => {
        const isSelected = selectedAlert?.subId === alert.subId;
        const isNew = alert.isNew;
        const color = isSelected ? '#ea580c' : isNew ? '#16a34a' : '#f97316';
        const size = isSelected ? 28 : 20;

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:${color};width:${size}px;height:${size}px;
            border-radius:50%;border:${isSelected ? '3px solid #9a3412' : '2px solid white'};
            box-shadow:0 2px 4px rgba(0,0,0,.3);
            display:flex;align-items:center;justify-content:center;
            color:white;font-size:${size > 22 ? '12' : '9'}px;
          ">${isNew ? '★' : '!'}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const daysAgo = Math.floor((Date.now() - new Date(alert.obsDt).getTime()) / 86400000);
        const marker = L.marker([alert.lat, alert.lng], { icon })
          .addTo(mapRef.current!)
          .bindPopup(
            `<strong>${alert.comName}</strong><br/>
            <span style="font-size:0.8em;color:#555">${alert.locName}</span><br/>
            <span style="font-size:0.8em;color:#888">${daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</span>
            ${isNew ? '<br/><span style="color:#16a34a;font-size:0.8em;font-weight:bold">New for your list!</span>' : ''}`
          )
          .on('click', () => onAlertSelect(alert));
        markersRef.current.push(marker);
      });

      const bounds = L.latLngBounds(alerts.map((a) => [a.lat, a.lng] as [number, number]));
      mapRef.current!.fitBounds(bounds, { padding: [50, 50] });
    };
    updateMarkers();
  }, [alerts, selectedAlert, onAlertSelect, mapReady]);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !selectedAlert) return;
    mapRef.current.setView([selectedAlert.lat, selectedAlert.lng], Math.max(mapRef.current.getZoom(), 12));
  }, [selectedAlert, mapReady]);

  return (
    <div className="relative w-full h-full min-h-[350px]">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow p-2 z-[1000] text-xs">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-3 h-3 rounded-full bg-green-600"></div>
          <span>New for your list</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Already seen</span>
        </div>
      </div>
    </div>
  );
}
