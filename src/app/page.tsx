'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppProvider';
import ApiKeyInput from '@/components/ApiKeyInput';
import AuthModal from '@/components/AuthModal';

const FEATURES = [
  {
    href: '/optimizer',
    icon: '🎯',
    title: 'Hotspot Optimizer',
    description: 'Find nearby birding hotspots ranked by potential new species. Supports home birding and business-trip mode.',
    cta: 'Find Hotspots',
    color: 'green',
  },
  {
    href: '/bird-search',
    icon: '🔍',
    title: 'Bird Search',
    description: 'Search any species and instantly see where it has been reported near you or any destination.',
    cta: 'Search Birds',
    color: 'blue',
  },
  {
    href: '/alerts',
    icon: '🔔',
    title: 'Rare Bird Alerts',
    description: 'Live feed of notable and rare sightings near your location. Never miss a rarity again.',
    cta: 'View Alerts',
    color: 'orange',
  },
  {
    href: '/planner',
    icon: '📅',
    title: 'Big Year Planner',
    description: 'Build a month-by-month plan to reach your species target, based on your location and travel availability.',
    cta: 'Build My Plan',
    color: 'purple',
  },
];

const colorMap: Record<string, string> = {
  green: 'bg-green-50 border-green-200 hover:border-green-400',
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
  orange: 'bg-orange-50 border-orange-200 hover:border-orange-400',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
};

const ctaColorMap: Record<string, string> = {
  green: 'bg-green-600 hover:bg-green-700',
  blue: 'bg-blue-600 hover:bg-blue-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
};

// Parse a CSV line respecting quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function ImportModal({
  onClose,
  onImport,
  currentGoal,
  onGoalChange,
  onReset,
}: {
  onClose: () => void;
  onImport: (species: string[]) => void;
  currentGoal: number;
  onGoalChange: (goal: number) => void;
  onReset: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState('');
  const [goalInput, setGoalInput] = useState(String(currentGoal));
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'csv' | 'paste' | 'goal' | 'reset'>('csv');
  const [confirmReset, setConfirmReset] = useState(false);

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) { setStatus({ type: 'error', message: 'Could not read file.' }); return; }

      const lines = text.split('\n');
      const header = parseCSVLine(lines[0]);
      const nameIdx = header.findIndex(h => h.toLowerCase().includes('common name') || h.toLowerCase() === 'common_name');
      const dateIdx = header.findIndex(h => h.toLowerCase() === 'date' || h.toLowerCase().includes('observation date'));

      if (nameIdx === -1) {
        setStatus({ type: 'error', message: 'Could not find "Common Name" column. Is this an eBird MyEBirdData.csv export?' });
        return;
      }

      const currentYear = new Date().getFullYear();
      const speciesSet = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        const name = cols[nameIdx]?.trim();
        const dateStr = dateIdx >= 0 ? cols[dateIdx]?.trim() : null;

        if (dateStr && new Date(dateStr).getFullYear() !== currentYear) continue;
        if (!name || name.length < 2) continue;
        if (name.includes('/') || name.includes(' sp.') || name.includes(' x ')) continue;

        speciesSet.add(name);
      }

      if (speciesSet.size === 0) {
        setStatus({ type: 'error', message: `No species found for ${currentYear}. Make sure observations from this year are in the file.` });
        return;
      }

      onImport(Array.from(speciesSet));
      setStatus({ type: 'success', message: `Imported ${speciesSet.size} species from your ${currentYear} eBird data.` });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = () => {
    const species = pasteText
      .split(/[\n,\t]/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !s.match(/^(Species|Common Name|#|\d+$)/i));
    if (species.length === 0) { setStatus({ type: 'error', message: 'No species found in pasted text.' }); return; }
    onImport(species);
    setStatus({ type: 'success', message: `Added ${species.length} species.` });
    setPasteText('');
  };

  const handleGoalSave = () => {
    const n = parseInt(goalInput);
    if (isNaN(n) || n < 1) { setStatus({ type: 'error', message: 'Enter a valid number.' }); return; }
    onGoalChange(n);
    setStatus({ type: 'success', message: `Goal updated to ${n} species.` });
  };

  const tabs = [
    { id: 'csv' as const, label: 'CSV Upload' },
    { id: 'paste' as const, label: 'Paste List' },
    { id: 'goal' as const, label: 'Edit Goal' },
    { id: 'reset' as const, label: 'Reset' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">Import eBird Data</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 -mr-2">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setStatus(null); setConfirmReset(false); }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                t.id === 'reset'
                  ? activeTab === 'reset'
                    ? 'text-red-600 border-b-2 border-red-500'
                    : 'text-red-400 hover:text-red-600'
                  : activeTab === t.id
                    ? 'text-green-700 border-b-2 border-green-600'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'csv' && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Most accurate — your personal data</span>
              </div>
              <ol className="text-sm text-gray-600 space-y-2 mb-4 list-decimal list-inside">
                <li>Go to <a href="https://ebird.org/downloadMyData" target="_blank" rel="noopener noreferrer" className="text-green-600 underline font-medium">ebird.org/downloadMyData</a></li>
                <li>Click <strong>Download My Data</strong> to get your CSV</li>
                <li>Upload below — only {new Date().getFullYear()} species are imported</li>
              </ol>
              <label className="flex items-center justify-center w-full py-4 px-4 border-2 border-dashed border-green-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                <div className="text-center">
                  <div className="text-3xl mb-1">📁</div>
                  <p className="text-sm font-medium text-green-700">Click to upload MyEBirdData.csv</p>
                  <p className="text-xs text-gray-400 mt-0.5">or drag and drop</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".csv,.zip" onChange={handleCSV} className="hidden" />
              </label>
            </div>
          )}

          {activeTab === 'paste' && (
            <div>
              <p className="text-sm text-gray-600 mb-3">Paste species names — one per line, or comma-separated.</p>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={'American Robin\nNorthern Cardinal\nRed-tailed Hawk\n...'}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
              />
              <button
                onClick={handlePaste}
                disabled={!pasteText.trim()}
                className="w-full mt-3 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 font-medium text-sm"
              >
                Import Pasted List
              </button>
            </div>
          )}

          {activeTab === 'goal' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">Set your target species count for the year. This updates your progress % and pace calculations.</p>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target species</label>
              <input
                type="number"
                value={goalInput}
                onChange={e => setGoalInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGoalSave()}
                min={50} max={1000} step={25}
                className="w-full px-4 py-3 text-xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
              />
              <div className="flex gap-2 mt-3">
                {[200, 250, 300, 350, 400].map(n => (
                  <button
                    key={n}
                    onClick={() => setGoalInput(String(n))}
                    className={`flex-1 py-2.5 text-sm rounded-lg border transition-colors ${
                      goalInput === String(n)
                        ? 'bg-green-600 text-white border-green-600'
                        : 'border-gray-200 text-gray-600 hover:border-green-400'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGoalSave}
                className="w-full mt-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
              >
                Save Goal
              </button>
            </div>
          )}

          {activeTab === 'reset' && (
            <div>
              <p className="text-sm text-gray-600 mb-6">
                This clears your species list, eBird key, location, and goal from this device. Your account data in the cloud is not affected.
              </p>
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
                >
                  Reset All App Data
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-red-700 text-center">Are you sure? This cannot be undone.</p>
                  <button
                    onClick={() => { onReset(); onClose(); }}
                    className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm transition-colors"
                  >
                    Yes, Reset Everything
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status message */}
          {status && (
            <div className={`mt-4 p-3 rounded-lg text-sm font-medium ${
              status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {status.type === 'success' ? '✓ ' : '✗ '}{status.message}
              {status.type === 'error' && (
                <div className="mt-1.5 text-xs font-normal opacity-90">
                  Download your data at <a href="https://ebird.org/downloadMyData" target="_blank" rel="noopener noreferrer" className="underline">ebird.org/downloadMyData</a>.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { apiKey, setApiKey, userSpecies, setUserSpecies, bigYearGoal, setBigYearGoal, bigYearYear, user } = useApp();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => { setIsInitialized(true); }, []);

  if (!isInitialized) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>;
  }

  const currentYear = new Date().getFullYear();
  const dayOfYear = Math.floor((Date.now() - new Date(currentYear, 0, 0).getTime()) / 86400000);
  const daysRemaining = 365 - dayOfYear;
  const progress = bigYearGoal > 0 ? Math.min(100, (userSpecies.length / bigYearGoal) * 100) : 0;
  const pace = dayOfYear > 0 ? (userSpecies.length / dayOfYear) * 365 : 0;
  const neededPerDay = daysRemaining > 0 ? ((bigYearGoal - userSpecies.length) / daysRemaining) : 0;

  const handleImport = (species: string[]) => {
    const merged = Array.from(new Set([...userSpecies, ...species]));
    setUserSpecies(merged);
  };

  const handleReset = () => {
    setApiKey(null);
    setUserSpecies([]);
    setBigYearGoal(300);
    // Clear all localStorage keys
    ['ebird-api-key', 'big-year-species', 'big-year-goal', 'big-year-year', 'big-year-location'].forEach(
      k => localStorage.removeItem(k)
    );
  };

  if (!apiKey) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🦅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Big Year Birding App</h1>
          <p className="text-gray-600">
            Hotspot optimizer, rare alerts, bird search, and month-by-month planning.
          </p>
        </div>

        {/* Returning user: sign in is the primary action */}
        {!user && (
          <div className="bg-green-900 text-white rounded-2xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-1">Already have an account?</h2>
            <p className="text-green-300 text-sm mb-4">Sign in to load your eBird key and species list automatically.</p>
            <button
              onClick={() => setShowAuth(true)}
              className="w-full py-3 bg-white text-green-900 rounded-xl font-bold text-base hover:bg-green-50 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="w-full mt-2 py-2.5 text-green-300 text-sm hover:text-white transition-colors"
            >
              New here? Create a free account →
            </button>
          </div>
        )}

        {user && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
            <div className="text-green-700 font-medium text-sm">Signed in as {user.email}</div>
            <div className="text-green-600 text-xs mt-0.5">Enter your eBird key below to finish setup</div>
          </div>
        )}

        {/* eBird key setup */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-800 mb-3 text-center">
            {user ? 'Connect to eBird' : 'Or connect manually with your eBird key'}
          </h2>
          <ApiKeyInput onApiKeySet={setApiKey} />
          <p className="text-center text-xs text-gray-400 mt-2">
            Free key at{' '}
            <a href="https://ebird.org/api/keygen" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
              ebird.org/api/keygen
            </a>
          </p>
        </div>

        {/* Feature preview */}
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f.href} className={`border-2 rounded-xl p-3 ${colorMap[f.color]}`}>
              <div className="text-2xl mb-1">{f.icon}</div>
              <h3 className="font-semibold text-gray-800 text-sm">{f.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{f.description}</p>
            </div>
          ))}
        </div>

        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Big Year Stats Bar */}
      <div className="bg-green-900 text-white rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{bigYearYear} Big Year</h1>
            <p className="text-green-300 text-xs sm:text-sm mt-0.5">
              {daysRemaining} days remaining &bull; {dayOfYear} days elapsed
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex gap-3 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-300">{userSpecies.length}</div>
                <div className="text-xs text-green-400 uppercase tracking-wide">Species</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white">{bigYearGoal}</div>
                <div className="text-xs text-green-400 uppercase tracking-wide">Goal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300">{Math.round(progress)}%</div>
                <div className="text-xs text-green-400 uppercase tracking-wide">Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-300">{pace.toFixed(0)}</div>
                <div className="text-xs text-green-400 uppercase tracking-wide">Pace/yr</div>
              </div>
            </div>

            {/* Import button */}
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 bg-green-700 hover:bg-green-600 text-white text-sm font-medium px-3 sm:px-4 py-2.5 rounded-xl transition-colors border border-green-600 whitespace-nowrap"
            >
              <span>📥</span>
              <span className="hidden sm:inline">Import eBird Data</span>
              <span className="sm:hidden">Import</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-green-400 mb-1">
            <span>{userSpecies.length} species</span>
            <span>Goal: {bigYearGoal}</span>
          </div>
          <div className="h-3 bg-green-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pace note */}
        <div className="flex items-center justify-between mt-3">
          {userSpecies.length > 0 ? (
            <p className="text-green-300 text-xs">
              {pace >= bigYearGoal
                ? 'On pace to exceed your goal — great work!'
                : `Need ~${neededPerDay.toFixed(2)} species/day to reach ${bigYearGoal}. Use the Optimizer for high-yield hotspots.`}
            </p>
          ) : (
            <p className="text-yellow-300 text-xs">
              No species logged yet — click <strong>Import eBird Data</strong> above to load your year list.
            </p>
          )}
          <div className="flex items-center gap-3 ml-4 shrink-0">
            {user && (
              <span className="text-green-500 text-xs">☁ synced</span>
            )}
            {!user && (
              <button
                onClick={() => setShowAuth(true)}
                className="text-green-400 hover:text-green-200 text-xs underline underline-offset-2"
              >
                Sign in
              </button>
            )}
            <button
              onClick={() => setShowImport(true)}
              className="text-green-400 hover:text-green-200 text-xs underline underline-offset-2"
            >
              Edit goal
            </button>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`border-2 rounded-xl p-5 transition-all cursor-pointer block ${colorMap[f.color]}`}
          >
            <div className="text-4xl mb-3">{f.icon}</div>
            <h2 className="font-bold text-gray-800 mb-2">{f.title}</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{f.description}</p>
            <span className={`inline-block text-white text-sm font-medium px-4 py-1.5 rounded-lg ${ctaColorMap[f.color]}`}>
              {f.cta} →
            </span>
          </Link>
        ))}
      </div>

      {/* Quick tips + social teaser */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Tips for Big Year Success</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><span>🌅</span>Dawn hours are always best — arrive before sunrise at hotspots.</li>
            <li className="flex gap-2"><span>📋</span>Keep your eBird app open during outings for real-time tracking.</li>
            <li className="flex gap-2"><span>🗺️</span>Use Business Trip Mode in the Optimizer to maximize any upcoming travel.</li>
            <li className="flex gap-2"><span>🔔</span>Check Rare Alerts daily — rare birds often stay only 1–3 days.</li>
            <li className="flex gap-2"><span>📅</span>Plan May trips early — peak migration is the highest-yield month of the year.</li>
          </ul>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Coming Soon: Social Features</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><span>👥</span>Follow other birders and see their live activity feed.</li>
            <li className="flex gap-2"><span>🏆</span>Regional leaderboards — compare your year list with others.</li>
            <li className="flex gap-2"><span>📸</span>Share sightings with photos to the community.</li>
            <li className="flex gap-2"><span>🤝</span>Find birding partners for trips and local patches.</li>
            <li className="flex gap-2"><span>📊</span>Analytics: your pace vs. top birders in your region.</li>
          </ul>
          <p className="text-xs text-gray-400 mt-3">Social features require account creation — coming in v2.</p>
        </div>
      </div>

      {/* Import modal */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
          currentGoal={bigYearGoal}
          onGoalChange={setBigYearGoal}
          onReset={handleReset}
        />
      )}

      {/* Auth modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
