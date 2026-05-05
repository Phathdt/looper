import { JwtService } from '@nestjs/jwt'

import { describe, expect, it, vi } from 'vitest'

import { JwtTokenSigner } from './jwt-token-signer'

function makeJwtService() {
  return {
    sign: vi.fn(() => 'mocked.jwt.token'),
  } as unknown as JwtService
}

describe('JwtTokenSigner', () => {
  it('sign: delegates to JwtService.sign and returns token', () => {
    const jwtService = makeJwtService()
    const signer = new JwtTokenSigner(jwtService)

    const payload = { userId: 'u1', email: 'test@example.com' }
    const token = signer.sign(payload)

    expect(token).toBe('mocked.jwt.token')
    expect(jwtService.sign).toHaveBeenCalledWith(payload)
  })

  it('sign: passes complex payload correctly', () => {
    const jwtService = makeJwtService()
    const signer = new JwtTokenSigner(jwtService)

    const payload = {
      userId: 'u1',
      email: 'test@example.com',
      roles: ['user', 'admin'],
      metadata: { foo: 'bar' },
    }
    signer.sign(payload)

    expect(jwtService.sign).toHaveBeenCalledWith(payload)
  })

  it('sign: handles empty payload', () => {
    const jwtService = makeJwtService()
    const signer = new JwtTokenSigner(jwtService)

    signer.sign({})

    expect(jwtService.sign).toHaveBeenCalledWith({})
  })
})
