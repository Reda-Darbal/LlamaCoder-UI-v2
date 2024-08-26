import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        custom:
          "0px 1px 2px 0px rgba(16, 24, 40, 0.05), 0px 0px 0px 4px #D4DBE5",
      },
      colors: {
        brand: "#E1E7EC",
        gray: colors.slate,
      },

      fontFamily: {
        sans: ['"Aeonik"', ...defaultTheme.fontFamily.sans],
      },
    },
  },
};

export default config;
