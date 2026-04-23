import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthResolver } from "./auth.resolver";

@Module({
  imports: [
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
