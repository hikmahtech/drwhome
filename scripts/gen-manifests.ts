// Writes glama.json and server.json to the repo root from the code. Run: pnpm manifests
// A unit test fails when the committed files differ from what this would write.
import { writeFileSync } from "node:fs";
import { glamaManifest, registryManifest } from "../src/mcp/manifests";

writeFileSync("glama.json", `${JSON.stringify(glamaManifest(), null, 2)}\n`);
writeFileSync("server.json", `${JSON.stringify(registryManifest(), null, 2)}\n`);
console.log("wrote glama.json and server.json");
