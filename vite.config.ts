import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import minimist from "minimist";

const args = minimist(process.argv.slice(2));

// 分组规则配置
const CHUNK_GROUPS = {
  // 第三方依赖分组规则
  vendor: {
    test: (id: string) => id.includes('node_modules'),
    groups: {
      // React 全家桶，包括相关依赖
      main: [/react/, /scheduler/, /@babel\/runtime/, /object-assign/, /prop-types/],
      // UI 库相关
      ui: [/@radix-ui/, /class-variance-authority/, /clsx/, /tailwind-merge/, /lucide/],
    }
  }
};

// 判断路径是否匹配规则
const isMatch = (id: string, patterns: RegExp[]) => {
  return patterns.some(pattern => pattern.test(id));
};

export default defineConfig({
  base: args["baseUri"] || "/",
  server: {
    allowedHosts: ['*.clackypaas.com', '5173-1a85f4981fa8-web.clackypaas.com']
  },
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
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 处理第三方依赖
          if (CHUNK_GROUPS.vendor.test(id)) {
            // 遍历 vendor 分组规则
            for (const [name, patterns] of Object.entries(CHUNK_GROUPS.vendor.groups)) {
              if (isMatch(id, patterns)) {
                return `vendor-${name}`;
              }
            }
            // 其他第三方依赖
            return 'vendor-others';
          }

          // 源码部分不做太细的拆分，避免循环依赖
          if (id.includes('/src/')) {
            // 只区分异步加载的组件
            if (id.includes('/components/settings/') || 
                id.includes('/components/agent/') ||
                id.includes('/components/discussion/setup/')) {
              return 'async-components';
            }
            // 其他源码保持在一起
            return 'app';
          }
        }
      }
    }
  },
});
