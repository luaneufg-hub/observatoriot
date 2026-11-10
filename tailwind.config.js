// Design system do Observatório — cores, fontes e raios do UI Kit "Página Brasil - Observatório".
// A estrutura das caixas (card, rótulo + ícone de informação, valor, apoio, nota) segue a
// referência FinanceHub, mas toda a identidade visual vem do kit.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      gridTemplateColumns: { 20: 'repeat(20, minmax(0, 1fr))' },
      colors: {
        // paleta fixa do kit
        navy: { DEFAULT: '#070568', 2: '#0A2474' },
        azul: '#2A4FDA',
        umbu: '#E7F79E', // verde umbu (paleta)
        lima: '#C9DF60',
        verde: { DEFAULT: '#60B466', cta: '#36BF76' },
        magenta: '#D81E5B',
        off: { DEFAULT: '#F5F1EB', 2: '#FAF8F7', 3: '#F1F1EF' },
        cinza: { DEFAULT: '#8B8D86', escuro: '#434247' },
        sigla: '#232122',
        // tokens que mudam com o tema (data-theme)
        tema: {
          bg: 'var(--tema-bg)',
          painel: 'var(--tema-painel)',
          card: 'var(--tema-card)',
          linha: 'var(--tema-linha)',
          tinta: 'var(--tema-tinta)',
          suave: 'var(--tema-suave)',
          apagado: 'var(--tema-apagado)',
          destaque: 'var(--tema-destaque)',
          'sobre-destaque': 'var(--tema-sobre-destaque)',
          numero: 'var(--tema-numero)',
        },
      },
      fontFamily: {
        display: ['proxima-nova', 'Proxima Nova', 'Inter', 'system-ui', 'sans-serif'],
        body: ['aktiv-grotesk', 'Aktiv Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        detail: ['Lato', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { card: '24px', controle: '14px' },
      boxShadow: {
        card: '0 1px 2px rgba(7, 5, 104, 0.04)',
        flutuante: '0 12px 32px rgba(7, 5, 104, 0.14)',
      },
      fontSize: {
        rotulo: ['13px', { lineHeight: '18px', fontWeight: '500' }],
        nota: ['12px', { lineHeight: '16px' }],
      },
    },
  },
  plugins: [],
};
