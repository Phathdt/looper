import { readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";

const file = argv[2] ?? "src/generated/graphql.ts";
const src = readFileSync(file, "utf8");

const patched = src.replace(
  /getNextPageParam: options\?\.getNextPageParam,/g,
  "getNextPageParam: options?.getNextPageParam ?? (() => undefined),",
);

if (patched !== src) {
  writeFileSync(file, patched);
  console.log(`[patch-infinite-hooks] applied to ${file}`);
}
