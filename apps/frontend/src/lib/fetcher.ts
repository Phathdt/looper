import { authStore } from './auth-store'

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? 'http://localhost:4000/graphql'

export const fetcher = <TData, TVariables>(
  query: string | { toString(): string },
  variables?: TVariables,
  headers?: HeadersInit,
): (() => Promise<TData>) => {
  return async () => {
    const token = authStore.getState().token
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: JSON.stringify({ query: String(query), variables }),
    })

    const json = await res.json()
    if (json.errors) {
      throw new Error(json.errors[0]?.message ?? 'GraphQL error')
    }
    return json.data as TData
  }
}
