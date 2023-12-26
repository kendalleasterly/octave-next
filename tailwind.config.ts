import type { Config } from 'tailwindcss'
const colors = require("tailwindcss/colors")

const config: Config = {
  darkMode: "class",
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.neutral,
      indigo: colors.indigo,
      red: colors.rose,
      yellow: colors.amber,
      tertiarybg: "#292929",
      secondarybg: "#1E1E1E",
      primarybg:"121213",
      borderColor: "#27272A",
      accent100: "#EB634D",
      accent80: "#EF8271",
      accent75: "#F08A79",
      accent20: "#FBE0DB",
    }
  },
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [],
}
export default config