import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:4000/graphql",
  documents: ["src/**/*.graphql"],
  hooks: {
    afterOneFileWrite: ["node scripts/patch-infinite-hooks.mjs"],
  },
  generates: {
    "src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-react-query"],
      config: {
        fetcher: {
          func: "@/lib/fetcher#fetcher",
          isReactHook: false,
        },
        exposeQueryKeys: true,
        exposeFetcher: true,
        addInfiniteQuery: true,
      },
    },
  },
};

export default config;
