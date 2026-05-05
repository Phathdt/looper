import { ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

import { describe, expect, it, vi } from 'vitest'

import { GqlThrottlerGuard } from './gql-throttler.guard'

describe('GqlThrottlerGuard', () => {
  function createGuard(): GqlThrottlerGuard {
    // GqlThrottlerGuard extends ThrottlerGuard which requires constructor parameters
    // Create an instance using Object.create to avoid needing ThrottlerGuard params
    return Object.create(GqlThrottlerGuard.prototype) as GqlThrottlerGuard
  }

  it('returns req and res from GraphQL context', () => {
    const guard = createGuard()
    const mockReq = { headers: { authorization: 'Bearer token' } }
    const mockRes = { status: 200, send: vi.fn() }
    const mockContext = {
      getContext: () => ({
        req: { ...mockReq, res: mockRes },
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    const result = guard.getRequestResponse(mockExecutionContext)

    expect(result).toEqual({
      req: { ...mockReq, res: mockRes },
      res: mockRes,
    })
    expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext)
  })

  it('extracts req and res correctly from nested context structure', () => {
    const guard = createGuard()
    const mockReq = { user: { id: 'user-1' }, ip: '127.0.0.1' }
    const mockRes = { locals: {} }
    const mockContext = {
      getContext: () => ({
        req: { ...mockReq, res: mockRes },
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    const result = guard.getRequestResponse(mockExecutionContext)

    expect(result.req).toEqual({ ...mockReq, res: mockRes })
    expect(result.res).toEqual(mockRes)
    expect(result.req.user).toEqual({ id: 'user-1' })
    expect(result.req.ip).toBe('127.0.0.1')
  })

  it('handles request and response objects with various properties', () => {
    const guard = createGuard()
    const mockReq = {
      method: 'POST',
      url: '/graphql',
      headers: { 'content-type': 'application/json' },
    }
    const mockRes = { statusCode: 200, end: vi.fn() }
    const mockContext = {
      getContext: () => ({
        req: { ...mockReq, res: mockRes },
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    const result = guard.getRequestResponse(mockExecutionContext)

    expect(result.req.method).toBe('POST')
    expect(result.req.url).toBe('/graphql')
    expect(result.res.statusCode).toBe(200)
  })

  it('preserves res reference from req.res property', () => {
    const guard = createGuard()
    const mockRes = { data: 'mock-response' }
    const mockReq = {
      id: 'request-1',
      res: mockRes,
    }
    const mockContext = {
      getContext: () => ({
        req: mockReq,
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    const result = guard.getRequestResponse(mockExecutionContext)

    expect(result.res).toBe(mockRes)
    expect(result.res).toBe(result.req.res)
  })
})
