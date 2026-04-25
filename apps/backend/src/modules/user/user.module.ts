import { Module } from '@nestjs/common'

import { UserService } from './application/services/user.service'
import { UserRepository } from './domain/interfaces/user.repository'
import { UserPrismaRepository } from './infrastructure/repositories/user.prisma-repository'
import { UserResolver } from './infrastructure/resolvers/user.resolver'

@Module({
  providers: [UserService, UserResolver, { provide: UserRepository, useClass: UserPrismaRepository }],
  exports: [UserService, UserRepository],
})
export class UserModule {}
