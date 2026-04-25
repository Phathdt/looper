import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'

import { afterEach, expect, vi } from 'vitest'

expect.extend(matchers)

afterEach(() => cleanup())

// jsdom lacks IntersectionObserver — stub it for components that observe sentinels
if (!('IntersectionObserver' in globalThis)) {
  class NoopIntersectionObserver {
    observe = vi.fn()
    disconnect = vi.fn()
    unobserve = vi.fn()
    takeRecords = vi.fn(() => [])
    root = null
    rootMargin = ''
    thresholds = []
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: NoopIntersectionObserver,
  })
}
