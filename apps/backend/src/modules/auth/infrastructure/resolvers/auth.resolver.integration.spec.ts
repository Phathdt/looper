import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createGraphQLAppHarness, type GraphQLAppHarness } from '../../../../test-utils/graphql-app-harness'
import { startPostgres, stopPostgres } from '../../../../test-utils/setup-postgres'

describe('AuthResolver (integration)', () => {
  let harness: GraphQLAppHarness

  beforeAll(async () => {
    await startPostgres()
    harness = await createGraphQLAppHarness()
  })

  afterAll(async () => {
    await harness?.close()
    await stopPostgres()
  })

  it('register mutation succeeds with valid input', async () => {
    const email = `int-${Date.now()}@x.x`
    const res = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id name } } }`, {
      i: { name: 'IntUser', email, password: 'pw12345' },
    })
    expect(res.data.register.token).toMatch(/^eyJ/)
    expect(res.data.register.user.id).toBeDefined()
    expect(res.data.register.user.name).toBe('IntUser')
  })

  it('register mutation rejects duplicate email', async () => {
    const email = `dup-${Date.now()}@x.x`
    const input = { name: 'User1', email, password: 'pw12345' }

    // First registration
    const first = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token } }`, { i: input })
    expect(first.data.register.token).toBeDefined()

    // Second registration with same email
    const second = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token } }`, { i: input })
    expect(second.errors).toBeDefined()
  })

  it('login mutation works correctly with registered credentials', async () => {
    const email = `login-${Date.now()}@x.x`
    const password = 'pw12345'

    // First register
    const reg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id name } } }`, {
      i: { name: 'LoginUser', email, password },
    })
    expect(reg.data.register.token).toBeDefined()

    // Then login with same credentials
    const login = await harness.gql(`mutation($i: LoginInput!) { login(input: $i) { token user { id name } } }`, {
      i: { email, password },
    })
    expect(login.data.login.token).toBeDefined()
    expect(login.data.login.user.name).toBe('LoginUser')
    expect(login.data.login.user.id).toBe(reg.data.register.user.id)
  })
})
