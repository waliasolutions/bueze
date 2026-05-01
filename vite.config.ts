import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { realpathSync } from "node:fs";
import { componentTagger } from "lovable-tagger";

const reactPath = realpathSync(path.resolve(__dirname, "./node_modules/react"));
const reactDomPath = realpathSync(path.resolve(__dirname, "./node_modules/react-dom"));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": reactPath,
      "react-dom": reactDomPath,
    },
  },
  optimizeDeps: {
    force: true,
    include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
  },
  esbuild: mode === 'production' ? {
    drop: ['console', 'debugger'],
  } : undefined,
}));
