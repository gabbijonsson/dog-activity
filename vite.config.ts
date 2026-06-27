import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// Empty shell VITE_* vars (e.g. from IDE) shadow .env — drop them before loadEnv.
for (const key of Object.keys(process.env)) {
	if (key.startsWith('VITE_') && !process.env[key]) {
		delete process.env[key]
	}
}

export default defineConfig(({ mode }) => {
	const viteEnv = loadEnv(mode, process.cwd(), 'VITE_')

	return {
		resolve: { tsconfigPaths: true },
		plugins: [devtools(), tailwindcss(), tanstackStart(), nitro(), viteReact()],
		define: Object.fromEntries(
			Object.entries(viteEnv).map(([key, value]) => [
				`import.meta.env.${key}`,
				JSON.stringify(value),
			]),
		),
	}
})
