import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    // Restore stubbed globals (fetch) after every test so one file cannot leak into the next.
    unstubGlobals: true,
    restoreMocks: true,
  },
});
