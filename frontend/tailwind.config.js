/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Modo oscuro por clase (.dark en <html>), gestionado desde PreferencesContext.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta clínica (teal) de AnemIA. El ramp `brand` coincide con `teal`
        // para que ambos convivan; el 700/800 tira a "petróleo/pino" para los
        // fondos de marca y titulares profundos.
        brand: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4', 300: '#5eead4',
          400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
          800: '#115e59', 900: '#134e4a',
        },
        // Tinta fría para titulares (azul grisáceo muy oscuro, no negro puro).
        ink: '#0b1f24',
      },
      fontFamily: {
        // Display + UI: Plus Jakarta Sans (humanista moderna, con carácter).
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        // Datos clínicos: IBM Plex Mono con cifras tabulares (lectura tipo
        // instrumento de laboratorio: Hb, msnm, probabilidades, métricas).
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        'tightest': '-0.03em',
      },
      boxShadow: {
        // Sombras suaves en capas (frías) para una profundidad limpia y clínica.
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 8px 24px -10px rgb(15 23 42 / 0.10)',
        'card-hover': '0 4px 12px -2px rgb(15 23 42 / 0.10), 0 18px 40px -14px rgb(13 148 136 / 0.28)',
        soft: '0 2px 8px -2px rgb(15 23 42 / 0.08)',
        ring: '0 0 0 3px rgb(20 184 166 / 0.35)',
        // Halo teal para destacar la acción principal.
        glow: '0 1px 2px 0 rgb(13 148 136 / 0.30), 0 10px 30px -8px rgb(13 148 136 / 0.45)',
        // Sombra direccional para paneles laterales (borde de cristal).
        panel: '-10px 0 30px -22px rgb(15 23 42 / 0.25)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Latido sutil para el punto de "Sistema activo".
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.12)' },
        },
        // Recorrido del trazo ECG del logo (se usa como respaldo CSS).
        'ecg-dash': {
          '0%': { strokeDashoffset: '64' },
          '60%, 100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        float: 'float 4s ease-in-out infinite',
        'scale-in': 'scale-in 0.3s ease-out both',
        breathe: 'breathe 2.4s ease-in-out infinite',
        'ecg-dash': 'ecg-dash 1.8s ease-out both',
      },
    },
  },
  plugins: [],
}
