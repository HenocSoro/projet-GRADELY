/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Couleur marque (alignée sur le logo Gradely) — modifier ici pour matcher le logo
        brand: {
          50: "#f0fdfa",
          "50-muted": "rgba(240, 253, 250, 0.3)", /* pour dégradés (ex. to-brand-50-muted) */
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
        },
        // Palette académique : sable / graphite / vert sauge
        sand: {
          50: "#FAF9F6",
          100: "#F5F1E8",
          200: "#EDE8DD",
          300: "#E2DCCE",
        },
        graphite: {
          600: "#5C5C5C",
          700: "#3D3D3D",
          800: "#2C2C2C",
          900: "#1A1A1A",
        },
        sage: {
          400: "#9CAF88",
          500: "#87A96B",
          600: "#6B8E4E",
          700: "#556B3D",
        },
      },
      boxShadow: {
        card: "0 2px 12px rgba(44, 44, 44, 0.08)",
        cardHover: "0 4px 20px rgba(44, 44, 44, 0.12)",
      },
    },
  },
  plugins: [],
};
