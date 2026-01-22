import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bags.fm True Black Color Palette
        "bags-bg-primary": "#000000",
        "bags-bg-secondary": "#07090c",
        "bags-bg-card": "#0c0f14",
        "bags-bg-panel": "#0e1117",
        "bags-border": "#141922",
        "bags-text-primary": "#ffffff",
        "bags-text-secondary": "#9aa0a6",
        "bags-text-muted": "#6b7280",
        "bags-green": "#00ff7f",
        "bags-green-alt": "#00e676",
        "bags-accent-red": "#ef4444",
      },
    },
  },
  plugins: [],
};

export default config;
