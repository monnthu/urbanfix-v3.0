import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec0ff',
          400: '#589dff',
          500: '#3178ff',
          600: '#1a57f5',
          700: '#1443e1',
          800: '#1737b6',
          900: '#19348f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
