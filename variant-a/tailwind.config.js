/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Surface palette — cool slate
        surface: {
          DEFAULT: "#f8fafc",
          secondary: "#f1f5f9",
          tertiary: "#e2e8f0",
          elevated: "#ffffff",
        },
        // Core brand — sky primary, slate secondary, teal accent
        brand: {
          DEFAULT: "#0284c7",
          light: "#0ea5e9",
          dark: "#0369a1",
          accent: "#14b8a6",
          "accent-light": "#2dd4bf",
          "accent-dark": "#0d9488",
        },
        // Neutral palette — slate grays
        neutral: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
        },
        // Status colors — softer, more refined
        status: {
          received: "#0284c7",
          "in-progress": "#d97706",
          qc: "#7c3aed",
          shipped: "#16a34a",
          delivered: "#0891b2",
        },
        // Priority colors
        priority: {
          normal: "#16a34a",
          urgent: "#d97706",
          rush: "#dc2626",
        },
        // Material colors for dental
        material: {
          zr: "#3b82f6",
          emax: "#8b5cf6",
          pmma: "#f59e0b",
          res: "#f97316",
          "cr-co": "#6b7280",
          ceram: "#ea580c",
          comp: "#06b6d4",
          alt: "#a855f7",
        },
        // shadcn compatibility
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "2.5rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "soft": "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
        "soft-lg": "0 4px 12px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.10)",
        "card": "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.10)",
        "glass": "0 8px 32px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)",
        "elevated": "0 12px 40px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06)",
        "nav": "0 -4px 24px rgba(0,0,0,0.08)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-12px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-up": "slide-in-up 0.35s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
