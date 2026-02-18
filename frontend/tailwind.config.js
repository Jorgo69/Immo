/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        immo: {
          bg: '#F9FAFB',
          text: '#111827',
          accent: '#059669',
          muted: '#6B7280',
        },
      },
      maxWidth: {
        layout: '1440px',
      },
      width: {
        card: '350px',
      },
      fontSize: {
        xs: ['0.9rem', { lineHeight: '1.25rem' }],
        sm: ['1rem', { lineHeight: '1.5rem' }],
        base: ['1.125rem', { lineHeight: '1.75rem' }],
        lg: ['1.25rem', { lineHeight: '1.75rem' }],
        xl: ['1.5rem', { lineHeight: '2rem' }],
        hero: ['4.5rem', { lineHeight: '1', fontWeight: '900', letterSpacing: '-0.02em' }],
        'section-title': ['3rem', { lineHeight: '1.1', fontWeight: '800' }],
      },
      spacing: {
        section: '8rem',
        block: '4rem',
        card: '2.5rem',
      },
      minHeight: {
        'card-body': '8.75rem', // ~140px
        'card-title': '3rem',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
}
