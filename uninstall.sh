#!/bin/sh
# 卸载 mihomo。默认保留 /etc/mihomo 与 /etc/config/mihomo（订阅）。
#   ./uninstall.sh           保留订阅
#   ./uninstall.sh --purge   连订阅一起删
set -u
apk del mihomo || { echo "错误: apk del 失败" >&2; exit 1; }
if [ "${1:-}" = "--purge" ]; then
	rm -rf /etc/mihomo /etc/config/mihomo
	echo "已卸载（含订阅配置）。"
else
	echo "已卸载。订阅配置保留在 /etc/mihomo 与 /etc/config/mihomo（--purge 可删）。"
fi
