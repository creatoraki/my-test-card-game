#!/usr/bin/env bash
set -euo pipefail

# 上传包解压后执行。只安装静态站点，不在服务器上运行构建或测试。
source_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
app_root=/var/www/neon-city
public_ip=47.98.97.106
domain="${1:-}"
server_names="$public_ip"

if [[ "$EUID" -ne 0 ]]; then
    echo "请使用 sudo bash 执行此脚本。" >&2
    exit 1
fi

if [[ -n "$domain" ]]; then
    if [[ ! "$domain" =~ ^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$ || "$domain" != *.* ]]; then
        echo "域名格式不正确，请只填写域名，不要带协议、端口或路径。" >&2
        exit 1
    fi
    server_names="$public_ip $domain"
fi

if [[ ! -f "$source_dir/site/index.html" || ! -d "$source_dir/site/assets" || ! -f "$source_dir/nginx.conf" || ! -f "$source_dir/neon-city.conf" ]]; then
    echo "部署文件不完整，请重新解压整个部署包。" >&2
    exit 1
fi
if ! grep -q 'src="/neon-city/assets/' "$source_dir/site/index.html"; then
    echo "发布产物未使用 /neon-city/ 路径，请在本机重新构建并打包。" >&2
    exit 1
fi

# 不接管其他进程已占用的端口。
listeners="$(ss -H -lntp 'sport = :80')"
if [[ -n "$listeners" ]] && grep -qv '"nginx"' <<< "$listeners"; then
    echo "80 端口已被其他进程占用，请先确认现有服务用途：" >&2
    echo "$listeners" >&2
    exit 1
fi

if ! command -v nginx >/dev/null 2>&1; then
    apt-get update
    DEBIAN_FRONTEND=noninteractive apt-get install -y nginx
fi

if [[ ! -d /etc/nginx/sites-available || ! -d /etc/nginx/sites-enabled ]]; then
    echo "当前 Nginx 不使用 Ubuntu 默认目录，请先人工确认配置位置。" >&2
    exit 1
fi

release_id="$(date -u +%Y%m%dT%H%M%SZ)-$$"
release_dir="$app_root/releases/$release_id"
config_path=/etc/nginx/sites-available/neon-city
enabled_path=/etc/nginx/sites-enabled/neon-city
service_config_path=/etc/nginx/web-services/neon-city.conf
mkdir -p "$release_dir" "$app_root/shared/assets" "$app_root/config-backups" "$app_root/web" /etc/nginx/web-services

if [[ -e "$app_root/current" && ! -L "$app_root/current" ]]; then
    echo "$app_root/current 已存在且不是版本链接，已停止部署。" >&2
    exit 1
fi
if [[ -e "$app_root/web/neon-city" || -L "$app_root/web/neon-city" ]]; then
    if [[ ! -L "$app_root/web/neon-city" || "$(readlink "$app_root/web/neon-city")" != "$app_root/current" ]]; then
        echo "$app_root/web/neon-city 已存在且不属于本脚本，已停止部署。" >&2
        exit 1
    fi
else
    ln -s "$app_root/current" "$app_root/web/neon-city"
fi
if [[ -e "$enabled_path" || -L "$enabled_path" ]]; then
    if [[ ! -L "$enabled_path" || "$(readlink "$enabled_path")" != "$config_path" ]]; then
        echo "$enabled_path 已存在且不属于本脚本，已停止部署。" >&2
        exit 1
    fi
fi

cp -a "$source_dir/site/." "$release_dir/"
cp -au "$source_dir/site/assets/." "$app_root/shared/assets/"
chmod 755 "$app_root" "$app_root/releases" "$app_root/shared" "$app_root/web" /etc/nginx/web-services
chmod -R a+rX "$release_dir" "$app_root/shared/assets"

previous_config=""
if [[ -e "$config_path" ]]; then
    previous_config="$app_root/config-backups/$release_id.conf"
    cp -a "$config_path" "$previous_config"
fi
previous_release="$(readlink "$app_root/current" 2>/dev/null || true)"
previous_service_config=""
if [[ -e "$service_config_path" ]]; then
    previous_service_config="$app_root/config-backups/$release_id.service.conf"
    cp -a "$service_config_path" "$previous_service_config"
fi

restore_on_error() {
    echo "部署未完成，正在恢复原有站点配置。" >&2
    if [[ -n "$previous_config" ]]; then
        cp -a "$previous_config" "$config_path"
    elif [[ -e "$config_path" ]]; then
        mv "$config_path" "$app_root/config-backups/$release_id.failed.conf"
        if [[ -L "$enabled_path" ]]; then
            mv "$enabled_path" "$app_root/config-backups/$release_id.failed.link"
        fi
    fi
    if [[ -n "$previous_service_config" ]]; then
        cp -a "$previous_service_config" "$service_config_path"
    elif [[ -e "$service_config_path" ]]; then
        mv "$service_config_path" "$app_root/config-backups/$release_id.failed.service.conf"
    fi
    if [[ -n "$previous_release" ]]; then
        ln -s "$previous_release" "$app_root/restore-$release_id"
        mv -Tf "$app_root/restore-$release_id" "$app_root/current"
    elif [[ -L "$app_root/current" ]]; then
        mv "$app_root/current" "$app_root/config-backups/$release_id.failed.current"
    fi
}
trap restore_on_error ERR

sed "s/__SERVER_NAMES__/$server_names/g" "$source_dir/nginx.conf" > "$config_path"
install -m 644 "$source_dir/neon-city.conf" "$service_config_path"
if [[ ! -L "$enabled_path" ]]; then
    ln -s "$config_path" "$enabled_path"
fi

# 发布前仅检查 Nginx 配置语法，避免加载无效配置。
nginx -t
ln -s "$release_dir" "$app_root/next-$release_id"
mv -Tf "$app_root/next-$release_id" "$app_root/current"
if systemctl is-active --quiet nginx; then
    systemctl reload nginx
else
    systemctl start nginx
fi
trap - ERR
systemctl enable nginx

echo "站点已配置：http://$public_ip/neon-city/"
if [[ -n "$domain" ]]; then
    echo "域名解析生效后可访问：http://$domain/neon-city/"
fi
echo "请在阿里云安全组放行入方向 TCP 80。若系统防火墙已启用，还需放行 80/tcp。"
echo "当前版本：$release_dir"
echo "历史版本和原有配置均已保留。"
