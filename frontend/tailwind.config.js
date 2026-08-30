/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#FBF0DF",
          parchment: "#F5E8D4",
          dark: "#EDE3D3",
          light: "#FFFDF9",
        },
        slate: {
          DEFAULT: "#334D66",
          dark: "#1F3144",
          light: "#4A6987",
          muted: "#6A849F",
          subtle: "#8EA4B8",
        },
        coral: {
          DEFAULT: "#E56960",
          dark: "#C94F46",
          light: "#F08A83",
          soft: "#FDEAE8",
        },
        salmon: {
          DEFAULT: "#FFBDA6",
          light: "#FFE3DA",
          soft: "#FFF3EE",
        },
        sage: {
          DEFAULT: "#636951",
          dark: "#494E3B",
          light: "#828B6D",
          soft: "#EAECE4",
        },
        amber: {
          DEFAULT: "#D89F43",
          dark: "#B67E28",
          light: "#F4CE86",
          soft: "#FDF4E2",
        },
      },
      fontFamily: {
        display: ['"DM Serif Display"', "Georgia", "serif"],
        typewriter: ['"Courier Prime"', "Courier", "monospace"],
        serif: ['"Lora"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        loro: "0 2px 0 rgba(51, 77, 102, 0.08), 0 10px 24px -4px rgba(51, 77, 102, 0.12)",
        "loro-sm": "0 1px 3px rgba(51, 77, 102, 0.08), 0 4px 10px -2px rgba(51, 77, 102, 0.06)",
        "loro-lg": "0 8px 30px -4px rgba(51, 77, 102, 0.18), 0 2px 6px rgba(51, 77, 102, 0.06)",
        "loro-coral": "0 4px 20px -2px rgba(229, 105, 96, 0.35)",
        inset: "inset 0 2px 4px rgba(51, 77, 102, 0.06)",
      },
      borderRadius: {
        loro: "8px",
        "loro-lg": "14px",
      },
    },
  },
  plugins: [],
};
