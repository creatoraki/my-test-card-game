# SciFiPanel

参考 `src/assets/test/panel素材.png` 的科幻面板容器。固定矢量角块、弹性边条和独立内容层；纯 React + SVG + CSS，无新增依赖。

```tsx
import { SciFiPanel } from "@/ui/common/SciFiPanel";

<SciFiPanel
  width={960}
  height={640}
  background="linear-gradient(135deg, #04233b, #020d19)"
  colors={{ energy: "#16cefa", accent: "#c07aff", armor: "#061e40" }}
  padding={20}
  aria-label="任务面板"
>
  <h2>任务列表</h2>
  <YourContent />
</SciFiPanel>
```

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `width` | `100%` | 数字为设计 px，也支持 `%`、`calc()` 等 CSS 尺寸 |
| `height` | 自动 | 不传时由内容撑开；固定高度时默认在内容层滚动 |
| `colors` | 素材的青蓝 / 紫色配色 | 部分覆盖 `armor` 金属、`trim` 描边、`energy` 灯带、`accent` 嵌件、`highlight` 高光、`circuit` 纹理 |
| `background` | 深蓝径向渐变 | CSS background；支持纯色、渐变、图片、`transparent` |
| `texture` | `true` | 内容背景上的网格与电路；完全透明的内容区需同时设为 `false` |
| `padding` | `16` | 内容内边距，额外保留外围 42px 边框安全区 |
| `overflow` | `auto` | 内容溢出行为；`visible` 可让局部浮层溢出，`hidden` 裁切 |
| `contentClassName` / `contentStyle` | — | 设置内部内容布局，例如 `display: grid` / `flex` |
| `className` / `style` / `ref` | — | 外层 div；支持原生事件、ARIA 等属性。style 优先于尺寸和配色 props |

保留角部比例的最小尺寸为 **260 × 200 设计 px**。小于此值会受 `min-width` / `min-height` 限制。百分比高度需要父容器具有明确高度。

## zoom 与布局

```tsx
<div style={{ width: 1920, height: 1080, zoom: 0.75 }}>
  <SciFiPanel width="100%" height="100%">
    内容、边框、滚动条和输入控件一起缩放
  </SciFiPanel>
</div>
```

组件不读取 `getBoundingClientRect()`，没有 ResizeObserver、屏幕坐标换算或二次缩放。边框安全区和内容使用同一套设计尺寸；边条接缝重叠 0.5px，以减轻非整数缩放下的透明细缝。也可直接用于项目现有 stageCanvas。

在整页缩放画布内，调用方优先使用设计 px / 百分比，避免用 `vw` / `vh` 再计算画布内的宽高。组件内部的定位元素跟随所属内容区；挂到 `document.body` 的 portal 仍需调用方使用项目已有的浮层坐标处理。

## 渲染成本与视觉取舍

边框为 10 个小型静态 SVG，纹理为两个简单 SVG 和 CSS 网格。无 Canvas / WebGL、动画循环、滤镜、backdrop-filter 或布局监听。边框和电路通过 memo 避免随业务内容重复渲染，颜色使用 CSS 变量继承。原图仅在演示页作参考，组件本身不加载原图。

保留切角、金属分层、青色灯带、紫色嵌件和电路结构；简化原图的光晕、细小噪点和局部不对称细节。长边中段随容器拉伸，角块保持固定比例。大量实例时可设 `texture={false}` 进一步减少绘制；长列表仍建议在业务层虚拟化。

## 演示与验证

开发服务访问 `/?page=test` → **luna**。演示提供材质选择、三种预设、尺寸 / 祖先 zoom 滑块、背景透明、纹理开关、表单交互和额外 24 个面板的预览。

已在本机 Chrome headless 验证 48 组几何组合：祖先 zoom 为 0.5 / 0.67 / 0.8 / 1 / 1.25 / 1.5，分别叠加 body zoom 1 / 0.8，尺寸覆盖 260×200、420×800、1000×640、1500×300。验证内容安全区、自动高度、百分比宽度，以及 zoom 0.8 下真实鼠标点击和输入。此检查不代表各设备的帧率基准或其他浏览器的实测结果。
