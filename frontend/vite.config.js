import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// The client's production domain/proxy name isn't finalised yet, so the dev
// server proxies /api -> the backend instead of hardcoding any origin.
// Once a real domain exists, only VITE_API_PROXY_TARGET / VITE_API_BASE_URL
// in .env need to change — no code here does.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_PROXY_TARGET || "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          // Maps and charts are only needed on a handful of routes (address
          // picker, admin dashboard/customers) — splitting them out keeps the
          // first paint on the storefront's home/shop pages fast.
          manualChunks: {
            "vendor-maps": ["leaflet", "react-leaflet"],
            "vendor-charts": ["recharts"],
            "vendor-motion": ["framer-motion"],
          },
        },
      },
    },
  };
});
