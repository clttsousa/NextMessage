import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0b1020',
        foreground: '#e6eaf2',
        card: '#121a2f',
        muted: '#8c95ab',
        primary: '#4f7cff',
        secondary: '#19c4a8',
      }
    }
  },
  plugins: [],
} satisfies Config;
