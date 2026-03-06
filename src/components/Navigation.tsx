'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useApp } from './AppProvider';
import AuthModal from './AuthModal';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/optimizer', label: 'Optimizer', icon: '🎯' },
  { href: '/bird-search', label: 'Bird Search', icon: '🔍' },
  { href: '/alerts', label: 'Rare Alerts', icon: '🔔' },
  { href: '/planner', label: 'Planner', icon: '📅' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { userSpecies, bigYearGoal, user, signOut } = useApp();
  const [showAuth, setShowAuth] = useState(false);

  const progress = bigYearGoal > 0 ? Math.min(100, Math.round((userSpecies.length / bigYearGoal) * 100)) : 0;

  return (
    <>
      <nav className="bg-green-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl">🦅</span>
              <div>
                <span className="font-bold text-lg leading-none">Big Year</span>
                <div className="text-green-300 text-xs leading-none hidden sm:block">Birding App</div>
              </div>
            </Link>

            {/* Nav links — hidden on mobile (use bottom bar instead) */}
            <div className="hidden md:flex items-center gap-0.5">
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

            {/* Right side: auth + species badge */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Auth controls — desktop only */}
              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <>
                    <span className="text-green-300 text-xs truncate max-w-[140px]" title={user.email ?? ''}>
                      {user.email}
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="text-green-200 hover:text-white text-xs px-2.5 py-1.5 rounded-md hover:bg-green-800 transition-colors border border-green-700"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="text-green-200 hover:text-white text-xs px-3 py-1.5 rounded-md hover:bg-green-800 transition-colors border border-green-700"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* Species badge */}
              {userSpecies.length > 0 && (
                <div className="flex items-center gap-2 bg-green-800 rounded-lg px-3 py-1.5">
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
        </div>
      </nav>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Mobile bottom tab bar */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 flex md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center min-h-[52px] py-2 gap-0.5 transition-colors ${
                isActive ? 'text-green-700' : 'text-gray-500'
              }`}
            >
              <span className="text-2xl leading-none">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
