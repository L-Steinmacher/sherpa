import type { Config } from 'tailwindcss'
import tailwindcssRadix from 'tailwindcss-radix'

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./app/**/*.{ts,tsx,jsx,js}'],
	darkMode: 'class',
	theme: {
		xtend: {}
	},
	plugins: [ tailwindcssRadix ],
} satisfies Config
