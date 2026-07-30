import { globSync } from "node:fs";
import { resolve } from "node:path";

export const dataRoot = resolve("src/data");
export const dataFiles = globSync("**/*.json", { cwd: dataRoot })
  .map((file) => file.replaceAll("\\", "/"))
  .sort();
