import path from "node:path";
import { fileURLToPath } from "node:url";

export function packageRootFromHere(importMetaUrl: string): string {
  const here = path.dirname(fileURLToPath(importMetaUrl));
  return path.resolve(here, "..", "..");
}

export function dataDir(importMetaUrl: string): string {
  return path.join(packageRootFromHere(importMetaUrl), "data");
}
