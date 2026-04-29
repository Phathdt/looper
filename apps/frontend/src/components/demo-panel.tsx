import { demoStore } from '@/lib/demo-store'

export function DemoPanel() {
  const dataLoaderEnabled = demoStore((s) => s.dataLoaderEnabled)
  const setEnabled = demoStore((s) => s.setEnabled)
  const lastStats = demoStore((s) => s.lastStats)

  const count = lastStats?.queryCount ?? null
  const status = lastStats ? (lastStats.dataLoaderEnabled ? 'batched' : 'unbatched') : '—'

  return (
    <aside
      className='fixed bottom-4 right-4 z-50 w-64 rounded-lg border bg-background/95 p-3 shadow-lg backdrop-blur'
      aria-label='N+1 demo panel'
    >
      <div className='flex items-center justify-between mb-2'>
        <span className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>N+1 Demo</span>
        <button
          type='button'
          onClick={() => setEnabled(!dataLoaderEnabled)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
            dataLoaderEnabled ? 'bg-primary' : 'bg-destructive'
          }`}
          aria-pressed={dataLoaderEnabled}
          aria-label='Toggle DataLoader batching'
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-background transition ${
              dataLoaderEnabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      <div className='text-xs text-muted-foreground mb-1'>
        DataLoader:{' '}
        <span className={dataLoaderEnabled ? 'text-primary' : 'text-destructive'}>
          {dataLoaderEnabled ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className='flex items-baseline gap-2 border-t pt-2'>
        <span className='text-3xl font-mono font-bold tabular-nums'>{count ?? '–'}</span>
        <span className='text-xs text-muted-foreground'>SQL queries (last request, {status})</span>
      </div>
    </aside>
  )
}
