#!/usr/bin/env bash
set -euo pipefail

# 独立上传至服务器即可使用。只发布静态资源，不执行包内的旧安装脚本。
upload_dir=/home/admin
app_root=/var/www/neon-city
archive="${1:-}"

if [[ "$archive" == "--help" || "$archive" == "-h" ]]; then
    echo "用法：bash deploy.sh [部署包路径]"
    echo "不指定部署包时，按文件名中的时间戳选择 /home/admin 中最新的部署包。"
    exit 0
fi
if (( $# > 1 )); then
    echo "参数过多，用法：bash deploy.sh [部署包路径]" >&2
    exit 1
fi

if [[ -z "$archive" ]]; then
    for candidate in "$upload_dir"/neon-city-*.tar.gz; do
        [[ -f "$candidate" ]] || continue
        # 打包脚本使用固定长度的 UTC 时间戳，文件名顺序即版本顺序。
        [[ "${candidate##*/}" =~ ^neon-city-[0-9]{8}T[0-9]{9}Z\.tar\.gz$ ]] || continue
        if [[ -z "$archive" || "$candidate" > "$archive" ]]; then
            archive="$candidate"
        fi
    done
fi

if [[ -z "$archive" ]]; then
    echo "未找到部署包，请先将 neon-city-时间戳.tar.gz 上传至 $upload_dir。" >&2
    exit 1
fi
if [[ ! -f "$archive" || ! -r "$archive" ]]; then
    echo "部署包不存在或不可读取：$archive" >&2
    exit 1
fi

if [[ "$EUID" -ne 0 ]]; then
    # 整个发布过程使用同一权限，临时目录也由同一用户清理。
    exec sudo bash "${BASH_SOURCE[0]}" "$archive"
fi

# 遵循现有 Nginx 使用的目录布局，不自动接管其他站点目录。
if [[ ! -L "$app_root/current" || ! -d "$app_root/current" ]]; then
    echo "未找到已部署的版本链接：$app_root/current，请先确认现有站点目录。" >&2
    exit 1
fi
if [[ ! -L "$app_root/web/neon-city" || "$(readlink "$app_root/web/neon-city")" != "$app_root/current" ]]; then
    echo "现有站点目录与部署脚本预期不符：$app_root/web/neon-city，已停止部署。" >&2
    exit 1
fi
if [[ ! -d "$app_root/shared/assets" ]]; then
    echo "未找到已有共享资源目录：$app_root/shared/assets，已停止部署。" >&2
    exit 1
fi

deploy_dir="$(mktemp -d -t neon-deploy.XXXXXX)"
release_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
release_dir="$app_root/releases/$release_id"
next_link="$app_root/next-$release_id"
cleanup() {
    if [[ -L "$next_link" ]]; then
        rm -- "$next_link"
    fi
    rm -rf -- "$deploy_dir"
}
trap cleanup EXIT

echo "使用部署包：$archive"
echo "正在解压并部署……"
tar --extract --gzip --file="$archive" --directory="$deploy_dir" --no-same-owner
if [[ ! -f "$deploy_dir/site/index.html" || ! -d "$deploy_dir/site/assets" ]]; then
    echo "部署包缺少页面或资源目录，请使用 deploy:package 生成的完整压缩包。" >&2
    exit 1
fi

if ! grep -q 'src="/neon-city/assets/' "$deploy_dir/site/index.html"; then
    echo "发布产物未使用 /neon-city/ 路径，已停止部署。" >&2
    exit 1
fi

# 先准备完整版本及共享资源；任一步失败时，线上版本链接保持原状。
mkdir -p "$release_dir"
cp -a "$deploy_dir/site/." "$release_dir/"
cp -au "$deploy_dir/site/assets/." "$app_root/shared/assets/"
chmod 755 "$app_root" "$app_root/releases" "$app_root/shared" "$app_root/shared/assets" "$app_root/web"
chmod -R a+rX "$release_dir" "$app_root/shared/assets"

# 原子切换版本，Nginx 使用原有配置即可读取新的静态文件。
ln -s "$release_dir" "$next_link"
mv -Tf "$next_link" "$app_root/current"

echo "当前版本：$release_dir"
echo "历史版本与共享资源已保留。"
echo "部署完成，临时解压目录将自动清理。"
