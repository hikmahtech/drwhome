export default function McpEndpointProse() {
  return (
    <>
      <h2>What this checks</h2>
      <p>
        MCP (Model Context Protocol) is how AI assistants connect to a tool or data source over the
        network. This tool probes <code>https://domain/mcp</code> — the path this site's own MCP
        server and most remote MCP servers use — with a plain GET request, and separately checks{" "}
        <code>/.well-known/oauth-protected-resource</code> for published OAuth discovery metadata
        (RFC 9728). If your server answers at a different path, such as <code>/mcp/mcp</code> or{" "}
        <code>/sse</code>, this check will not find it.
      </p>
      <h2>What to look for</h2>
      <p>
        HTTP 404 usually means nothing is mounted at that path. Any other response — including an
        error code — means something answered, which is as far as this check goes: it never signs
        in, sends credentials, or calls a tool.
      </p>
      <h2>Auth is a good sign here</h2>
      <p>
        An endpoint that answers 401 or 403 is telling callers to authenticate before doing anything
        — that's the expected shape for a real MCP server, not a fault.
      </p>
    </>
  );
}
