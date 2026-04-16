import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./content/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        border: "var(--border)",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: { content: "680px" },
      fontSize: {
        xs: ["12px", { lineHeight: "1.6" }],
        sm: ["14px", { lineHeight: "1.6" }],
        base: ["16px", { lineHeight: "1.6" }],
        lg: ["20px", { lineHeight: "1.4" }],
        xl: ["28px", { lineHeight: "1.2" }],
        "2xl": ["40px", { lineHeight: "1.2" }],
      },
    },
  },
} satisfies Config;
