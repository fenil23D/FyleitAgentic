import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#f81990",
          navy: "#07182c",
          ink: "#11233a",
          surface: "#f8f8fb"
        }
      },
      fontFamily: {
        heading: ["Sora", "Segoe UI", "sans-serif"],
        body: ["Manrope", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        brand: "0 20px 35px -20px rgba(7, 24, 44, 0.55)"
      }
    }
  },
  plugins: []
} satisfies Config;

