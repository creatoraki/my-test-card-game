# 通用 BUFF 切图

脚本将规则网格模板中的每格切为独立图标，保留背景和圆角边框，与备用 BUFF 的样式一致，不做透明去底。默认读取 `处理后的WebP素材/备用BUFF/BUFF_01.png` 的尺寸与格式，输出 301×299 PNG。

处理生态方舟三张模板，共 48 格：

```powershell
node scripts/extract-buff-grid.mjs
```

处理其他模板，可传入多个图片路径：

```powershell
node scripts/extract-buff-grid.mjs "处理后的WebP素材/其他模板.png"
```

默认四行四列，自动定位蓝灰色格框。没有这种格框的模板，使用 `--inset` 指定每个等分网格的内缩像素：

```powershell
node scripts/extract-buff-grid.mjs "模板.png" --rows 2 --columns 2 --inset 2
```

通过 `--reference` 更改参考规格，`--output` 更改输出目录，`--names` 指定名称 JSON 文件。名称文件为字符串数组，数量必须等于单张模板的格数，按从左到右、从上到下排列，各张模板共用。不同输入模板应使用不同文件名。

输出默认位于 `处理后的WebP素材/组装部件`。文件名包含模板名、格子序号和状态名，另附 JSON 切图清单，记录来源、行列与裁切坐标。同名文件存在时会停止；确认需要重新处理后可加 `--overwrite`。

该脚本只导出候选素材，不修改游戏中的美术引用。
