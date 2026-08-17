import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import imageOptimize from "./scripts/vite-plugin-image-optimize.mjs";

// https://vitejs.dev/config/
export default defineConfig({
  // imageOptimize 在 dev 与 build 下行为一致(见插件头部注释), 所以开发时看到的画质
  // 就是线上画质。OPTIMIZE=0 pnpm dev 可退回原始 PNG 做原画对比。
  plugins: [react(), imageOptimize({ quality: 94 })],
  server: {
    port: 2333,
    allowedHosts: [".trycloudflare.com"],
  },
  css: {
    modules: {
      // 组件样式一律 *.module.css, 类名在编译期被哈希 ⇒ 天然隔离, 不再靠命名前缀人肉避让。
      // ★ 刻意保留 [name] 与 [local]: devtools 里仍能一眼看出「哪个组件的哪个类」,
      //   排查演出/特异性问题的体验不因模块化而退化。
      generateScopedName: "[name]__[local]___[hash:base64:5]",
      // ⚠ 刻意**不开** localsConvention: camelCase —— 项目里大量动态类名
      //   (k-${kind} / intent-${kind} / pip-${kind} / r-${rarity} / screen-fx-${fx} / shake-lv${n}),
      //   保持 kebab 原名 + s["..."] 方括号访问才能拼得出来。
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
