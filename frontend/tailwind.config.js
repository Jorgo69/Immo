/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Design system Landlord (Frijo / MallOS) — noms sémantiques uniquement
        'brand-dark': '#0f1419',
        'ui-surface': '#ffffff',
        'ui-background': '#F9FAFB',
        'dashboard-accent': '#059669',
        'primary-emerald': '#059669',
        'primary-emerald-light': '#d1fae5',
        'warning-orange': '#ea580c',
        'warning-orange-light': '#ffedd5',
        'status-open-green': '#16a34a',
        'danger-red': '#dc2626',
        'ui-muted': '#6B7280',
        'ui-border': '#e5e7eb',
        'ui-border-dark': '#374151',
        'ui-border-hover': '#d1d5db',
        // Compatibilité existante
        immo: {
          bg: '#F9FAFB',
          text: '#111827',
          accent: '#059669',
          muted: '#6B7280',
        },
        kyc: {
          pending: '#6B7280',
          verified: '#059669',
          rejected: '#DC2626',
        },
      },
      backgroundColor: {
        'ui-surface-dark': '#1f2937',
        'sidebar-dark': '#0f1419',
        'overlay': 'rgba(0, 0, 0, 0.5)',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'soft-sm': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'ui-soft': '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      maxWidth: {
        layout: '1440px',
        modal: '32rem',
        'modal-lg': '42rem',
        'card-cell': '8rem',
      },
      width: {
        card: '350px',
        'sidebar-expanded': '15rem',
        'sidebar-collapsed': '4rem',
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
        'card-body': '8.75rem',
        'card-title': '3rem',
        'screen-nav': 'calc(100vh - 64px)',
      },
      maxHeight: {
        'screen-90': '90vh',
      },
      height: {
        'screen-nav': 'calc(100vh - 64px)',
      },
      blur: {
        gallery: '40px',
      },
      brightness: {
        gallery: '0.7',
      },
      borderRadius: {
        '2xl': '1rem',
        'card': '1rem',
        'card-lg': '1.25rem',
      },
      backdropBlur: {
        'modal': '4px',
        'gallery': '20px',
      },
      zIndex: {
        'map': '1',
        'navbar': '40',
        'modal': '70',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
}
