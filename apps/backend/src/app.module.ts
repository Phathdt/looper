import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { LoggerModule } from "nestjs-pino";
import { join } from "node:path";
import { AppResolver } from "./app.resolver";
import { loggerConfig } from "./logger.config";

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      sortSchema: true,
      playground: true,
    }),
  ],
  providers: [AppResolver],
})
export class AppModule {}
