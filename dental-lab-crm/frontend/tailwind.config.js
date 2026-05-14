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
        // New warm color palette inspired by reference
        surface: {
          DEFAULT: "#f0ede6",
          secondary: "#e8e4dc",
          tertiary: "#ddd8ce",
        },
        // Card accent colors
        card: {
          DEFAULT: "#ffffff",
          yellow: "#e8d44d",
          "yellow-dark": "#d4c23f",
          navy: "#1a2234",
          "navy-light": "#2a3446",
          teal: "#4ecdc4",
          "teal-dark": "#3dbdb4",
          olive: "#8b9a6d",
          "olive-dark": "#7a895c",
        },
        // Brand colors
        brand: {
          primary: "#0088e6",
          secondary: "#00b4d8",
          accent: "#4ecdc4",
        },
        // Neutral palette
        neutral: {
          50: "#fafaf9",
          100: "#f5f5f4",
          200: "#e7e5e4",
          300: "#d6d3d1",
          400: "#a8a29e",
          500: "#78716c",
          600: "#57534e",
          700: "#44403c",
          800: "#292524",
          900: "#1c1917",
        },
        // Status colors
        status: {
          received: "#3b82f6",
          "in-progress": "#f59e0b",
          qc: "#8b5cf6",
          shipped: "#22c55e",
          delivered: "#06b6d4",
        },
        // Priority colors
        priority: {
          normal: "#22c55e",
          urgent: "#f59e0b",
          rush: "#ef4444",
        },
        // Material colors for dental
        material: {
          zr: "#3b82f6",
          emax: "#8b5cf6",
          pmma: "#fbbf24",
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
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem", // Increased
        "4xl": "2rem",   // 32px - Standard for cards
        "5xl": "2.5rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "soft": "0 2px 8px -2px rgba(0, 0, 0, 0.05), 0 4px 16px -4px rgba(0, 0, 0, 0.08)",
        "soft-lg": "0 4px 12px -4px rgba(0, 0, 0, 0.08), 0 8px 24px -8px rgba(0, 0, 0, 0.12)",
        "card": "0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 4px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.1)",
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
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
