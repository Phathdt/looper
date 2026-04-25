import type { Request } from 'express'

import type { RequestLoaders } from '../../modules/dataloader/dataloader.service'

export interface GqlContext {
  req: Request & { user?: { id: string; email: string; name?: string } }
  loaders: RequestLoaders
}
