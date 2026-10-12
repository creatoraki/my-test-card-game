// 预加载记忆: 记下「已成功加载过」的素材 URL, 下次开屏只预加载新增 / 改动过的素材。
//
// 成立前提: 素材 URL 带内容哈希(dev 见 scripts/vite-plugin-dev-asset-cache.mjs, build 由 Vite 产出),
// 且响应头是永久缓存 —— 同一个 URL 加载成功过一次, 之后就一直躺在浏览器缓存里。
// 素材改了 → 哈希变 → URL 不在记忆里 → 重新预加载; 素材删了 → 保存时从记忆里剔除。
// 万一浏览器按容量淘汰了某张缓存, 代价只是首次显示那张图时现下载, 不影响正确性。
// localStorage 读写失败(隐私模式等)就当没有记忆, 退回全量预加载。

const STORAGE_KEY = "asset-preload-done";

export function loadPreloadedSources(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((src): src is string => typeof src === "string") : []);
  } catch {
    return new Set();
  }
}

/** 只保留当前素材清单里仍存在的 URL, 已删除素材的旧记录随之清掉。 */
export function savePreloadedSources(done: ReadonlySet<string>, current: readonly string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter((src) => done.has(src))));
  } catch {
    // 存不下只是下次开屏再全量预加载一遍。
  }
}
