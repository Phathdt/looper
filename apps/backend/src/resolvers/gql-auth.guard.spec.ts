import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GqlAuthGuard } from './gql-auth.guard'

describe('GqlAuthGuard', () => {
  let guard: GqlAuthGuard

  beforeEach(() => {
    vi.resetAllMocks()
    guard = new GqlAuthGuard()
  })

  it('returns true when req.user exists', () => {
    const mockUser = { id: 'user-1', email: 'test@example.com', name: 'Test User' }
    const mockContext = {
      getContext: () => ({
        req: { user: mockUser },
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    const result = guard.canActivate(mockExecutionContext)

    expect(result).toBe(true)
    expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext)
  })

  it('throws UnauthorizedException when req.user does not exist', () => {
    const mockContext = {
      getContext: () => ({
        req: {},
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException)
    expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext)
  })

  it('throws UnauthorizedException when req.user is null', () => {
    const mockContext = {
      getContext: () => ({
        req: { user: null },
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException)
    expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext)
  })

  it('throws UnauthorizedException when req.user is undefined', () => {
    const mockContext = {
      getContext: () => ({
        req: { user: undefined },
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    expect(() => guard.canActivate(mockExecutionContext)).toThrow(UnauthorizedException)
    expect(GqlExecutionContext.create).toHaveBeenCalledWith(mockExecutionContext)
  })
})
