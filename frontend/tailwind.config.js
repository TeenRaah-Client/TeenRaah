/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Near-black — straight from the client's logo. Used for the hero,
        // nav, footer, and primary text. Not "dark mode", just the brand's
        // own ink, applied deliberately rather than as a full-page default.
        ink: {
          DEFAULT: "#0B0B0C",
          800: "#1C1C1E",
        },
        // Warm ivory — the paper the rest of the site sits on.
        paper: {
          DEFAULT: "#F7F5F0",
          dark: "#EFEBE2",
        },
        // Primary accent: a deep pine/trail green — literal "path" reference
        // for a brand called "Find Your Path", and a deliberate departure
        // from the generic terracotta/vermilion accents.
        trail: {
          50: "#EFF4F0",
          100: "#DAE6DC",
          200: "#B5CDB9",
          300: "#8FB496",
          400: "#6A9B73",
          500: "#2F5233",
          600: "#294730",
          700: "#223B29",
          800: "#1B2F21",
          900: "#14231A",
          DEFAULT: "#2F5233",
        },
        // Secondary accent: warm gold — badges, ratings, countdown timers,
        // sale tags' companion for anything that needs to feel like a find.
        amber: {
          50: "#FDF8EF",
          100: "#FAEDD9",
          200: "#F2D9AC",
          300: "#EAC57F",
          400: "#E3A857",
          500: "#D89434",
          600: "#B87826",
          700: "#935E1F",
          DEFAULT: "#E3A857",
        },
        // Used sparingly — sale/discount tags only, never as a page accent.
        rose: {
          DEFAULT: "#D64545",
          dark: "#B23636",
        },
        stone: {
          DEFAULT: "#8A8578",
          light: "#B5B0A2",
          dark: "#5F5B50",
        },
      },
      fontFamily: {
        display: ["'Bebas Neue'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.2em",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        drawPath: {
          "0%": { strokeDashoffset: 1000 },
          "100%": { strokeDashoffset: 0 },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.55 },
        },
      },
      animation: {
        marquee: "marquee 22s linear infinite",
        drawPath: "drawPath 2.2s ease-out forwards",
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
      },
      boxShadow: {
        card: "0 2px 24px -8px rgba(11,11,12,0.12)",
        lift: "0 12px 32px -12px rgba(11,11,12,0.28)",
      },
    },
  },
  plugins: [],
};
