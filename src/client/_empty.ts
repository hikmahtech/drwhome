// Stand-in for node:tls and whoiser in browser bundles. The checks that need them run on the
// server, and esbuild drops them from a browser bundle; this only satisfies the import.
export const connect = undefined;
export default {};
