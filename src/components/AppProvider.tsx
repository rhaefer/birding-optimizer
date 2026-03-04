'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserLocation } from '@/types';

interface AppContextType {
  apiKey: string | null;
  userLocation: UserLocation | null;
  userSpecies: string[];
  bigYearGoal: number;
  bigYearYear: number;
  setApiKey: (key: string | null) => void;
  setUserLocation: (loc: UserLocation | null) => void;
  setUserSpecies: (species: string[]) => void;
  setBigYearGoal: (goal: number) => void;
  setBigYearYear: (year: number) => void;
  isInitialized: boolean;
}

const AppContext = createContext<AppContextType>({
  apiKey: null,
  userLocation: null,
  userSpecies: [],
  bigYearGoal: 300,
  bigYearYear: new Date().getFullYear(),
  setApiKey: () => {},
  setUserLocation: () => {},
  setUserSpecies: () => {},
  setBigYearGoal: () => {},
  setBigYearYear: () => {},
  isInitialized: false,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(null);
  const [userSpecies, setUserSpeciesState] = useState<string[]>([]);
  const [bigYearGoal, setBigYearGoalState] = useState(300);
  const [bigYearYear, setBigYearYearState] = useState(new Date().getFullYear());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const key = localStorage.getItem('ebird-api-key');
      const loc = localStorage.getItem('big-year-location');
      const species = localStorage.getItem('big-year-species');
      const goal = localStorage.getItem('big-year-goal');
      const yr = localStorage.getItem('big-year-year');

      if (key) setApiKeyState(key);
      if (loc) setUserLocationState(JSON.parse(loc));
      if (species) setUserSpeciesState(JSON.parse(species));
      if (goal) setBigYearGoalState(parseInt(goal));
      if (yr) setBigYearYearState(parseInt(yr));
    } catch {
      // localStorage may not be available in SSR
    }
    setIsInitialized(true);
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    setApiKeyState(key);
    if (key) localStorage.setItem('ebird-api-key', key);
    else localStorage.removeItem('ebird-api-key');
  }, []);

  const setUserLocation = useCallback((loc: UserLocation | null) => {
    setUserLocationState(loc);
    if (loc) localStorage.setItem('big-year-location', JSON.stringify(loc));
    else localStorage.removeItem('big-year-location');
  }, []);

  const setUserSpecies = useCallback((species: string[]) => {
    setUserSpeciesState(species);
    localStorage.setItem('big-year-species', JSON.stringify(species));
  }, []);

  const setBigYearGoal = useCallback((goal: number) => {
    setBigYearGoalState(goal);
    localStorage.setItem('big-year-goal', String(goal));
  }, []);

  const setBigYearYear = useCallback((year: number) => {
    setBigYearYearState(year);
    localStorage.setItem('big-year-year', String(year));
  }, []);

  return (
    <AppContext.Provider
      value={{
        apiKey,
        userLocation,
        userSpecies,
        bigYearGoal,
        bigYearYear,
        setApiKey,
        setUserLocation,
        setUserSpecies,
        setBigYearGoal,
        setBigYearYear,
        isInitialized,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
