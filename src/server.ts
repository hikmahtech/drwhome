import { serve } from "@hono/node-server";
import { app } from "./app";
import { installNetworkGuard } from "./server/ssrf";

// Before anything can fetch: every outgoing connection is checked against private ranges.
installNetworkGuard();

// A missing secret must be loud. On koyracloud a secret named in the manifest but never entered
// is simply empty, and the deploy still reports healthy.
for (const name of ["IPINFO_TOKEN"]) {
  if (!process.env[name])
    console.warn(`[boot] ${name} is unset: the tools that need it are disabled`);
}

const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port }, () => console.log(`drwho.me listening on :${port}`));
