import { AsyncLocalStorage } from 'node:async_hooks'

export interface RequestStats {
  queryCount: number
  dataLoaderEnabled: boolean
}

export const requestContext = new AsyncLocalStorage<RequestStats>()

export function incrementQueryCount(): void {
  const store = requestContext.getStore()
  if (store) store.queryCount += 1
}
