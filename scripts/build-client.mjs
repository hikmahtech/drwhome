// Bundles one browser script per tool and copies the self-hosted fonts into public/.
import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { build } from "esbuild";

const minify = process.argv.includes("--minify");
const entries = readdirSync("src/client")
  .filter((f) => f.endsWith(".ts") && !f.startsWith("_"))
  .map((f) => `src/client/${f}`);

await build({
  entryPoints: entries,
  outdir: "public/js",
  bundle: true,
  splitting: true,
  chunkNames: "chunks/[name]-[hash]",
  format: "esm",
  platform: "browser",
  // The check package is one file that also imports node:tls and whoiser for server-only checks.
  alias: {
    tls: "./src/client/_empty.ts",
    "node:tls": "./src/client/_empty.ts",
    whoiser: "./src/client/_empty.ts",
  },
  target: "es2022",
  minify,
  sourcemap: !minify,
  logLevel: "info",
});

mkdirSync("public/fonts", { recursive: true });
const fonts = [
  ["@fontsource-variable/archivo/files/archivo-latin-standard-normal.woff2", "archivo.woff2"],
  ["@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2", "plex-mono-400.woff2"],
  ["@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2", "plex-mono-500.woff2"],
];
for (const [from, to] of fonts) cpSync(`node_modules/${from}`, `public/fonts/${to}`);
