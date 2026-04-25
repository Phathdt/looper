import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./application/services/auth.service";
import { AuthResolver } from "./infrastructure/resolvers/auth.resolver";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    UserModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? "change-me",
        signOptions: { expiresIn: "7d" },
      }),
      global: true,
    }),
  ],
  providers: [AuthService, AuthResolver],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
