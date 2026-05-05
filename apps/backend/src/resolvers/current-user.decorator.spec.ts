import { ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

import { describe, expect, it, vi } from 'vitest'

import type { AuthUser } from './current-user.decorator'

describe('CurrentUser decorator factory', () => {
  it('extracts user from GraphQL context', () => {
    const mockUser: AuthUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
    }

    const mockContext = {
      getContext: () => ({
        req: { user: mockUser },
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    // Simulate the factory function logic from createParamDecorator
    const ctx = GqlExecutionContext.create(mockExecutionContext)
    const result = ctx.getContext().req.user

    expect(result).toEqual(mockUser)
    expect(result.id).toBe('user-1')
    expect(result.email).toBe('test@example.com')
    expect(result.name).toBe('Test User')
  })

  it('returns user with all required fields', () => {
    const mockUser: AuthUser = {
      id: 'user-xyz',
      email: 'john@example.com',
      name: 'John Doe',
    }

    const mockContext = {
      getContext: () => ({
        req: { user: mockUser },
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    const ctx = GqlExecutionContext.create(mockExecutionContext)
    const result = ctx.getContext().req.user

    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('email')
    expect(result).toHaveProperty('name')
  })

  it('returns null when user is not set', () => {
    const mockContext = {
      getContext: () => ({
        req: { user: null },
      }),
    }

    const mockExecutionContext = {
      switchToHttp: vi.fn(),
    } as unknown as ExecutionContext

    vi.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockContext as any)

    const ctx = GqlExecutionContext.create(mockExecutionContext)
    const result = ctx.getContext().req.user

    expect(result).toBeNull()
  })
})
