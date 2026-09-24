/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F5E6CC",
          parchment: "#EBD8BA",
          dark: "#E3CFB1",
          light: "#FFF8EC",
        },
        slate: {
          DEFAULT: "#201B17",
          dark: "#100E0C",
          light: "#5E4A3D",
          muted: "#836B5A",
          subtle: "#9C806D",
        },
        coral: {
          DEFAULT: "#F2382F",
          dark: "#CF2A23",
          light: "#F08A83",
          soft: "#FDEAE8",
        },
        salmon: {
          DEFAULT: "#F3C694",
          light: "#FFE3DA",
          soft: "#FFF0E4",
        },
        sage: {
          DEFAULT: "#6D5545",
          dark: "#513E32",
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
        display: ['"Bodoni Moda"', '"Times New Roman"', "serif"],
        typewriter: ['"IBM Plex Mono"', "Courier", "monospace"],
        serif: ['"Bodoni Moda"', '"Times New Roman"', "serif"],
        sans: ['"DM Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        loro: "5px 5px 0 rgba(32, 27, 23, 0.1)",
        "loro-sm": "3px 3px 0 rgba(32, 27, 23, 0.08)",
        "loro-lg": "9px 9px 0 rgba(242, 56, 47, 0.14)",
        "loro-coral": "4px 4px 0 rgba(32, 27, 23, 0.18)",
        inset: "inset 0 0 0 1px rgba(32, 27, 23, 0.08)",
      },
      borderRadius: {
        loro: "2px",
        "loro-lg": "3px",
      },
    },
  },
  plugins: [],
};
