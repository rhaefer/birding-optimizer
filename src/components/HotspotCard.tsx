'use client';

import { HotspotRecommendation } from '@/types';
import { formatDistance } from '@/lib/distance';
import SpeciesList from './SpeciesList';

interface HotspotCardProps {
  recommendation: HotspotRecommendation;
  rank: number;
  isSelected?: boolean;
  onClick?: () => void;
  useMiles?: boolean;
}

export default function HotspotCard({
  recommendation,
  rank,
  isSelected = false,
  onClick,
  useMiles = true,
}: HotspotCardProps) {
  const { hotspot, distance, potentialNewSpecies, score } = recommendation;

  const getScoreColor = (score: number) => {
    if (score >= 50) return 'bg-green-500';
    if (score >= 30) return 'bg-green-400';
    if (score >= 20) return 'bg-yellow-500';
    if (score >= 10) return 'bg-yellow-400';
    return 'bg-gray-400';
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-400">#{rank}</span>
          <h3 className="font-semibold text-gray-800 text-lg">{hotspot.locName}</h3>
        </div>
        <div
          className={`${getScoreColor(score)} text-white text-xs font-bold px-2 py-1 rounded`}
          title="Recommendation score"
        >
          {score.toFixed(0)}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 mb-3 text-sm">
        <div className="flex items-center gap-1 text-gray-600">
          <span>📍</span>
          <span>{formatDistance(distance, useMiles)}</span>
        </div>
        <div className="flex items-center gap-1 text-green-600 font-medium">
          <span>🐦</span>
          <span>{potentialNewSpecies.length} new species</span>
        </div>
        {hotspot.numSpeciesAllTime && (
          <div className="flex items-center gap-1 text-gray-500">
            <span>📊</span>
            <span>{hotspot.numSpeciesAllTime} total</span>
          </div>
        )}
      </div>

      {/* Species Preview */}
      {potentialNewSpecies.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <div className="text-sm text-gray-600 mb-2">
            <strong>Top species to find:</strong>
          </div>
          <div className="flex flex-wrap gap-1">
            {potentialNewSpecies.slice(0, 5).map((species) => (
              <span
                key={species.speciesCode}
                className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded"
              >
                {species.comName}
              </span>
            ))}
            {potentialNewSpecies.length > 5 && (
              <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                +{potentialNewSpecies.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Expanded View (when selected) */}
      {isSelected && (
        <div className="border-t border-gray-200 mt-4 pt-4">
          <SpeciesList species={potentialNewSpecies} title="All Potential New Species" />

          <div className="mt-4 flex gap-2">
            <a
              href={`https://ebird.org/hotspot/${hotspot.locId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              View on eBird →
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${hotspot.lat},${hotspot.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Get Directions →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
