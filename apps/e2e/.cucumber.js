const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
require('ts-node/register')
require('tsconfig-paths/register')

function getCliFeaturePaths() {
  return process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith('-'))
    .filter((arg) => arg.includes('.feature'))
}

const cliFeaturePaths = getCliFeaturePaths()

// Parallel workers — 2 by default, override via env CUCUMBER_PARALLEL.
// Cucumber distributes scenarios across workers (each worker = own browser).
// Most tests are hermetic (faker emails per registration); a few scenarios
// still touch the shared seeded alice@looper.dev — those use idempotent ops
// (login, like upsert) so concurrent runs don't conflict.
const parallel = Number(process.env.CUCUMBER_PARALLEL ?? 2)

module.exports = {
  default: {
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    require: ['tests/features/**/*.steps.ts', 'tests/support/**/*.ts'],
    paths: cliFeaturePaths.length > 0 ? cliFeaturePaths : ['tests/features/**/*.feature'],
    parallel,
    format: [
      process.env.TEST_ENVIRONMENT === 'ci' ? 'progress' : 'progress-bar',
      'json:test-results/cucumber-report.json',
      'summary:test-results/summary.txt',
    ],
    publishQuiet: true,
  },
}
