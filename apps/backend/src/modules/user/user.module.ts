import { Module } from '@nestjs/common'

import { UserService } from './application/services/user.service'
import { IUserRepository } from './domain/interfaces/user.repository'
import { IUserService } from './domain/interfaces/user.service'
import { UserPrismaRepository } from './infrastructure/repositories/user.prisma-repository'
import { UserResolver } from './infrastructure/resolvers/user.resolver'

@Module({
  providers: [
    UserResolver,
    { provide: IUserService, useClass: UserService },
    { provide: IUserRepository, useClass: UserPrismaRepository },
  ],
  exports: [IUserService, IUserRepository],
})
export class UserModule {}
