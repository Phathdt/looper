import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RequestStats {
  queryCount: number
  dataLoaderEnabled: boolean
}

interface DemoState {
  dataLoaderEnabled: boolean
  lastStats: RequestStats | null
  setEnabled: (enabled: boolean) => void
  setStats: (stats: RequestStats) => void
}

export const demoStore = create<DemoState>()(
  persist(
    (set) => ({
      dataLoaderEnabled: true,
      lastStats: null,
      setEnabled: (enabled) => set({ dataLoaderEnabled: enabled }),
      setStats: (stats) => set({ lastStats: stats }),
    }),
    { name: 'looper-demo', partialize: (s) => ({ dataLoaderEnabled: s.dataLoaderEnabled }) },
  ),
)
