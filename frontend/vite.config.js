import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Đọc trực tiếp file .env dùng chung tại thư mục gốc (D:\DA-Team\.env)
  envDir: path.resolve(__dirname, ".."),
  envPrefix: ["VITE_", "CONTRACT_"],
  server: {
    port: 5173,
    open: false,
    fs: {
      allow: [".."],
    },
    proxy: {
      "/uploads": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
