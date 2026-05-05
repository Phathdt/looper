import { URLS } from '@config/urls.config'
import { faker } from '@faker-js/faker'

export interface ApiUser {
  id: string
  name: string
  email: string
  password: string
  token: string
}

async function gql<T>(query: string, token?: string): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
  const res = await fetch(URLS.API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query }),
  })
  return res.json() as Promise<{ data?: T; errors?: Array<{ message: string }> }>
}

// Registers a fresh user via GraphQL — used for parallel-safe scenario setup.
// Each call generates a unique email so concurrent workers never collide.
export async function registerFreshUser(prefix = 'e2e'): Promise<ApiUser> {
  const name = faker.person.firstName()
  const email = `${prefix}-${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@looper.test`
  const password = 'password123'
  const json = await gql<{ register: { token: string; user: { id: string } } }>(
    `mutation { register(input: { name: "${name}", email: "${email}", password: "${password}" }) { token user { id } } }`,
  )
  const token = json.data?.register?.token
  const id = json.data?.register?.user?.id
  if (!token || !id) throw new Error(`Failed to register: ${JSON.stringify(json.errors)}`)
  return { id, name, email, password, token }
}

export async function createPostAs(user: ApiUser, content: string): Promise<string> {
  const safe = content.replace(/"/g, '\\"')
  const json = await gql<{ createPost: { id: string } }>(
    `mutation { createPost(content: "${safe}") { id } }`,
    user.token,
  )
  const id = json.data?.createPost?.id
  if (!id) throw new Error(`Failed to createPost: ${JSON.stringify(json.errors)}`)
  return id
}

export async function followUserAs(viewer: ApiUser, targetUserId: string): Promise<void> {
  await gql(`mutation { follow(userId: "${targetUserId}") }`, viewer.token)
}
