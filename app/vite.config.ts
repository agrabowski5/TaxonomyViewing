import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Get git commit hash for build number
const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
const buildDate = new Date().toISOString().slice(0, 10)

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'serve' ? '/' : '/TaxonomyViewing/',
  plugins: [react()],
  define: {
    __BUILD_HASH__: JSON.stringify(commitHash),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
}))
