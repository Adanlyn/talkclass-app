//frontend\src\state\dashboardFilters.tsx
import React, { createContext, useContext, useMemo, useState } from 'react';

export type FiltersState = {
  from: string;         // ISO
  to: string;           // ISO
  categoryId?: string | null;
  questionId?: string | null;
  curso?: string | null;
  turno?: string | null;
  unidade?: string | null;
  identified?: boolean | null;
};

const today = new Date();
const iso = (d: Date) => d.toISOString();
const minusDays = (n: number) => new Date(today.getTime() - n*24*60*60*1000);

const defaultState: FiltersState = {
  from: iso(minusDays(30)),
  to: iso(today),
  categoryId: null,
  questionId: null,
  curso: null,
  turno: null,
  unidade: null,
  identified: null,
};

type Ctx = {
  value: FiltersState;
  set: (patch: Partial<FiltersState>) => void;
  reset: () => void;
};

const DashboardFiltersCtx = createContext<Ctx | null>(null);

export function DashboardFiltersProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<FiltersState>(defaultState);
  const ctx = useMemo<Ctx>(() => ({
    value,
    set: (patch) => setValue(v => ({ ...v, ...patch })),
    reset: () => setValue(defaultState),
  }), [value]);

  return (
    <DashboardFiltersCtx.Provider value={ctx}>{children}</DashboardFiltersCtx.Provider>
  );
}

export function useDashboardFilters() {
  const ctx = useContext(DashboardFiltersCtx);
  if (!ctx) throw new Error('useDashboardFilters must be used inside DashboardFiltersProvider');
  return ctx;
}
