/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
  	extend: {
  		colors: {
  			'secondary-fixed': '#d8e2ff',
  			'on-secondary-fixed': '#001a41',
  			'on-secondary': '#ffffff',
  			'surface-dim': '#cbdbf5',
  			'tertiary-fixed': '#dae2fd',
  			'primary-fixed-dim': '#30e375',
  			'inverse-on-surface': '#eaf1ff',
  			'error-container': '#ffdad6',
  			'on-tertiary-container': '#3f475c',
  			'on-tertiary': '#ffffff',
  			secondary: '#0059bb',
  			'secondary-foreground': '#ffffff',
  			'on-secondary-fixed-variant': '#004493',
  			'surface-container-low': '#eff4ff',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			'on-primary-fixed': '#00210b',
  			'on-tertiary-fixed': '#131b2e',
  			'secondary-container': '#0070ea',
  			'on-surface': '#0b1c30',
  			'on-secondary-container': '#fefcff',
  			'surface-container-highest': '#d3e4fe',
  			'surface-tint': '#006d32',
  			'inverse-surface': '#213145',
  			'primary-fixed': '#64ff92',
  			'tertiary-container': '#aeb5cf',
  			error: '#ba1a1a',
  			'on-tertiary-fixed-variant': '#3f465c',
  			'on-error-container': '#93000a',
  			'secondary-fixed-dim': '#adc7ff',
  			'surface-container': '#e5eeff',
  			'surface-variant': '#d3e4fe',
  			'on-primary-container': '#005324',
  			'on-error': '#ffffff',
  			'tertiary-fixed-dim': '#bec6e0',
  			'on-primary-fixed-variant': '#005224',
  			'surface-container-lowest': '#ffffff',
  			'surface-bright': '#f8f9ff',
  			'primary-container': '#00d166',
  			background: 'hsl(var(--background))',
  			'on-primary': '#ffffff',
  			tertiary: '#565e74',
  			'inverse-primary': '#30e375',
  			'outline-variant': '#bbcbb9',
  			'on-background': '#0b1c30',
  			outline: '#6c7b6c',
  			surface: '#f8f9ff',
  			'on-surface-variant': '#3c4a3d',
  			'surface-container-high': '#dce9ff',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: 'hsl(var(--destructive))',
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			DEFAULT: '0.25rem',
  			lg: 'var(--radius)',
  			xl: '0.75rem',
  			full: '9999px',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			headline: [
  				'Space Grotesk',
  				'sans-serif'
  			],
  			display: [
  				'Space Grotesk',
  				'sans-serif'
  			],
  			body: [
  				'Inter',
  				'sans-serif'
  			],
  			label: [
  				'Inter',
  				'sans-serif'
  			]
  		}
  	}
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries'), require("tailwindcss-animate")],
}
