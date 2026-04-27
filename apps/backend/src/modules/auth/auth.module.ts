import { IUserRepository } from '@modules/user'
import { Module } from '@nestjs/common'
import { JwtModule, JwtService } from '@nestjs/jwt'

import { UserModule } from '../user/user.module'
import { AuthService } from './application/services/auth.service'
import { IAuthService } from './domain/interfaces/auth.service'
import { ITokenSigner } from './domain/interfaces/token-signer'
import { JwtTokenSigner } from './infrastructure/token/jwt-token-signer'

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
  providers: [
    {
      provide: ITokenSigner,
      useFactory: (jwt: JwtService) => new JwtTokenSigner(jwt),
      inject: [JwtService],
    },
    {
      provide: IAuthService,
      useFactory: (users: IUserRepository, tokens: ITokenSigner) => new AuthService(users, tokens),
      inject: [IUserRepository, ITokenSigner],
    },
  ],
  exports: [IAuthService, JwtModule],
})
export class AuthModule {}
