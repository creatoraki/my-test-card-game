# 日常部署

服务器已配置好 Nginx，日常部署只更新静态网站，不安装服务、不修改 Nginx 配置，
也不重启或重载 Nginx。公网入口保持为 <http://47.98.97.106/neon-city/>。

## 一、准备上传文件

已有最新发布产物时，在本机运行：

```powershell
pnpm deploy:package
```

打包脚本不会自动构建或测试；它会检查已有 `dist` 的时间及资源路径。
发布产物需要你自行提前更新。

生成文件位于 `output/deploy`：

- `neon-city-时间戳.tar.gz`：仅包含静态网站。
- `deploy.sh`：独立的一键部署脚本。

将这两个文件上传至服务器 `/home/admin`。不要上传源码、环境文件或本地依赖。

**已经打好包时无需重新打包**，直接上传 `output/deploy/deploy.sh` 即可。
入口脚本也支持之前生成的完整包，只读取其中的 `site`，不会执行包内的旧安装脚本。

## 二、服务器一键部署

在服务器终端执行：

```bash
bash /home/admin/deploy.sh
```

脚本按文件名中的时间戳选择 `/home/admin` 中最新的部署包，自动完成：

1. 通过 `sudo` 获取发布目录的写入权限。
2. 检查现有站点的目录布局。
3. 解压压缩包并检查页面、资源目录与 `/neon-city/` 资源前缀。
4. 复制到新的版本目录，同步共享资源。
5. 原子切换 `current` 链接，让后续请求使用新版本。
6. 清理本次临时解压目录。

准备新版本失败时不会切换线上版本。上传的压缩包、历史版本及旧共享资源保留。
脚本可能要求输入当前登录用户的 `sudo` 密码。

也可以明确指定部署包：

```bash
bash /home/admin/deploy.sh /home/admin/neon-city-20261015T021227815Z.tar.gz
```

## 三、后续更新

每次上传新包后，重复执行同一条命令：

```bash
bash /home/admin/deploy.sh
```

部署脚本有变更时，再上传新的 `deploy.sh`。页面和游戏功能由你在浏览器验证。

## 目录约定

脚本沿用已经配置好的站点布局：

| 路径 | 用途 |
| --- | --- |
| `/home/admin` | 上传的部署包与入口脚本 |
| `/var/www/neon-city/releases` | 各次发布的完整静态网站 |
| `/var/www/neon-city/current` | 指向当前版本的符号链接 |
| `/var/www/neon-city/web/neon-city` | 指向 `current` 的站点链接 |
| `/var/www/neon-city/shared/assets` | 各版本共用的带哈希资源 |

现有目录不符合约定时，脚本会停止并提示，不会自动更改 Nginx 配置。

## 相关文件

- `scripts/deploy/package.mjs`：检查已有发布产物，生成压缩包及独立入口脚本。
- `scripts/deploy/deploy.sh`：日常发布，只更新项目静态文件及版本链接。
- `scripts/deploy/install.sh`、`nginx.conf`、`neon-city.conf`：保留的旧初始化文件，不参与日常打包或部署。
