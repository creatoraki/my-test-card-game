import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// 全局禁用鼠标右键上下文菜单
document.addEventListener("contextmenu", (e) => e.preventDefault());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
