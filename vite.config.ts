import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiPort = Number(env.CAMPUSCONNECT_API_PORT || 3002);
  const webPort = Number(env.CAMPUSCONNECT_WEB_PORT || 8080);

  return {
    server: {
      host: "::",
      port: webPort,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${apiPort}`,
        },
        "/uploads": {
          target: `http://127.0.0.1:${apiPort}`,
        },
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
