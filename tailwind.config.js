/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-roboto)', 'Roboto', 'system-ui', 'sans-serif'],
        heading: ['var(--font-montserrat)', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* Luxury Tech - Separación Marketing/Producto */
        luxury: '#000000',       /* Negro Puro */
        forest: '#173814',      /* Verde Bosque Profundo */
        sage: '#4f9d74',        /* Verde Salvia Tecnológico */
      },
    },
  },
  plugins: [],
};
