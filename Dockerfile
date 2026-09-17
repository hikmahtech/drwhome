# The MCP server over stdio. Glama builds this image to inspect the tools.
# The website and the hosted endpoint (https://drwho.me/mcp/mcp) build from Dockerfile.web.
FROM node:22-alpine
WORKDIR /app
RUN corepack enable pnpm
# Inside the image the lockfile is the trust boundary, so install scripts (esbuild) may run.
RUN pnpm config set dangerouslyAllowAllBuilds true
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY vendor ./vendor
RUN pnpm install --frozen-lockfile --prod
COPY tsconfig.json mcp-server.ts ./
COPY src ./src
USER node
CMD ["node_modules/.bin/tsx", "mcp-server.ts"]
