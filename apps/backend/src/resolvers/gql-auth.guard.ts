import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'

@Injectable()
export class GqlAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = GqlExecutionContext.create(context).getContext().req
    if (!req.user) throw new UnauthorizedException()
    return true
  }
}
