import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  base: "/muti-chat/",
  plugins: [
    react({
      babel: {
        plugins: [
          // ["@babel/plugin-proposal-decorators", { legacy: true }],
          // ["@babel/plugin-proposal-class-properties", { loose: true }],
        ],
      },
    }),
    tsconfigPaths(),
  ]
});
