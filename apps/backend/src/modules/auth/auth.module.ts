import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { UserModule } from '../user/user.module'
import { AuthService } from './application/services/auth.service'
import { IAuthService } from './domain/interfaces/auth.service'
import { AuthResolver } from './infrastructure/resolvers/auth.resolver'

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? 'change-me',
        signOptions: { expiresIn: '7d' },
      }),
      global: true,
    }),
  ],
  providers: [AuthResolver, { provide: IAuthService, useClass: AuthService }],
  exports: [IAuthService, JwtModule],
})
export class AuthModule {}
