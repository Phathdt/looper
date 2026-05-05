import { compare, hash } from 'bcryptjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { IUserRepository } from '../../../user/domain/interfaces/user.repository'
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from '../../domain/errors'
import type { ITokenSigner } from '../../domain/interfaces/token-signer'
import { AuthService } from './auth.service'

function makeService() {
  const users = {
    findByEmail: vi.fn(),
    findCredentialsByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    postsByAuthor: vi.fn(),
  } as unknown as IUserRepository
  const tokens = { sign: vi.fn(() => 'tok-abc') } as unknown as ITokenSigner
  return { service: new AuthService(users, tokens), users, tokens }
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
      const { service, users, tokens } = makeService()
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
      expect(await compare('secret123', createCall.password)).toBe(true)
      expect(tokens.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'a@b.c' })
      expect(result.token).toBe('tok-abc')
      expect(result.user.id).toBe('u1')
    })
  })

  describe('login', () => {
    it('rejects missing user', async () => {
      const { service, users } = makeService()
      ;(users.findCredentialsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null)
      await expect(service.login({ email: 'nope@x.x', password: 'any' })).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      )
    })

    it('rejects wrong password', async () => {
      const { service, users } = makeService()
      const hashed = await hash('correct', 10)
      ;(users.findCredentialsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'u1',
        name: 'a',
        email: 'a@b.c',
        password: hashed,
        createdAt: new Date(),
      })
      await expect(service.login({ email: 'a@b.c', password: 'wrong' })).rejects.toBeInstanceOf(InvalidCredentialsError)
    })

    it('returns token on valid credentials', async () => {
      const { service, users, tokens } = makeService()
      const hashed = await hash('correct', 10)
      ;(users.findCredentialsByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: 'u1',
        name: 'a',
        email: 'a@b.c',
        password: hashed,
        createdAt: new Date(),
      })
      const result = await service.login({ email: 'a@b.c', password: 'correct' })
      expect(tokens.sign).toHaveBeenCalled()
      expect(result.token).toBe('tok-abc')
      expect(result.user.email).toBe('a@b.c')
    })
  })
})
