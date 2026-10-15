# 部署到阿里云服务器

目标服务器：Ubuntu 24.04，公网地址 `47.98.97.106`，登录用户 `admin`。
游戏是纯前端应用，服务器只需要 Nginx，无需安装 Node.js 或上传源码。
游戏的公网入口为 <http://47.98.97.106/neon-city/>。
访问 `/neon-city` 会自动跳转到带末尾斜杠的地址，并保留查询参数。
根路径暂时返回 404，留给后续入口页或其他服务。

## 一、本机生成部署包

在 Windows 的项目终端执行以下命令。构建由你手动执行，部署打包脚本不会自动构建或测试。

```powershell
cd F:\new\my-test-card-game
pnpm build
pnpm deploy:package
```

只有第一条构建命令成功后，才执行打包命令。脚本会拒绝打包早于源码的旧 `dist`。
打包和安装脚本还会确认入口资源使用 `/neon-city/assets/`，避免发布旧的根路径版本。
本地开发仍使用根路径；`pnpm preview` 使用 `/neon-city/` 预览发布产物。

生成的文件位于 `output/deploy/neon-city-时间戳.tar.gz`。
只上传这个压缩包，不要上传 `node_modules`、源码、`.env` 或整个项目目录。

## 二、上传文件

在已经登录的阿里云 Workbench 左侧文件管理中，进入 `/home/admin`，
使用上传功能上传上一步生成的 `.tar.gz` 文件。

服务器终端执行以下命令。把第一行的文件名替换成实际上传的文件名，不要输入占位文字。

```bash
archive="$HOME/neon-city-实际时间戳.tar.gz"
deploy_dir="$(mktemp -d "$HOME/neon-deploy.XXXXXX")"
tar -xzf "$archive" -C "$deploy_dir"
sudo bash "$deploy_dir/install.sh"
```

安装脚本会安装缺失的 Nginx，创建独立站点配置，检查配置语法，
启动服务或平滑加载配置，并设置开机启动。不会停止其他服务，也不会删除历史版本。
如果系统不是这里确认的 Ubuntu 默认 Nginx 配置布局，或者 80 端口被其他进程占用，会停止并给出提示。

## 三、开放公网访问

进入阿里云 ECS 控制台，选择此实例关联的安全组，添加下列规则：

| 配置 | 值 |
| --- | --- |
| 方向 | 入方向 |
| 授权策略 | 允许 |
| 协议 | TCP |
| 目的端口 | 80 |
| 来源 | 0.0.0.0/0 |

无需向公网开放开发端口 2333。
阿里云界面操作参考：[使用安全组](https://www.alibabacloud.com/help/zh/ecs/user-guide/start-using-security-groups)。

服务器终端查看系统防火墙状态：

```bash
sudo ufw status
```

如果显示 `Status: active`，执行：

```bash
sudo ufw allow 80/tcp
```

如果显示 `Status: inactive`，不需要修改。不要为了部署开启或重置防火墙。

完成后在浏览器访问：<http://47.98.97.106/neon-city/>。页面和游戏功能由你验证。
若无法访问，请提供部署命令输出、安全组规则，以及浏览器显示的具体错误。

## 四、后续更新与域名

每次更新时重新生成部署包、上传，并使用新的临时目录重复解压和安装步骤。
旧版本目录保留在 `/var/www/neon-city/releases`，旧素材保留在 `shared/assets`，
便于已经打开的页面继续请求资源。累计文件后可以另行安排清理。

如果已有域名，将域名的 A 记录指向 `47.98.97.106`，并将安装命令改成：

```bash
sudo bash "$deploy_dir/install.sh" 你的实际域名
```

这一步只配置 HTTP。域名确定后，再按实际情况处理域名接入条件与 HTTPS 证书。
游戏存档保存在浏览器中，更换浏览器、设备或访问地址后，不会自动共享原有存档。
仅从同一地址的根路径改为 `/neon-city/`，仍属于同一个来源，浏览器存档可以继续使用。

## 五、同一地址添加其他服务

公共入口配置是 `/etc/nginx/sites-available/neon-city`，在同一个 `server` 内引入
`/etc/nginx/web-services/*.conf`。游戏路由独立放在
`/etc/nginx/web-services/neon-city.conf`，更新游戏时保留其他服务的路由文件。

未来添加服务时，在这个目录新建单独的 `.conf` 文件，只编写该服务的 `location`，
不要另建同名 `server`。例如，新服务在服务器本机 3000 端口运行，可以这样映射：

```nginx
location = /tools {
    return 308 /tools/$is_args$args;
}

location /tools/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

这个示例将 `/tools/` 前缀去掉后转发给新服务；新服务的页面、资源、接口路径也需要支持
该前缀，具体根据该服务配置调整。新增配置后执行 `sudo nginx -t`，成功后执行
`sudo systemctl reload nginx`，即可继续使用同一个公网 IP 和 80 端口。

从旧根路径版本迁移时，使用当前源码重新构建、打包并运行安装脚本即可，
不需要手动移动服务器上的旧文件，也不需要更改安全组。

## 相关文件

- `scripts/deploy/package.mjs`：检查已有发布产物并生成上传包。
- `scripts/deploy/install.sh`：Ubuntu 服务器安装与版本切换。
- `scripts/deploy/nginx.conf`：公共入口、服务路由引入及压缩配置。
- `scripts/deploy/neon-city.conf`：游戏子路径、入口缓存及共享素材配置。

入口页面不长期缓存，带哈希的素材可长期缓存；不存在的素材返回 404。
Nginx 平滑加载参考：[官方入门文档](https://nginx.org/en/docs/beginners_guide.html)。
按开发、发布与预览命令选择配置，参考 [Vite 条件配置](https://v5.vite.dev/config/#conditional-config)。
