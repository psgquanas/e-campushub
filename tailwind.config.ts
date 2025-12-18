import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./emails/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        aws: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
