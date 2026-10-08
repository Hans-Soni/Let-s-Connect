import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        border: "border 4s linear infinite",
      },
      keyframes: {
        border: {
          to: { "--border-angle": "360deg" },
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#E07A5F", // Vibrant terracotta orange
          secondary: "#F4A261", // Warm peach
          accent: "#E25822",
          neutral: "#3D4451", // Neutral background for UI elements
          "base-100": "#FFFFFF", // Innermost cards
          "base-200": "#F3F4F6", // Card / Container Backgrounds (Subtle pale gray-white)
          "base-300": "#FDFBF7", // Background: Clean off-white / light cream
          "base-content": "#1F2937", // Deep charcoal / near black for high contrast
          info: "#3b82f6",
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
        },
      },
      {
        dark: {
          primary: "#E07A5F", // Terracotta orange
          secondary: "#F4A261", // Warm peach
          accent: "#E25822",
          neutral: "#27272A", // Zinc 800
          "base-100": "#3F3F46", // Innermost cards (Zinc 700)
          "base-200": "#222222", // Card / Container Backgrounds (Muted dark gray)
          "base-300": "#121212", // Background: Deep dark charcoal / near black
          "base-content": "#FAFAFA", // Text: Soft off-white / cream
          info: "#3b82f6",
          success: "#22c55e",
          warning: "#eab308",
          error: "#ef4444",
        },
      },
    ],
  },
};
