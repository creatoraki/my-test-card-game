/** 测试页演示类型；当前选择记在地址栏 demo 参数里，刷新后保持。 */
export const DEMO_TABS = [
  { id: "props", label: "交互物演示" },
  { id: "svg", label: "SVG演示" },
] as const;

export type DemoTabId = (typeof DEMO_TABS)[number]["id"];

const PARAM = "demo";

export function readDemoTab(): DemoTabId {
  const value = new URLSearchParams(window.location.search).get(PARAM);
  return DEMO_TABS.find((tab) => tab.id === value)?.id ?? DEMO_TABS[0].id;
}

export function writeDemoTab(id: DemoTabId) {
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, id);
  window.history.replaceState(window.history.state, "", url);
}
