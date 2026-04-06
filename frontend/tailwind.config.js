module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {

      // ── Colours ──────────────────────────────────────────────────────────────
      colors: {
        bg:       '#0d0d0f',
        surface:  '#141417',
        surface2: '#1c1c21',
        surface3: '#242429',
        border:   '#2a2a32',

        accent:   '#7fff6e',   // primary green
        accent2:  '#4fffdf',   // teal
        accent3:  '#ff6e6e',   // red / error

        text: {
          DEFAULT: '#f0f0f2',
          muted:   '#9090a0',
          dim:     '#5a5a6a',
        },
      },

      // ── Typography ────────────────────────────────────────────────────────────
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },

      // ── Border radius ─────────────────────────────────────────────────────────
      borderRadius: {
        card: '12px',
        pill: '100px',
      },

      // ── Box shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.4)',
        glow:  '0 0 20px rgba(127,255,110,0.15)',
        glow2: '0 0 20px rgba(79,255,223,0.15)',
      },

      // ── Spacing extras ────────────────────────────────────────────────────────
      height: {
        nav: '60px',
      },

      // ── Background gradients (use as utilities) ───────────────────────────────
      backgroundImage: {
        'gradient-accent':  'linear-gradient(135deg, #7fff6e, #4fffdf)',
        'gradient-profile': 'linear-gradient(135deg, #1a2a1a, #0d1a2a, #1a1a2a)',
      },
    },
  },
  plugins: [],
}