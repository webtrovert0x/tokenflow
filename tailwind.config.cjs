/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0f172a",       // Deep solid slate
          card: "#1e293b",     // Solid slate card
          hover: "#273549",    // Solid hover state
          border: "#334155",   // Solid matte border
          lightBorder: "#475569",
          primary: "#2563eb",  // Standard solid blue
          primaryHover: "#1d4ed8",
          incoming: "#059669", // Solid emerald
          outgoing: "#dc2626", // Solid red
          accent: "#d97706",   // Solid amber for contracts
          text: "#f8fafc",
          muted: "#94a3b8",
        }
      }
    },
  },
  plugins: [],
}

