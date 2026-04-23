const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT ?? "http://localhost:4000/graphql";

export async function fetcher<TData, TVariables>(
  query: string,
  variables?: TVariables,
): Promise<TData> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message ?? "GraphQL error");
  }
  return json.data;
}
