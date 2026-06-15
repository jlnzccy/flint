/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        raised: 'var(--raised)',
        line: 'var(--line)',
        soft: 'var(--line-soft)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        accent: {
          DEFAULT: 'var(--accent)',
          deep: 'var(--accent-deep)',
          soft: 'var(--accent-soft)',
        },
        gold: { DEFAULT: 'var(--gold)', deep: 'var(--gold-deep)', soft: 'var(--gold-soft)' },
        teal: { DEFAULT: 'var(--teal)', deep: 'var(--teal-deep)', soft: 'var(--teal-soft)' },
        purple: { DEFAULT: 'var(--purple)', deep: 'var(--purple-deep)', soft: 'var(--purple-soft)' },
        green: { DEFAULT: 'var(--green)', deep: 'var(--green-deep)', soft: 'var(--green-soft)' },
      },
      fontFamily: {
        display: ['Nunito_900Black'],
        displayx: ['Nunito_800ExtraBold'],
        body: ['BeVietnamPro_400Regular'],
        bodyi: ['BeVietnamPro_400Regular_Italic'],
        bodym: ['BeVietnamPro_500Medium'],
        bodysb: ['BeVietnamPro_600SemiBold'],
        bodyb: ['BeVietnamPro_700Bold'],
      },
      borderRadius: {
        card: '18px',
        chip: '12px',
      },
    },
  },
  plugins: [],
};
