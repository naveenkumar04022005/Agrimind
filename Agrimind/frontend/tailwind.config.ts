import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "80rem",
      },
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        border: "var(--border)",
        muted: "var(--muted)",
        primary: {
          50: "#f2f7f4",
          100: "#e2ece5",
          200: "#c5dacf",
          300: "#9ebfae",
          400: "#6f9f87",
          500: "#437f62",
          600: "var(--primary)",
          700: "#1f523a",
          800: "#18422e",
          900: "#133525",
          950: "#091c13",
        },
        neutral: {
          50: "var(--background)",
          100: "var(--surface-muted)",
          200: "var(--border)",
          300: "#d3d8d0",
          400: "#9ea59c",
          500: "var(--muted)",
          600: "#50584f",
          700: "#383e37",
          800: "#242823",
          900: "var(--foreground)",
        },
        success: {
          light: "var(--success-light)",
          border: "var(--success-border)",
          text: "var(--success-text)",
        },
        warning: {
          light: "var(--warning-light)",
          border: "var(--warning-border)",
          text: "var(--warning-text)",
        },
        error: {
          light: "var(--error-light)",
          border: "var(--error-border)",
          text: "var(--error-text)",
        },
        info: {
          light: "var(--info-light)",
          border: "var(--info-border)",
          text: "var(--info-text)",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "Manrope",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        control: "var(--radius-control)",
        card: "var(--radius-card)",
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        card: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
};

export default config;
