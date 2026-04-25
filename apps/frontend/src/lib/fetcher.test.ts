import { authStore } from '@/lib/auth-store'
import { fetcher } from '@/lib/fetcher'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('fetcher', () => {
  beforeEach(() => {
    authStore.getState().clear()
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

  it('throws on GraphQL errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ errors: [{ message: 'Boom' }] }),
    }) as unknown as typeof fetch

    await expect(fetcher('{}')()).rejects.toThrow('Boom')
  })
})
