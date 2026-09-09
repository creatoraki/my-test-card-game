# 主题切换动画记录

> 记录日期：2026-09-09

## 结论

当前项目没有独立的全屏主题切换动画，但存在一些页面级 CSS 过渡声明。主题切换主要表现为：

- `next-themes` 切换 `<html>` 上的 `.dark` class。
- 浅色和深色主题通过 CSS 变量切换。
- 主站浮动菜单中的主题选中背景使用 Motion 做弹簧滑动动画。
- 后台页面使用普通的图标按钮切换主题，没有专门的切换动画。

项目中目前没有发现 `View Transition API`、全屏遮罩、圆形扩散或其他专门的页面级主题切换实现。

虽然部分页面元素声明了颜色过渡，但全局 Provider 配置了 `disableTransitionOnChange`。`next-themes` 会在主题切换期间临时禁用所有 CSS transition，因此这些过渡通常不会作为主题切换动画生效。

## 动画类型总览

严格按“主题切换相关”的实现统计，一共有 **4 类**：

| 类型 | 实现方式 | 当前状态 |
| --- | --- | --- |
| 页面主舞台颜色过渡 | `transition-colors duration-300` | 已声明，但主题切换时被 `disableTransitionOnChange` 临时禁用 |
| 页面白板容器过渡 | `color`、`background-color`、`border-color`、`box-shadow` 的 CSS transition | 已声明，但主题切换时被临时禁用 |
| 主题选择器滑块移动 | Motion spring，通过 `x: 0% / 100%` 移动选中背景 | 已启用，主站浮动菜单中可见 |
| 太阳/月亮图标动画 | Motion 的光线淡入和月亮旋转 | 组件支持，但当前主要由 hover 触发，不是主题切换直接触发 |

另外还有两类容易被误认为主题切换动画的关联动画，但它们不由主题切换直接触发：

- 背景层 `opacity` 淡入：用于背景初始化和 Canvas 就绪。
- 浮动菜单外圈 `ping` 和 `FluidOrb` 动画：用于菜单反馈和拖拽状态。

## 1. 全局主题 Provider

文件：[`ui/components/provider/global/index.tsx`](../ui/components/provider/global/index.tsx)

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  disableTransitionOnChange
  enableSystem
>
```

这里使用 `next-themes` 管理主题，并通过 `attribute="class"` 将主题反映到根元素的 class 上。

`disableTransitionOnChange` 表示主题切换时会暂时禁用 CSS transition。因此页面整体不会依靠普通的 `transition-colors` 产生平滑的主题过渡。

## 主题过渡期间黑白样式的工作原理

这里的“黑白两类 theme 样式同时存在”，并不是浅色和深色两个 class 同时作用于页面，而是以下几个机制共同造成的视觉效果：

### 1. 两套 CSS 规则同时存在

浅色变量定义在 `:root` 中，深色变量定义在 `.dark` 中。两套规则一直都存在于 CSS 中，但正常情况下只有当前匹配的规则会参与计算样式。

### 2. `next-themes` 切换根节点 class

调用 `setTheme('dark')` 或 `setTheme('light')` 后，`next-themes` 会修改 `<html>` 的 class。浏览器随后重新计算页面元素的最终样式。

### 3. CSS transition 渲染中间值

如果元素声明了颜色或背景过渡，例如：

```css
transition: color 300ms ease;
```

浏览器会记录切换前后的计算值，并在过渡期间渲染两者之间的插值。假设切换前的值为 `C0`，切换后的值为 `C1`，浏览器渲染的是随时间变化的中间值：

```text
C(t) = interpolate(C0, C1, t)
```

因此视觉上像是黑白两套主题同时存在，实际上并不是两个主题规则同时生效，而是旧计算值到新计算值之间的连续过渡。

### 4. 当前项目会临时禁用页面过渡

全局 Provider 配置了 `disableTransitionOnChange`。`next-themes` 会在切换根节点 class 的瞬间临时注入全局的 `transition: none !important`，然后恢复原有样式。

所以当前项目中，页面级颜色通常会从浅色直接切换到深色；前面列出的 `MainStage` 和 `.site-whiteboard` 过渡声明仍然存在，但不会在主题切换的瞬间播放。

### 5. Motion 动画是独立机制

浮动菜单中的主题选择滑块不依赖 CSS transition，而是由 Motion 根据 `resolvedTheme` 改变 `x` 值，并使用 spring 参数从旧位置移动到新位置。这类动画不会因为页面级 CSS transition 被禁用而消失。

## 2. 主站浮动菜单

文件：[`ui/(main)/layout/draggable-floating-menu/index.tsx`](../ui/(main)/layout/draggable-floating-menu/index.tsx)

### 主题切换入口

组件通过 `useTheme()` 获取 `setTheme` 和 `resolvedTheme`：

```tsx
const { setTheme, resolvedTheme } = useTheme()
```

主题切换由 `handleThemeChange()` 负责：

```tsx
const handleThemeChange = (nextTheme: 'light' | 'dark') => {
  if (resolvedTheme === nextTheme) return

  setTheme(nextTheme)
  playSoundEffect()
}
```

除了切换主题之外，这里还会播放点击音效。

### 实际的切换动画

主题设置区域中的 `motion.span` 是目前最明确的主题切换动画：

```tsx
<motion.span
  animate={{ x: resolvedTheme === 'dark' ? '100%' : '0%' }}
  transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
/>
```

它会在浅色和深色两个按钮之间横向移动，形成选中背景的弹簧滑动效果。

## 3. 后台主题切换

入口文件：[`ui/shadcn/mode-toggle.tsx`](../ui/shadcn/mode-toggle.tsx)

使用位置：[`ui/admin/layout/header/index.tsx`](../ui/admin/layout/header/index.tsx)

后台按钮直接调用：

```tsx
setTheme(currentTheme === 'light' ? 'dark' : 'light')
```

按钮本身只根据当前主题显示 `Sun` 或 `Moon` 图标，没有额外的 Motion 动画。

## 4. 页面级 CSS 过渡

### 主舞台

文件：[`ui/(main)/layout/main-stage.tsx`](../ui/(main)/layout/main-stage.tsx)

主舞台声明了：

```tsx
transition-colors duration-300 ease-out
```

它主要负责主舞台文字颜色变化。理论上 `.dark` class 切换时可能产生颜色过渡，但会被 `disableTransitionOnChange` 临时覆盖。

### 白板容器

文件：[`ui/(main)/layout/background/background.css`](../ui/(main)/layout/background/background.css)

`.site-whiteboard` 声明了以下过渡：

- `color`
- `background-color`
- `border-color`
- `box-shadow`

持续时间为 `300ms`。`.dark .site-whiteboard` 会修改这些属性，但主题切换期间同样会受到 Provider 的 transition 禁用策略影响。

### 背景层

同一个 `background.css` 中，`.site-background` 和 `.site-sky-field` 有 `opacity` 过渡。这些过渡主要用于背景初始化和 Canvas 就绪状态，不是由主题切换直接触发的页面级主题动画。

## 5. 主题颜色变量

文件：[`lib/styles/theme-vars.css`](../lib/styles/theme-vars.css)

浅色主题变量定义在 `:root` 中，深色主题变量定义在 `.dark` 中，例如：

- `--theme-background`
- `--theme-surface`
- `--theme-primary`
- `--theme-hover-background`
- `--theme-border`
- `--theme-ring`

样式入口文件 [`lib/styles/index.css`](../lib/styles/index.css) 会引入 `theme-vars.css`。

因此，主题切换的页面颜色变化主要来自 `.dark` class 触发后的 CSS 变量重新计算。

## 6. 太阳/月亮图标动画

文件：

- [`ui/shadcn/sun.tsx`](../ui/shadcn/sun.tsx)
- [`ui/shadcn/moon.tsx`](../ui/shadcn/moon.tsx)

这两个组件内部使用 Motion：

- `SunIcon` 的光线会按顺序淡入。
- `MoonIcon` 会做轻微的左右旋转。
- 两者支持 `isActive` 和 hover 触发动画。

不过，主站浮动菜单当前没有传入 `isActive`，因此这些图标目前主要表现为 hover 动画，并不是主题切换时直接触发的动画。

## 7. 相关但不属于主题切换的动画

文件：[`lib/styles/animation.css`](../lib/styles/animation.css)

这里定义了浮动菜单外圈使用的 `ping` 动画。浮动菜单中的 `FluidOrb` 使用 `var(--theme-accent)`，所以主题变化后颜色会跟随更新，但这不是主题切换专用动画。

## 文件速查

| 职责 | 文件 |
| --- | --- |
| 全局主题 Provider | [`ui/components/provider/global/index.tsx`](../ui/components/provider/global/index.tsx) |
| 主站主题切换入口 | [`ui/(main)/layout/draggable-floating-menu/index.tsx`](../ui/(main)/layout/draggable-floating-menu/index.tsx) |
| 后台主题切换入口 | [`ui/shadcn/mode-toggle.tsx`](../ui/shadcn/mode-toggle.tsx) |
| 后台按钮使用位置 | [`ui/admin/layout/header/index.tsx`](../ui/admin/layout/header/index.tsx) |
| 主题颜色变量 | [`lib/styles/theme-vars.css`](../lib/styles/theme-vars.css) |
| 主题图标动画 | [`ui/shadcn/sun.tsx`](../ui/shadcn/sun.tsx)、[`ui/shadcn/moon.tsx`](../ui/shadcn/moon.tsx) |
| 通用 ping 动画 | [`lib/styles/animation.css`](../lib/styles/animation.css) |
