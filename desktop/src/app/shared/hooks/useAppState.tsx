import React, { type ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { testSupabaseConnection } from '@/lib/supabase';
import type { BookingContextValue, PageKey, SupabaseStatus } from '../types';

const AppStateContext = createContext<BookingContextValue | undefined>(undefined);

export interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [currentPage, setCurrentPage] = useState<PageKey>('home');
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseStatus>('testing');

  useEffect(() => {
    let isMounted = true;

    const probeSupabase = async () => {
      try {
        const isConnected = await testSupabaseConnection();
        if (isMounted) {
          setSupabaseStatus(isConnected ? 'connected' : 'error');
        }
      } catch {
        if (isMounted) {
          setSupabaseStatus('error');
        }
      }
    };

    probeSupabase();

    return () => {
      isMounted = false;
    };
  }, []);

  const navigate = useCallback((page: PageKey) => {
    setCurrentPage(page);
  }, []);

  const value = useMemo<BookingContextValue>(
    () => ({ currentPage, supabaseStatus, navigate }),
    [currentPage, supabaseStatus, navigate]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

