import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tsconfigPaths from "vite-tsconfig-paths"

export default defineConfig({
  base: "/muti-chat/",
  plugins: [
    react({
      babel: {
        plugins: [
          ["@babel/plugin-proposal-decorators", { version: "2023-05" }]
        ]
      }
    }), 
    tsconfigPaths()
  ],
})
