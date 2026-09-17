import { SERVER_INFO } from "./server";
import { mcpTools } from "./tools";

const REPO = "https://github.com/hikmahtech/drwhome";
export const MCP_URL = "https://drwho.me/mcp/mcp";

/** glama.json: Glama reads it from the repo root to learn who maintains the server. */
export const glamaManifest = () => ({
  $schema: "https://glama.ai/mcp/schemas/server.json",
  maintainers: ["arshadansari27"],
});

/** server.json: the entry in the official MCP registry (registry.modelcontextprotocol.io). */
export function registryManifest() {
  // The registry schema caps the description at 100 characters.
  const description = `${mcpTools.length} free tools: DNS, email auth (SPF, DKIM, DMARC), TLS, headers, WHOIS, dev utils.`;
  if (description.length > 100)
    throw new Error(`server.json description is ${description.length} chars`);
  return {
    $schema: "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
    name: "me.drwho/tools",
    title: "drwho.me network and developer tools",
    description,
    version: SERVER_INFO.version,
    websiteUrl: "https://drwho.me/mcp",
    repository: { url: REPO, source: "github" },
    remotes: [{ type: "streamable-http", url: MCP_URL }],
  };
}
