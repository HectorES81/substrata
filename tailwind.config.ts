import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Substrata brand palette
        obsidian: '#1A1714',
        charcoal: '#2E2B27',
        stone: '#6B6460',
        sand: '#9B9693',
        parchment: '#F5F0EB',
        indigo: {
          DEFAULT: '#4A4580',
          light: '#6B66A3',
          dark: '#2E2A5C',
        },
        terracotta: {
          DEFAULT: '#C4714A',
          light: '#D4896A',
          dark: '#A05530',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
