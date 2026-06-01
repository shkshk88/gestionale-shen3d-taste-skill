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
        // Surface palette — warm stone/sand
        surface: {
          DEFAULT: "#faf9f7",
          secondary: "#f5f3ef",
          tertiary: "#ede9e3",
          elevated: "#ffffff",
        },
        // Core brand — warm muted taupe primary, soft sage accent
        brand: {
          DEFAULT: "#8b7e74",
          light: "#a09388",
          dark: "#6b5f56",
          accent: "#7d9a7e",
          "accent-light": "#95b096",
          "accent-dark": "#5f7a60",
        },
        // Neutral palette — warm stone grays
        neutral: {
          50: "#faf9f7",
          100: "#f5f3ef",
          200: "#e8e4de",
          300: "#d6d0c7",
          400: "#a8a095",
          500: "#8a8278",
          600: "#6b645c",
          700: "#4f4a44",
          800: "#36322e",
          900: "#1c1917",
        },
        // Status colors — muted, desaturated, premium
        status: {
          received: "#8b7e74",
          "in-progress": "#b8925e",
          qc: "#8b7ea0",
          shipped: "#7d9a7e",
          delivered: "#6b8fa0",
        },
        // Priority colors — muted
        priority: {
          normal: "#7d9a7e",
          urgent: "#b8925e",
          rush: "#b06b6b",
        },
        // Material colors for dental — desaturated
        material: {
          zr: "#7a8fa8",
          emax: "#8b7ea0",
          pmma: "#b8a05e",
          res: "#b8926b",
          "cr-co": "#8a8278",
          ceram: "#b07d6b",
          comp: "#6b8fa0",
          alt: "#8b7ea0",
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
        "soft": "0 1px 2px rgba(28,25,23,0.04), 0 4px 16px rgba(28,25,23,0.06)",
        "soft-lg": "0 4px 12px rgba(28,25,23,0.05), 0 8px 24px rgba(28,25,23,0.08)",
        "card": "0 1px 2px rgba(28,25,23,0.04), 0 4px 16px rgba(28,25,23,0.06)",
        "card-hover": "0 4px 8px rgba(28,25,23,0.05), 0 8px 24px rgba(28,25,23,0.09)",
        "glass": "0 8px 32px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
        "elevated": "0 12px 40px rgba(28,25,23,0.08), 0 4px 8px rgba(28,25,23,0.05)",
        "nav": "0 -4px 24px rgba(28,25,23,0.06)",
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
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Inter", "system-ui", "-apple-system", "sans-serif"],
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
