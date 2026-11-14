#!/bin/sh
# mihomo 标准安装: apk add 依赖自动解析（curl 等自动从官方源拉取）
# 用法: ./install.sh     （在解压后的目录里，root 执行）
set -u
cd "$(dirname "$0")" || exit 1

PKG=mihomo-1.19.34-r1.apk
[ -f "$PKG" ] || { echo "错误: 找不到 $PKG" >&2; exit 1; }
[ "$(id -u)" = 0 ] || { echo "错误: 请以 root 运行" >&2; exit 1; }

# 依赖: curl 在官方 snapshots 的 packages feed（apk 自动解析拉取）
# 镜像按可达性回退；固件自带的陈旧源可能报 wget error 8，无害
REPOS="
https://downloads.openwrt.org/snapshots/packages/aarch64_cortex-a53/packages
https://mirror.sjtu.edu.cn/openwrt/snapshots/packages/aarch64_cortex-a53/packages
"

echo "== 安装 mihomo（依赖自动解析）=="
ok=0
for r in $REPOS; do
	echo "仓库: $r"
	if apk add --allow-untrusted -X "$r" "./$PKG"; then ok=1; break; fi
done
[ "$ok" = 1 ] || { echo "错误: 所有仓库都失败了。检查网络，或手动执行:" >&2
	echo "  apk add --allow-untrusted -X <packages-feed-url> ./$PKG" >&2; exit 1; }

echo
echo "== TUN 检查 =="
if [ -e /dev/net/tun ] || modprobe tun 2>/dev/null; then
	echo "  /dev/net/tun 就绪"
else
	echo "  [!] 缺 kmod-tun（自编译内核无法在线安装）—— 服务已 enable 未启动。" >&2
	echo "      固件 defconfig 加 CONFIG_PACKAGE_kmod-tun=y 重编后:" >&2
	echo "      /etc/init.d/mihomo start" >&2
fi

IP=$(uci -q get network.lan.ipaddr 2>/dev/null || echo 192.168.1.1)
IP=${IP%%/*}
echo
echo "== 完成 =="
echo "  LuCI:   http://$IP/cgi-bin/luci/admin/services/mihomo"
echo "  下一步: LuCI -> 服务 -> Mihomo -> 订阅 -> 添加订阅链接并启用"
echo "  命令:   /etc/init.d/mihomo {status|update|log}"
