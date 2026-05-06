import { authStore } from '@/lib/auth-store'
import { demoStore } from '@/lib/demo-store'
import { fetcher } from '@/lib/fetcher'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('fetcher', () => {
  beforeEach(() => {
    authStore.getState().clear()
    demoStore.getState().setEnabled(true)
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns data on success', async () => {
    const json = vi.fn().mockResolvedValue({ data: { health: 'ok' } })
    global.fetch = vi.fn().mockResolvedValue({ json }) as unknown as typeof fetch

    const result = await fetcher<{ health: string }, undefined>('{health}')()
    expect(result.health).toBe('ok')
  })

  it('adds Authorization header when token present', async () => {
    authStore.getState().setAuth('my-token', { id: '1', name: 'a', email: 'a@b.c' })
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ data: {} }) })
    global.fetch = fetchMock as unknown as typeof fetch

    await fetcher('{}')()
    const callInit = fetchMock.mock.calls[0][1]
    expect(callInit.headers.Authorization).toBe('Bearer my-token')
  })

  it('omits Authorization when no token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ data: {} }) })
    global.fetch = fetchMock as unknown as typeof fetch

    await fetcher('{}')()
    const callInit = fetchMock.mock.calls[0][1]
    expect(callInit.headers.Authorization).toBeUndefined()
  })

  it('omits x-disable-dataloader header when dataLoaderEnabled is true', async () => {
    demoStore.getState().setEnabled(true)
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ data: {} }) })
    global.fetch = fetchMock as unknown as typeof fetch

    await fetcher('{}')()
    const callInit = fetchMock.mock.calls[0][1]
    expect(callInit.headers['x-disable-dataloader']).toBeUndefined()
  })

  it('includes x-disable-dataloader header when dataLoaderEnabled is false', async () => {
    demoStore.getState().setEnabled(false)
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ data: {} }) })
    global.fetch = fetchMock as unknown as typeof fetch

    await fetcher('{}')()
    const callInit = fetchMock.mock.calls[0][1]
    expect(callInit.headers['x-disable-dataloader']).toBe('1')
  })

  it('throws on GraphQL errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ errors: [{ message: 'Boom' }] }),
    }) as unknown as typeof fetch

    await expect(fetcher('{}')()).rejects.toThrow('Boom')
  })

  it('sets demo stats when extensions.queryCount is present', async () => {
    const demoStoreMock = await import('@/lib/demo-store')
    const setStatsSpy = vi.spyOn(demoStoreMock.demoStore.getState(), 'setStats')

    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: { health: 'ok' },
        extensions: { queryCount: 5, dataLoaderEnabled: true },
      }),
    }) as unknown as typeof fetch

    await fetcher<{ health: string }, undefined>('{health}')()
    expect(setStatsSpy).toHaveBeenCalledWith({ queryCount: 5, dataLoaderEnabled: true })

    setStatsSpy.mockRestore()
  })

  it('does not call setStats when extensions.queryCount is undefined', async () => {
    const demoStoreMock = await import('@/lib/demo-store')
    const setStatsSpy = vi.spyOn(demoStoreMock.demoStore.getState(), 'setStats')

    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ data: { health: 'ok' } }),
    }) as unknown as typeof fetch

    await fetcher<{ health: string }, undefined>('{health}')()
    expect(setStatsSpy).not.toHaveBeenCalled()

    setStatsSpy.mockRestore()
  })
})
