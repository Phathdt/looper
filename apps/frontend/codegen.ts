import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "http://localhost:4000/graphql",
  documents: ["src/**/*.graphql"],
  generates: {
    "src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-react-query"],
      config: {
        fetcher: {
          func: "@/lib/fetcher#fetcher",
          isReactHook: false,
        },
        exposeQueryKeys: true,
      },
    },
  },
};

export default config;
