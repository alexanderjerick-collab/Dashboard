import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        purple: {
          950: "#0f0520",
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%,100%": { boxShadow: "0 0 8px rgba(168,85,247,0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(168,85,247,0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
