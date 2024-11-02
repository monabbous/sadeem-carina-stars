/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        // the default font-family is 'Kawkab Mono' as "Space Mono", monospace;
        sans: ['Almarai', '"Montserrat"', 'monospace'],
      },
      colors: {
        primary: {
          '50': '#f9f7fc',
          '100': '#f2eef9',
          '200': '#e4dcf2',
          '300': '#d1c1e6',
          '400': '#b69bd7',
          '500': '#9773c2',
          '600': '#7853a2',
          '700': '#654388',
          '800': '#54396f',
          '900': '#48325d',
          '950': '#2a183a',
      }
      }
    },
  },
  plugins: [
  ],
}

