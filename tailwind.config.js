/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* ─────────────────────────────────────────────────────────────
           SISTEMA DE TOKENS · Tema claro "comida casera" (light theme)
           primary    → terracota cálido (marca / CTAs)
           accent     → ámbar / miel (realces)
           background → blanco roto y cremas claras (fondos)
           text       → gris cálido oscuro, nunca negro puro (texto)
           Contrastes verificados WCAG AA (≥ 4.5:1 texto normal).
           ───────────────────────────────────────────────────────────── */
        primary: {
          DEFAULT: '#AE4C29',
          50:  '#FBF1EC',
          100: '#F6DDD0',
          200: '#EBB79F',
          300: '#DD8E6B',
          400: '#CB6B43',
          500: '#AE4C29',   // terracota (AA como texto sobre cremas claros)
          600: '#9E4023',   // texto/CTA AA sobre fondo claro
          700: '#83341E',
          800: '#5E2618',
          900: '#3C1810',
        },
        accent: {
          DEFAULT: '#C2792F',
          50:  '#FBF1DF',
          100: '#F6E0B9',
          200: '#EDC57E',
          300: '#E0A547',
          400: '#D08C2E',
          500: '#C2792F',   // ámbar de fondo (con texto oscuro)
          600: '#A8472A',   // ámbar/terracota tostado para TEXTO AA sobre claro
          700: '#8A3C22',
        },
        background: {
          DEFAULT: '#FBF6EE',  // fondo de página (blanco roto cálido)
          base:    '#FBF6EE',
          surface: '#FFFCF7',  // tarjetas / superficies elevadas
          soft:    '#F7EFE2',  // secciones alternas (crema)
          warm:    '#EFE3D0',  // panel cálido más profundo
        },
        text: {
          DEFAULT: '#2A1C12',  // tinta principal (titulares)
          strong:  '#241810',
          base:    '#2A1C12',
          muted:   '#6B5D4E',  // cuerpo legible (AA sobre claro)
          soft:    '#8A7C6C',  // metadatos sutiles
          inverse: '#FFFCF7',  // texto sobre superficies oscuras puntuales
        },

        /* ── Alias heredados, remapeados a la paleta clara para no
           romper las clases existentes en los componentes ── */
        espresso:    '#2A1C12',  // tinta oscura (texto / dark-on-accent)
        bark:        '#4A3727',  // marrón secundario (bordes / tinta suave)
        ember:       '#9E4023',  // ≈ primary-600
        terracotta:  '#AE4C29',  // ≈ primary-500
        amber:       '#C2792F',  // ámbar (fondo con texto oscuro / realce grande)
        gold:        '#D99A3C',  // miel (decorativo / hover)
        wheat:       '#EAD9BE',  // crema cálida (panel)
        cream:       '#F7EFE2',  // crema clara (sección)
        ivory:       '#FFFCF7',  // superficie casi blanca
        'warm-gray': '#6B5D4E',  // gris cálido legible (AA)
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        accent:  ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs':  ['0.625rem', { lineHeight: '1rem' }],
        '7xl':  ['4.5rem',   { lineHeight: '1' }],
        '8xl':  ['6rem',     { lineHeight: '1' }],
        '9xl':  ['8rem',     { lineHeight: '1' }],
        '10xl': ['10rem',    { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '100': '25rem',
        '120': '30rem',
        '140': '35rem',
      },
      maxWidth: {
        '8xl':  '88rem',
        '9xl':  '96rem',
        '10xl': '120rem',
      },
      aspectRatio: {
        'portrait':  '3 / 4',
        'cinematic': '21 / 9',
        'photo':     '4 / 3',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E\")",
        'amber-glow': 'radial-gradient(ellipse at 50% 0%, rgba(200,135,58,0.3) 0%, transparent 70%)',
        'dark-vignette': 'radial-gradient(ellipse at center, transparent 40%, rgba(10,6,4,0.8) 100%)',
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
        'fade-up':    'fadeUp 0.8s ease forwards',
        'smoke':      'smoke 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        smoke: {
          '0%':   { opacity: '0', transform: 'translateY(0) scale(1)' },
          '40%':  { opacity: '0.6' },
          '100%': { opacity: '0', transform: 'translateY(-80px) scale(2.5)' },
        },
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '1200': '1200ms',
      },
      screens: {
        'xs': '375px',
        '3xl': '1920px',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
