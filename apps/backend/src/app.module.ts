import { join } from 'node:path'

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { JwtService } from '@nestjs/jwt'

import { LoggerModule } from 'nestjs-pino'

import { DataLoaderModule } from './graphql/dataloader/dataloader.module'
import { DataLoaderService } from './graphql/dataloader/dataloader.service'
import { loggerConfig } from './logger.config'
import { AuthModule } from './modules/auth/auth.module'
import { CommentModule } from './modules/comment/comment.module'
import { FeedModule } from './modules/feed/feed.module'
import { FollowModule } from './modules/follow/follow.module'
import { PostModule } from './modules/post/post.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { UserModule } from './modules/user/user.module'
import { AppResolver } from './resolvers/app.resolver'
import { AuthResolver } from './resolvers/auth.resolver'
import { CommentResolver } from './resolvers/comment.resolver'
import { FeedResolver } from './resolvers/feed.resolver'
import { FollowResolver } from './resolvers/follow.resolver'
import { PostResolver } from './resolvers/post.resolver'
import { UserResolver } from './resolvers/user.resolver'

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    PrismaModule,
    UserModule,
    CommentModule,
    FollowModule,
    PostModule,
    AuthModule,
    DataLoaderModule,
    FeedModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [DataLoaderModule, AuthModule],
      inject: [JwtService, DataLoaderService],
      useFactory: (jwt: JwtService, loaderSvc: DataLoaderService) => ({
        autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
        sortSchema: true,
        playground: true,
        context: ({ req }: { req: any }) => {
          const auth = req.headers.authorization as string | undefined
          if (auth?.startsWith('Bearer ')) {
            try {
              const payload = jwt.verify(auth.slice(7)) as { sub: string; email: string }
              req.user = { id: payload.sub, email: payload.email }
            } catch {
              /* invalid token — leave unauthenticated */
            }
          }
          return { req, loaders: loaderSvc.createLoaders(req.user?.id) }
        },
      }),
    }),
  ],
  providers: [AppResolver, AuthResolver, CommentResolver, FeedResolver, FollowResolver, PostResolver, UserResolver],
})
export class AppModule {}
