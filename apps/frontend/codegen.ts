import type { CodegenConfig } from "@graphql-codegen/cli";

const typedDocumentStringClass = `
export class TypedDocumentString<TResult, TVariables> extends String {
  __apiType?: (variables: TVariables) => TResult;
  constructor(value: string, public __meta__?: Record<string, unknown>) {
    super(value);
  }
  toString(): string & { __apiType?: (variables: TVariables) => TResult } {
    return this as unknown as string;
  }
}
`;

const config: CodegenConfig = {
  schema: "http://localhost:4000/graphql",
  documents: ["src/**/*.graphql"],
  generates: {
    "src/generated/graphql.ts": {
      plugins: [
        { add: { content: typedDocumentStringClass } },
        "typescript",
        "typescript-operations",
        "typescript-react-query",
      ],
      config: {
        fetcher: {
          func: "@/lib/fetcher#fetcher",
          isReactHook: false,
        },
        exposeQueryKeys: true,
        exposeFetcher: true,
        addInfiniteQuery: true,
        reactQueryVersion: 5,
        documentMode: "string",
      },
    },
  },
};

export default config;
