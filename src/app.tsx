import { validateDomain } from "@hikmahtech/dossier-checks";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { secureHeaders } from "hono/secure-headers";
import { findCheck, isServerOnly } from "./checks/server";
import { domainPostureUrl, isGoTarget } from "./content/funnel";
import { isReady } from "./content/ready";
import { findTool } from "./content/tools";
import { glamaManifest, registryManifest } from "./mcp/manifests";
import { mcp } from "./mcp/route";
import type { Report } from "./reports/report";
import { site } from "./routes/site";
import { clientIp } from "./server/client-ip";
import { createLimiter } from "./server/rate-limit";
import { guardedRun } from "./server/ssrf";
import { DomainReport } from "./views/DomainReport";
import { Home } from "./views/Home";
import { ToolPage } from "./views/ToolPage";

const LEGACY_ORIGIN = "https://www.domainposture.com";
const HOUR = 60 * 60 * 1000;

/** Server-side checks cost us an outbound fetch each, so they are metered per visitor. */
const checkLimiter = createLimiter({ perWindow: 60, windowMs: HOUR, anonymousPerWindow: 30 });

export const app = new Hono();

// Lets a view read the current request (Layout needs the visitor's country for consent).
app.use(contextStorage());

// One canonical host. www serves nothing itself, so the two never compete in search results.
// 308 keeps the method, so an MCP client pointed at www still gets its POST through.
app.use(async (c, next) => {
  const url = new URL(c.req.url);
  const host = c.req.header("host")?.toLowerCase().split(":")[0];
  if (host === "www.drwho.me")
    return c.redirect(`https://drwho.me${url.pathname}${url.search}`, 308);
  return next();
});

// Google Analytics hosts are allowed only when a measurement id is configured.
const GA = Boolean(process.env.GA_MEASUREMENT_ID);
const GA_SCRIPT = GA ? ["https://www.googletagmanager.com"] : [];
const GA_CONNECT = GA
  ? [
      "https://www.google-analytics.com",
      "https://*.google-analytics.com",
      "https://*.analytics.google.com",
      "https://www.googletagmanager.com",
    ]
  : [];

app.use(
  secureHeaders({
    // Strict on purpose: visitors will point the security-headers checker at this site.
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      scriptSrc: ["'self'", ...GA_SCRIPT],
      styleSrc: ["'self'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", "data:", ...GA_SCRIPT],
      // Browser tools call these public APIs directly.
      connectSrc: ["'self'", "https://cloudflare-dns.com", ...GA_CONNECT],
      formAction: ["'self'"],
      baseUri: ["'none'"],
      frameAncestors: ["'none'"],
    },
    // No includeSubDomains or preload: other drwho.me hosts (app.drwho.me) are not this app's to bind.
    strictTransportSecurity: "max-age=31536000",
    referrerPolicy: "strict-origin-when-cross-origin",
    // The site uses none of these. Only the copy buttons need the clipboard.
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: [],
      clipboardWrite: ["self"],
    },
  }),
);

app.get("/healthz", (c) => c.text("ok"));
app.use("/css/*", serveStatic({ root: "./public" }));
app.use("/js/*", serveStatic({ root: "./public" }));
app.use("/fonts/*", serveStatic({ root: "./public" }));
app.use("/icon.svg", serveStatic({ root: "./public" }));
// Browsers ask for /favicon.ico unprompted; without this it would fall to the legacy redirect.
app.get("/favicon.ico", serveStatic({ path: "./public/icon.svg" }));

app.get("/", (c) => c.html(<Home />));
app.route("/", site);
app.route("/", mcp);

// Served as well as committed at the repo root, where Glama and the registry publisher read them.
app.get("/glama.json", (c) => c.json(glamaManifest()));
app.get("/server.json", (c) => c.json(registryManifest()));
// Proof to the MCP registry that we own drwho.me (public half of an Ed25519 key pair).
app.get("/.well-known/mcp-registry-auth", (c, next) => {
  const proof = process.env.MCP_REGISTRY_AUTH;
  return proof ? c.text(`${proof}\n`) : next();
});

async function runServerCheck(id: string, domain: string, headers: Headers): Promise<Report | 429> {
  const check = findCheck(id);
  if (!check) throw new Error(`unknown check ${id}`);
  const limit = checkLimiter.take(clientIp(headers));
  if (!limit.ok) return 429;
  return guardedRun(domain, check.run);
}

app.get("/tools/:slug", async (c, next) => {
  const tool = findTool(c.req.param("slug"));
  // A slug we do not serve may still be a live Domain Posture tool page: let the redirect have it.
  if (!tool || !isReady(tool)) return next();

  const raw = c.req.query("domain");
  const v = raw ? validateDomain(raw) : undefined;
  const domain = v?.ok ? v.domain : undefined;

  // ssr=1 comes from the <noscript> field: render the report here for a visitor without JavaScript.
  let report: Report | undefined;
  if (domain && c.req.query("ssr") === "1" && isServerOnly(tool.slug)) {
    const r = await runServerCheck(tool.slug, domain, c.req.raw.headers);
    report =
      r === 429
        ? { verdict: "Too many checks from your address. Try again later.", tone: "warn", rows: [] }
        : r;
  }
  if (tool.kind === "page") c.header("cache-control", "no-store");
  return c.html(<ToolPage tool={tool} c={c} domain={domain} report={report} />);
});

app.get("/api/v1/check/:id", async (c) => {
  const id = c.req.param("id");
  if (!isServerOnly(id)) return c.json({ error: "unknown check" }, 404);
  const r = await runServerCheck(id, c.req.query("domain") ?? "", c.req.raw.headers);
  c.header("cache-control", "no-store");
  if (r === 429) {
    c.header("retry-after", "3600");
    return c.json({ error: "rate limited" }, 429);
  }
  return c.json(r);
});

app.get("/domain-report", (c) => {
  const raw = c.req.query("domain");
  const v = raw ? validateDomain(raw) : undefined;
  const from = c.req
    .query("from")
    ?.replace(/[^a-z0-9-]/gi, "")
    .slice(0, 40);
  return c.html(<DomainReport domain={v?.ok ? v.domain : undefined} from={from} />);
});

/** One place for outbound links to Domain Posture: adds the UTM tags, never an open redirect. */
app.get("/go/:target", (c) => {
  const target = c.req.param("target");
  if (!isGoTarget(target)) return c.notFound();
  const raw = c.req.query("domain");
  const v = raw ? validateDomain(raw) : undefined;
  const from = c.req
    .query("from")
    ?.replace(/[^a-z0-9-]/gi, "")
    .slice(0, 40);
  return c.redirect(domainPostureUrl(target, { domain: v?.ok ? v.domain : undefined, from }), 302);
});

/**
 * Everything this site does not own belongs to Domain Posture. Signed evidence packs already
 * issued carry drwho.me URLs (/verify/<id>, /orders/<id>?token=, /scripts/verify-pack.mjs,
 * /.well-known/evidence-pack-pubkey.pem), so path and query must survive the redirect.
 */
app.all("*", (c) => {
  const url = new URL(c.req.url);
  return c.redirect(`${LEGACY_ORIGIN}${url.pathname}${url.search}`, 308);
});
