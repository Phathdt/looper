import { execSync } from 'node:child_process'
import path from 'node:path'

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'

let container: StartedPostgreSqlContainer | null = null

export async function startPostgres(): Promise<string> {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('looper_test')
    .withUsername('postgres')
    .withPassword('postgres')
    .start()

  const url = container.getConnectionUri()
  process.env.DATABASE_URL = url

  execSync('pnpm prisma migrate deploy', {
    cwd: path.resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  })

  return url
}

export async function stopPostgres(): Promise<void> {
  if (container) {
    await container.stop()
    container = null
  }
}
