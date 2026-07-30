import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { APIRoute, GetStaticPaths } from "astro";
import { dataFiles, dataRoot } from "../../data-files";

export const getStaticPaths = (() =>
  dataFiles.map((file) => ({
    params: { path: file.slice(0, -".json".length) },
    props: { file },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(await readFile(join(dataRoot, props.file)), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
