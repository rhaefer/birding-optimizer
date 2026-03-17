'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { UserLocation } from '@/types';

interface AppContextType {
  userLocation: UserLocation | null;
  userSpecies: string[];
  bigYearGoal: number;
  bigYearYear: number;
  setUserLocation: (loc: UserLocation | null) => void;
  setUserSpecies: (species: string[]) => void;
  setBigYearGoal: (goal: number) => void;
  setBigYearYear: (year: number) => void;
  isInitialized: boolean;
  user: User | null;
  signOut: () => Promise<void>;
}

const AppContext = createContext<AppContextType>({
  userLocation: null,
  userSpecies: [],
  bigYearGoal: 300,
  bigYearYear: new Date().getFullYear(),
  setUserLocation: () => {},
  setUserSpecies: () => {},
  setBigYearGoal: () => {},
  setBigYearYear: () => {},
  isInitialized: false,
  user: null,
  signOut: async () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocationState] = useState<UserLocation | null>(null);
  const [userSpecies, setUserSpeciesState] = useState<string[]>([]);
  const [bigYearGoal, setBigYearGoalState] = useState(300);
  const [bigYearYear, setBigYearYearState] = useState(new Date().getFullYear());
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Refs for stale-closure-safe access inside debounced callbacks
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<User | null>(null);
  const latestState = useRef({ userLocation, userSpecies, bigYearGoal, bigYearYear });

  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => {
    latestState.current = { userLocation, userSpecies, bigYearGoal, bigYearYear };
  }, [userLocation, userSpecies, bigYearGoal, bigYearYear]);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return; // No profile yet — created on first mutation

    if (data.location) {
      setUserLocationState(data.location);
      localStorage.setItem('big-year-location', JSON.stringify(data.location));
    }
    if (data.species && Array.isArray(data.species)) {
      setUserSpeciesState(data.species);
      localStorage.setItem('big-year-species', JSON.stringify(data.species));
    }
    if (data.big_year_goal) {
      setBigYearGoalState(data.big_year_goal);
      localStorage.setItem('big-year-goal', String(data.big_year_goal));
    }
    if (data.big_year_year) {
      setBigYearYearState(data.big_year_year);
      localStorage.setItem('big-year-year', String(data.big_year_year));
    }
  }, []);

  const syncToSupabase = useCallback((userId: string) => {
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      const s = latestState.current;
      await supabase.from('profiles').upsert({
        id: userId,
        location: s.userLocation,
        species: s.userSpecies,
        big_year_goal: s.bigYearGoal,
        big_year_year: s.bigYearYear,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }, 1500);
  }, []);

  useEffect(() => {
    // 1. Fast local load
    try {
      const loc = localStorage.getItem('big-year-location');
      const species = localStorage.getItem('big-year-species');
      const goal = localStorage.getItem('big-year-goal');
      const yr = localStorage.getItem('big-year-year');

      if (loc) setUserLocationState(JSON.parse(loc));
      if (species) setUserSpeciesState(JSON.parse(species));
      if (goal) setBigYearGoalState(parseInt(goal));
      if (yr) setBigYearYearState(parseInt(yr));
    } catch {
      // localStorage not available in SSR
    }

    // 2. Check Supabase session and load cloud profile
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        userRef.current = session.user;
        await loadProfile(session.user.id);
      }
      setIsInitialized(true);
    };

    initAuth();

    // 3. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          userRef.current = session.user;
          if (event === 'SIGNED_IN') {
            await loadProfile(session.user.id);
          }
        } else {
          setUser(null);
          userRef.current = null;
        }
      }
    );

    return () => { subscription.unsubscribe(); };
  }, [loadProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  const setUserLocation = useCallback((loc: UserLocation | null) => {
    setUserLocationState(loc);
    if (loc) localStorage.setItem('big-year-location', JSON.stringify(loc));
    else localStorage.removeItem('big-year-location');
    if (userRef.current) syncToSupabase(userRef.current.id);
  }, [syncToSupabase]);

  const setUserSpecies = useCallback((species: string[]) => {
    setUserSpeciesState(species);
    localStorage.setItem('big-year-species', JSON.stringify(species));
    if (userRef.current) syncToSupabase(userRef.current.id);
  }, [syncToSupabase]);

  const setBigYearGoal = useCallback((goal: number) => {
    setBigYearGoalState(goal);
    localStorage.setItem('big-year-goal', String(goal));
    if (userRef.current) syncToSupabase(userRef.current.id);
  }, [syncToSupabase]);

  const setBigYearYear = useCallback((year: number) => {
    setBigYearYearState(year);
    localStorage.setItem('big-year-year', String(year));
    if (userRef.current) syncToSupabase(userRef.current.id);
  }, [syncToSupabase]);

  const signOut = useCallback(async () => {
    setUser(null);
    userRef.current = null;
    await supabase.auth.signOut().catch(() => {});
  }, []);

  return (
    <AppContext.Provider
      value={{
        userLocation,
        userSpecies,
        bigYearGoal,
        bigYearYear,
        setUserLocation,
        setUserSpecies,
        setBigYearGoal,
        setBigYearYear,
        isInitialized,
        user,
        signOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
