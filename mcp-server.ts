#!/usr/bin/env node
/**
 * The same MCP tools over stdio. The root Dockerfile runs this, which is how Glama builds and
 * inspects the server. Hosted use goes through https://drwho.me/mcp/mcp instead.
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./src/mcp/server";
import { installNetworkGuard } from "./src/server/ssrf";

installNetworkGuard();
await createMcpServer().connect(new StdioServerTransport());
