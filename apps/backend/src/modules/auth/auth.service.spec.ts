import { JwtService } from '@nestjs/jwt'

import bcrypt from 'bcryptjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserRepository } from '../user/domain/interfaces/user.repository'
import { AuthService } from './application/services/auth.service'
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from './domain/errors'

function makeService() {
  const users = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    postsByAuthor: vi.fn(),
  } as unknown as UserRepository
  const jwt = { sign: vi.fn(() => 'tok-abc') } as unknown as JwtService
  return { service: new AuthService(users, jwt), users, jwt }
}

describe('AuthService (unit)', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('register', () => {
    it('throws EmailAlreadyRegisteredError when email already taken', async () => {
      const { service, users } = makeService()
      ;(users.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u1' })
      await expect(service.register({ name: 'a', email: 'a@b.c', password: 'secret123' })).rejects.toBeInstanceOf(
        EmailAlreadyRegisteredError,
      )
    })

    it('hashes password + creates user + returns signed token', async () => {
      const { service, users, jwt } = makeService()
      ;(users.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      const created = {
        id: 'u1',
        name: 'alice',
        email: 'a@b.c',
        password: 'hashed',
        createdAt: new Date(),
      }
      ;(users.create as ReturnType<typeof vi.fn>).mockResolvedValue(created)

      const result = await service.register({
        name: 'alice',
        email: 'a@b.c',
        password: 'secret123',
      })

      const createCall = (users.create as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(createCall.email).toBe('a@b.c')
      expect(createCall.password).not.toBe('secret123')
      expect(await bcrypt.compare('secret123', createCall.password)).toBe(true)
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'a@b.c' })
      expect(result.token).toBe('tok-abc')
      expect(result.user.id).toBe('u1')
    })
  })

  describe('login', () => {
    it('rejects missing user', async () => {
      const { service, users } = makeService()
      ;(users.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(service.login({ email: 'nope@x.x', password: 'any' })).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      )
    })

    it('rejects wrong password', async () => {
      const { service, users } = makeService()
      const hash = await bcrypt.hash('correct', 10)
      ;(users.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'u1',
        name: 'a',
        email: 'a@b.c',
        password: hash,
        createdAt: new Date(),
      })
      await expect(service.login({ email: 'a@b.c', password: 'wrong' })).rejects.toBeInstanceOf(InvalidCredentialsError)
    })

    it('returns token on valid credentials', async () => {
      const { service, users, jwt } = makeService()
      const hash = await bcrypt.hash('correct', 10)
      ;(users.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'u1',
        name: 'a',
        email: 'a@b.c',
        password: hash,
        createdAt: new Date(),
      })
      const result = await service.login({ email: 'a@b.c', password: 'correct' })
      expect(jwt.sign).toHaveBeenCalled()
      expect(result.token).toBe('tok-abc')
      expect(result.user.email).toBe('a@b.c')
    })
  })
})
