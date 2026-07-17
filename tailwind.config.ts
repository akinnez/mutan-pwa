import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f9f4', 100: '#dcf0e4', 500: '#329162',
          700: '#1a5c3f', 900: '#0F5132', 950: '#082d1d',
        },
        gold: { 400: '#D4AF37', 500: '#c5a028', 600: '#a8821e' },
      },
    },
  },
  plugins: [],
}
export default config
