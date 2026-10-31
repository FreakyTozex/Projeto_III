import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// O proxy evita CORS em desenvolvimento e mantém o mesmo código em produção.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:8000",
      "/ws": { target: "ws://localhost:8000", ws: true },
    },
  },
});
