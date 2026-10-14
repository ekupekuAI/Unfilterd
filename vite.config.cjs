const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

module.exports = defineConfig({
  plugins: [react()],
  // three is only imported lazily by the opening scene; pre-bundle it so the
  // dev server doesn't discover it mid-intro and reload the page.
  optimizeDeps: { include: ['three'] },
});
