import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'

import { MemoryRouter } from 'react-router-dom'

export function createWrapper({ initialPath = '/' } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

export function renderWithProviders(
  ui: ReactNode,
  opts: { initialPath?: string } & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { initialPath, ...rest } = opts
  return render(ui, { wrapper: createWrapper({ initialPath }), ...rest })
}
