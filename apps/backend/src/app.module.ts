import { join } from 'node:path'

import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { GraphQLModule } from '@nestjs/graphql'
import { JwtService } from '@nestjs/jwt'
import { ThrottlerModule } from '@nestjs/throttler'

import { LoggerModule } from 'nestjs-pino'

import { requestContext, type RequestStats } from './common/request-context'
import { GqlThrottlerGuard } from './common/throttler/gql-throttler.guard'
import { DataLoaderModule } from './graphql/dataloader/dataloader.module'
import { DataLoaderService } from './graphql/dataloader/dataloader.service'
import { loggerConfig } from './logger.config'
import { AuthModule } from './modules/auth/auth.module'
import { CommentModule } from './modules/comment/comment.module'
import { FeedModule } from './modules/feed/feed.module'
import { FollowModule } from './modules/follow/follow.module'
import { LikeModule } from './modules/like/like.module'
import { PostModule } from './modules/post/post.module'
import { PrismaModule } from './modules/prisma/prisma.module'
import { UserModule } from './modules/user/user.module'
import { AppResolver } from './resolvers/app.resolver'
import { AuthResolver } from './resolvers/auth.resolver'
import { CommentResolver } from './resolvers/comment.resolver'
import { FeedResolver } from './resolvers/feed.resolver'
import { FollowResolver } from './resolvers/follow.resolver'
import { LikeResolver } from './resolvers/like.resolver'
import { PostResolver } from './resolvers/post.resolver'
import { UserResolver } from './resolvers/user.resolver'

const demoStatsPlugin = {
  async requestDidStart() {
    return {
      async willSendResponse({ response, contextValue }: any) {
        const stats: RequestStats | undefined = contextValue?.stats
        if (!stats) return
        if (response.body.kind === 'single') {
          response.body.singleResult.extensions = {
            ...(response.body.singleResult.extensions ?? {}),
            queryCount: stats.queryCount,
            dataLoaderEnabled: stats.dataLoaderEnabled,
          }
        }
      },
    }
  },
}

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    UserModule,
    CommentModule,
    FollowModule,
    LikeModule,
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
        plugins: [demoStatsPlugin],
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
          const dataLoaderEnabled = req.headers['x-disable-dataloader'] !== '1'
          const stats: RequestStats = { queryCount: 0, dataLoaderEnabled }
          requestContext.enterWith(stats)
          return {
            req,
            loaders: loaderSvc.createLoaders(req.user?.id, { batch: dataLoaderEnabled }),
            stats,
          }
        },
      }),
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: GqlThrottlerGuard },
    AppResolver,
    AuthResolver,
    CommentResolver,
    FeedResolver,
    FollowResolver,
    LikeResolver,
    PostResolver,
    UserResolver,
  ],
})
export class AppModule {}
