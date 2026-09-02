// ⚠ 公共样式必须排在**所有其它 import 之前**: ES module 的 import 按源码顺序求值,
// `import App` 会连带引入整棵组件树的 CSS —— 写在后面会让公共层(令牌/reset/基础元素)
// 反而排在组件样式之后注入。
import "./styles/index.css";

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { installCodexCollector } from "./store/codexCollector";

// 全局禁用鼠标右键上下文菜单
document.addEventListener("contextmenu", (e) => e.preventDefault());
installCodexCollector();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
