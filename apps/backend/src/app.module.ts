import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { JwtService } from "@nestjs/jwt";
import { LoggerModule } from "nestjs-pino";
import { join } from "node:path";
import { AppResolver } from "./app.resolver";
import { loggerConfig } from "./logger.config";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { PostModule } from "./modules/post/post.module";
import { CommentModule } from "./modules/comment/comment.module";
import { FollowModule } from "./modules/follow/follow.module";
import { FeedModule } from "./modules/feed/feed.module";
import { DataLoaderModule } from "./modules/dataloader/dataloader.module";
import { DataLoaderService } from "./modules/dataloader/dataloader.service";

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    PrismaModule,
    AuthModule,
    DataLoaderModule,
    UserModule,
    PostModule,
    CommentModule,
    FollowModule,
    FeedModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [DataLoaderModule, AuthModule],
      inject: [JwtService, DataLoaderService],
      useFactory: (jwt: JwtService, loaderSvc: DataLoaderService) => ({
        autoSchemaFile: join(process.cwd(), "src/schema.gql"),
        sortSchema: true,
        playground: true,
        context: ({ req }: { req: any }) => {
          const auth = req.headers.authorization as string | undefined;
          if (auth?.startsWith("Bearer ")) {
            try {
              const payload = jwt.verify(auth.slice(7)) as { sub: string; email: string };
              req.user = { id: payload.sub, email: payload.email };
            } catch {
              /* invalid token — leave unauthenticated */
            }
          }
          return { req, loaders: loaderSvc.createLoaders(req.user?.id) };
        },
      }),
    }),
  ],
  providers: [AppResolver],
})
export class AppModule {}
