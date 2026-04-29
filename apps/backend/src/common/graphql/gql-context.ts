import type { Request } from 'express'

import type { RequestLoaders } from '../../graphql/dataloader/dataloader.service'
import type { RequestStats } from '../request-context'

export interface GqlContext {
  req: Request & { user?: { id: string; email: string; name?: string } }
  loaders: RequestLoaders
  stats: RequestStats
}
