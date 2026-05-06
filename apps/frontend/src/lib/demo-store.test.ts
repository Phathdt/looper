import { demoStore } from '@/lib/demo-store'

import { beforeEach, describe, expect, it } from 'vitest'

describe('demoStore', () => {
  beforeEach(() => {
    demoStore.getState().setEnabled(true)
    demoStore.getState().setStats({ queryCount: 0, dataLoaderEnabled: true })
  })

  it('initializes with default state', () => {
    const { dataLoaderEnabled, lastStats } = demoStore.getState()
    expect(dataLoaderEnabled).toBe(true)
    expect(lastStats).not.toBeNull()
  })

  it('setEnabled updates dataLoaderEnabled', () => {
    demoStore.getState().setEnabled(false)
    expect(demoStore.getState().dataLoaderEnabled).toBe(false)

    demoStore.getState().setEnabled(true)
    expect(demoStore.getState().dataLoaderEnabled).toBe(true)
  })

  it('setStats updates lastStats', () => {
    const stats = { queryCount: 5, dataLoaderEnabled: false }
    demoStore.getState().setStats(stats)
    expect(demoStore.getState().lastStats).toEqual(stats)
  })

  it('setStats with different values', () => {
    demoStore.getState().setStats({ queryCount: 10, dataLoaderEnabled: true })
    expect(demoStore.getState().lastStats?.queryCount).toBe(10)
    expect(demoStore.getState().lastStats?.dataLoaderEnabled).toBe(true)
  })

  it('maintains independent state for enabled and stats', () => {
    demoStore.getState().setEnabled(false)
    demoStore.getState().setStats({ queryCount: 3, dataLoaderEnabled: true })
    expect(demoStore.getState().dataLoaderEnabled).toBe(false)
    expect(demoStore.getState().lastStats?.dataLoaderEnabled).toBe(true)
  })
})
