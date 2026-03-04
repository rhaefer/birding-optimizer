'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from './AppProvider';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/optimizer', label: 'Optimizer', icon: '🎯' },
  { href: '/bird-search', label: 'Bird Search', icon: '🔍' },
  { href: '/alerts', label: 'Rare Alerts', icon: '🔔' },
  { href: '/planner', label: 'Planner', icon: '📅' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { userSpecies, bigYearGoal } = useApp();

  const progress = bigYearGoal > 0 ? Math.min(100, Math.round((userSpecies.length / bigYearGoal) * 100)) : 0;

  return (
    <nav className="bg-green-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-2xl">🦅</span>
            <div className="hidden sm:block">
              <span className="font-bold text-lg leading-none">Big Year</span>
              <div className="text-green-300 text-xs leading-none">Birding App</div>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-green-700 text-white'
                      : 'text-green-200 hover:bg-green-800 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Year list badge */}
          {userSpecies.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 bg-green-800 rounded-lg px-3 py-1.5 shrink-0">
              <div className="text-right">
                <div className="text-sm font-bold text-white">
                  {userSpecies.length}
                  <span className="text-green-300 font-normal text-xs"> / {bigYearGoal}</span>
                </div>
                <div className="text-xs text-green-300">species</div>
              </div>
              <div className="w-8 h-8 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#166534" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="#4ade80"
                    strokeWidth="3"
                    strokeDasharray={`${progress * 0.942} 94.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-300">
                  {progress}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
