import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createGraphQLAppHarness, type GraphQLAppHarness } from '../test-utils/graphql-app-harness'
import { startPostgres, stopPostgres } from '../test-utils/setup-postgres'

describe('FollowResolver (integration)', () => {
  let harness: GraphQLAppHarness

  beforeAll(async () => {
    await startPostgres()
    harness = await createGraphQLAppHarness()
  })

  afterAll(async () => {
    await harness?.close()
    await stopPostgres()
  })

  it('follow and unfollow mutations work correctly', async () => {
    const aliceReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Alice', email: `alice-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const aliceId = aliceReg.data.register.user.id

    const bobReg = await harness.gql(`mutation($i: RegisterInput!) { register(input: $i) { token user { id } } }`, {
      i: { name: 'Bob', email: `bob-${Date.now()}@x.x`, password: 'pw12345' },
    })
    const bobToken = bobReg.data.register.token

    // Bob follows Alice
    const followRes = await harness.gql(
      `mutation($userId: ID!) { follow(userId: $userId) }`,
      { userId: aliceId },
      bobToken,
    )
    expect(followRes.data.follow).toBe(true)

    // Bob queries Alice's followers before unfollow
    let aliceQuery = await harness.gql(
      `query($id: ID!) { user(id: $id) { followersCount isFollowing } }`,
      { id: aliceId },
      bobToken,
    )
    expect(aliceQuery.data.user.followersCount).toBe(1)
    expect(aliceQuery.data.user.isFollowing).toBe(true)

    // Bob unfollows Alice
    const unfollowRes = await harness.gql(
      `mutation($userId: ID!) { unfollow(userId: $userId) }`,
      { userId: aliceId },
      bobToken,
    )
    expect(unfollowRes.data.unfollow).toBe(true)

    // Bob queries Alice's followers after unfollow
    aliceQuery = await harness.gql(
      `query($id: ID!) { user(id: $id) { followersCount isFollowing } }`,
      { id: aliceId },
      bobToken,
    )
    expect(aliceQuery.data.user.followersCount).toBe(0)
    expect(aliceQuery.data.user.isFollowing).toBe(false)
  })
})
