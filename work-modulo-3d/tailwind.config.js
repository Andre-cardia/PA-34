/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ---- PA-34 design tokens (design.md §2) ----
        abyss: "rgb(var(--c-abyss) / <alpha-value>)",
        panel: "rgb(var(--c-panel) / <alpha-value>)",
        raised: "rgb(var(--c-raised) / <alpha-value>)",
        overlay: "rgb(var(--c-overlay) / <alpha-value>)",
        hairline: "rgb(var(--c-hairline) / <alpha-value>)",
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: {
          DEFAULT: "rgb(var(--c-muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground))",
        },
        faint: "rgb(var(--c-faint) / <alpha-value>)",
        cyan: "rgb(var(--c-cyan) / <alpha-value>)",
        "cyan-dim": "rgb(var(--c-cyan-dim) / <alpha-value>)",
        green: "rgb(var(--c-green) / <alpha-value>)",
        amber: "rgb(var(--c-amber) / <alpha-value>)",
        red: "rgb(var(--c-red) / <alpha-value>)",
        blue: "rgb(var(--c-blue) / <alpha-value>)",
        paper: "rgb(var(--c-paper) / <alpha-value>)",
        // ---- shadcn tokens (kept for components/ui) ----
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
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
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
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      maxWidth: {
        content: "1280px",
        module: "1600px",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
        mechanical: "cubic-bezier(0.7, 0, 0.2, 1)",
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
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        // Annunciator: blink 2x then solid (design.md §5.5)
        "annunciator-blink": {
          "0%, 100%": { opacity: "1" },
          "10%, 30%": { opacity: "0.15" },
          "20%, 40%": { opacity: "1" },
        },
        "hotspot-pulse": {
          "0%": { transform: "scale(1)", opacity: "0.9" },
          "80%, 100%": { transform: "scale(1.4)", opacity: "0" },
        },
        "scroll-line": {
          "0%": { transform: "scaleY(0)", transformOrigin: "top" },
          "45%": { transform: "scaleY(1)", transformOrigin: "top" },
          "55%": { transform: "scaleY(1)", transformOrigin: "bottom" },
          "100%": { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "annunciator-blink": "annunciator-blink 0.9s steps(1, end) 2",
        "hotspot-pulse": "hotspot-pulse 1.6s ease-out infinite",
        "scroll-line": "scroll-line 2s cubic-bezier(0.7, 0, 0.2, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
