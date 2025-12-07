import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0a1f',
        'card-bg': 'rgba(15, 15, 40, 0.6)',
        'neon-cyan': '#00ffff',
        'neon-purple': '#9d00ff',
        'neon-pink': '#ff0080',
        'electric-blue': '#0066ff',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
export default config
