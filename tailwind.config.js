/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: '0.5rem',
        md: 'calc(0.5rem - 2px)',
        sm: 'calc(0.5rem - 4px)',
      },
      colors: {
        background: 'hsl(0 0% 100%)',
        foreground: 'hsl(0 0% 10%)',
        card: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(0 0% 10%)',
        },
        popover: {
          DEFAULT: 'hsl(0 0% 100%)',
          foreground: 'hsl(0 0% 10%)',
        },
        primary: {
          DEFAULT: 'hsl(0 0% 10%)',
          foreground: 'hsl(0 0% 100%)',
        },
        secondary: {
          DEFAULT: 'hsl(0 0% 95%)',
          foreground: 'hsl(0 0% 10%)',
        },
        muted: {
          DEFAULT: 'hsl(0 0% 95%)',
          foreground: 'hsl(0 0% 40%)',
        },
        accent: {
          DEFAULT: 'hsl(0 0% 95%)',
          foreground: 'hsl(0 0% 10%)',
        },
        destructive: {
          DEFAULT: 'hsl(0 100% 45%)',
          foreground: 'hsl(0 0% 100%)',
        },
        border: 'hsl(0 0% 85%)',
        input: 'hsl(0 0% 85%)',
        ring: 'hsl(0 0% 20%)',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
