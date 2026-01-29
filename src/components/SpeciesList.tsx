'use client';

import { SpeciesSighting } from '@/types';

interface SpeciesListProps {
  species: SpeciesSighting[];
  title?: string;
  maxDisplay?: number;
}

export default function SpeciesList({
  species,
  title = 'Potential New Species',
  maxDisplay = 20,
}: SpeciesListProps) {
  const displaySpecies = species.slice(0, maxDisplay);
  const hasMore = species.length > maxDisplay;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (species.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">
        No new species found at this location
      </div>
    );
  }

  return (
    <div>
      {title && (
        <h4 className="font-medium text-gray-800 mb-2">
          {title} ({species.length})
        </h4>
      )}

      <ul className="space-y-2">
        {displaySpecies.map((s) => (
          <li
            key={s.speciesCode}
            className="flex justify-between items-start text-sm border-b border-gray-100 pb-2"
          >
            <div>
              <span className="font-medium text-gray-800">{s.comName}</span>
              <span className="text-gray-500 text-xs ml-2 italic">{s.sciName}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500 text-xs">{formatDate(s.lastSeen)}</span>
              {s.count && s.count > 1 && (
                <span className="text-gray-400 text-xs block">×{s.count}</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <p className="text-gray-500 text-xs mt-2 text-center">
          +{species.length - maxDisplay} more species
        </p>
      )}
    </div>
  );
}
