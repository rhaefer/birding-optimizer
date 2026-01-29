'use client';

import { useState, useRef } from 'react';

interface UserSpeciesInputProps {
  userSpecies: string[];
  onSpeciesChange: (species: string[]) => void;
}

export default function UserSpeciesInput({
  userSpecies,
  onSpeciesChange,
}: UserSpeciesInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSpeciesFromText = (text: string): string[] => {
    return text
      .split(/[,\n\t]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.match(/^(Species|Common Name|Scientific Name|#|\d+$)/i));
  };

  const handleAddSpecies = () => {
    const species = parseSpeciesFromText(inputValue);
    if (species.length > 0) {
      const newSpecies = [...new Set([...userSpecies, ...species])];
      onSpeciesChange(newSpecies);
      setInputValue('');
    }
  };

  const handleRemoveSpecies = (speciesName: string) => {
    onSpeciesChange(userSpecies.filter((s) => s !== speciesName));
  };

  const handleClearAll = () => {
    onSpeciesChange([]);
    setImportSuccess(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    const species = parseSpeciesFromText(text);
    if (species.length > 0) {
      const newSpecies = [...new Set([...userSpecies, ...species])];
      onSpeciesChange(newSpecies);
      setInputValue('');
      e.preventDefault();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const species: string[] = [];

      for (const line of lines) {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols[0] && !cols[0].match(/^(Species|Common Name|Row|#)/i)) {
          const name = cols.find(c => c.length > 2 && !c.match(/^\d+$/) && !c.match(/^[A-Z]{2,4}$/));
          if (name) species.push(name);
        }
      }

      if (species.length > 0) {
        const newSpecies = [...new Set([...userSpecies, ...species])];
        onSpeciesChange(newSpecies);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Parse eBird's MyEBirdData.csv export format
  const handleEbirdCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setImportError('Could not read file');
        return;
      }

      try {
        const lines = text.split('\n');
        if (lines.length < 2) {
          setImportError('File appears to be empty');
          return;
        }

        // Parse header to find column indices
        const header = parseCSVLine(lines[0]);
        const commonNameIdx = header.findIndex(h =>
          h.toLowerCase().includes('common name') || h.toLowerCase() === 'common_name'
        );
        const dateIdx = header.findIndex(h =>
          h.toLowerCase() === 'date' || h.toLowerCase().includes('observation date')
        );

        if (commonNameIdx === -1) {
          setImportError('Could not find "Common Name" column in CSV. Is this an eBird export?');
          return;
        }

        const currentYear = new Date().getFullYear();
        const speciesSet = new Set<string>();

        // Parse each line
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const cols = parseCSVLine(line);
          const speciesName = cols[commonNameIdx]?.trim();
          const dateStr = dateIdx >= 0 ? cols[dateIdx]?.trim() : null;

          // Filter by current year if date column exists
          if (dateStr) {
            const year = new Date(dateStr).getFullYear();
            if (year !== currentYear) continue;
          }

          if (speciesName && speciesName.length > 2) {
            // Skip spuhs, slashes, and hybrids for cleaner matching
            if (!speciesName.includes('/') &&
                !speciesName.includes(' sp.') &&
                !speciesName.includes(' x ') &&
                !speciesName.match(/\(.*hybrid.*\)/i)) {
              speciesSet.add(speciesName);
            }
          }
        }

        const speciesList = Array.from(speciesSet).sort();

        if (speciesList.length === 0) {
          setImportError(`No species found for ${currentYear}. Make sure your CSV contains observations from this year.`);
          return;
        }

        const newSpecies = [...new Set([...userSpecies, ...speciesList])];
        onSpeciesChange(newSpecies);
        setImportSuccess(`Imported ${speciesList.length} species from your ${currentYear} eBird data!`);

      } catch (err) {
        console.error('CSV parse error:', err);
        setImportError('Failed to parse CSV file. Please check the file format.');
      }
    };

    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Properly parse CSV line handling quoted fields with commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold text-gray-800">
          Your Year List
          <span className={`ml-2 px-2 py-0.5 rounded text-sm ${userSpecies.length > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {userSpecies.length} species
          </span>
        </h3>
        <span className="text-gray-500">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {userSpecies.length === 0 && (
        <p className="text-yellow-600 text-sm mt-2 bg-yellow-50 p-2 rounded">
          Import your year list to get accurate recommendations.
        </p>
      )}

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* eBird CSV Import - Primary Method */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">
              Import from eBird (Recommended)
            </h4>
            <ol className="text-sm text-green-700 mb-3 list-decimal list-inside space-y-1">
              <li>Go to <a href="https://ebird.org/downloadMyData" target="_blank" rel="noopener noreferrer" className="underline font-medium">ebird.org/downloadMyData</a></li>
              <li>Click &quot;Download&quot; to get your MyEBirdData.csv</li>
              <li>Upload the file below</li>
            </ol>
            <div className="flex gap-2">
              <label className="flex-1 px-4 py-3 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors cursor-pointer text-center font-medium">
                Upload eBird CSV
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.zip"
                  onChange={handleEbirdCsvUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importError && (
              <div className="mt-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                {importError}
              </div>
            )}
            {importSuccess && (
              <div className="mt-2 text-green-600 text-sm bg-green-100 p-2 rounded">
                {importSuccess}
              </div>
            )}
          </div>

          {/* Manual Entry - Secondary Method */}
          <div className="border-t border-gray-200 pt-4">
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                Or paste species manually...
              </summary>
              <div className="mt-3">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Paste species names (one per line)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={handleAddSpecies}
                    disabled={!inputValue.trim()}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    Add
                  </button>
                  <label className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors cursor-pointer">
                    Upload CSV
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </details>
          </div>

          {/* Species List */}
          {userSpecies.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  Species in your list ({userSpecies.length}):
                </span>
                <button
                  onClick={handleClearAll}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {userSpecies.map((species) => (
                  <span
                    key={species}
                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                  >
                    {species}
                    <button
                      onClick={() => handleRemoveSpecies(species)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
