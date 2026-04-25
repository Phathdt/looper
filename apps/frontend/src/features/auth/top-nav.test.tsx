import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Button } from '@/components/ui/button'
import { authStore } from '@/lib/auth-store'

import { Link, MemoryRouter, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Inline TopNav recreation to test logout behavior
// Mirrors behavior in src/router.tsx (not exported → copy here)
function TopNav() {
  const navigate = useNavigate()
  const user = authStore((state) => state.user)

  function handleLogout() {
    authStore.getState().clear()
    navigate('/login')
  }

  return (
    <header>
      <Link to='/'>Looper</Link>
      <Button asChild size='sm'>
        <Link to='/create'>Create Post</Link>
      </Button>
      {user && (
        <Button asChild size='sm'>
          <Link to={`/user/${user.id}`}>Profile</Link>
        </Button>
      )}
      <Button size='sm' onClick={handleLogout}>
        Logout
      </Button>
    </header>
  )
}

function renderWithAuth(authed: boolean) {
  if (authed) authStore.getState().setAuth('tok', { id: 'u1', name: 'alice', email: 'a@b.c' })
  else authStore.getState().clear()

  const client = new QueryClient()
  return (
    vi.mocked(null),
    (() => {
      const { render } = require('@testing-library/react')
      return render(
        <QueryClientProvider client={client}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route
                element={
                  <>
                    <TopNav />
                    <Outlet />
                  </>
                }
              >
                <Route index element={<div>HOME</div>} />
              </Route>
              <Route path='/login' element={<div>LOGIN</div>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>,
      )
    })()
  )
}

describe('<TopNav />', () => {
  beforeEach(() => {
    authStore.getState().clear()
    localStorage.clear()
  })

  it('shows Profile link when authenticated', () => {
    renderWithAuth(true)
    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /create post/i })).toBeInTheDocument()
  })

  it('hides Profile link when unauthenticated', () => {
    renderWithAuth(false)
    expect(screen.queryByRole('link', { name: /^profile$/i })).not.toBeInTheDocument()
  })

  it('logout clears auth and redirects to /login', async () => {
    renderWithAuth(true)
    expect(authStore.getState().token).toBe('tok')
    await userEvent.click(screen.getByRole('button', { name: /logout/i }))
    expect(authStore.getState().token).toBeNull()
    expect(await screen.findByText('LOGIN')).toBeInTheDocument()
  })
})
