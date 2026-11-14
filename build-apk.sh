#!/bin/sh
# 从源码重建 mihomo-1.19.34-r1.apk（需 Docker）
#
# 仓库里只有源码（files/ + scripts/）；二进制与 GEO 数据库
# 构建时按 hash/官方 release 下载到 dl/，组装 apk-root 后用
# alpine:edge 的 apk mkpkg 打成 v3 包。
set -e
cd "$(dirname "$0")"

VER=1.19.34
MIHOMO_HASH=daaf78a6240a282cdfd75bcbf98fe321f6bd52765cc29e79f344191198f0b50f
GEO_BASE=https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest

mkdir -p dl apk-root

# ---- 下载核心与 GEO（已有且校验通过则跳过） ----
fetch() { curl -fsSL --retry 5 --retry-all-errors -o "$2.tmp" "$1" && mv "$2.tmp" "$2"; }
if [ ! -f dl/mihomo ] || ! shasum -a 256 -c >/dev/null 2>&1 <<EOF
$MIHOMO_HASH  dl/mihomo.gz
EOF
then
	fetch "https://github.com/MetaCubeX/mihomo/releases/download/v$VER/mihomo-linux-arm64-v$VER.gz" dl/mihomo.gz
	echo "$MIHOMO_HASH  dl/mihomo.gz" | shasum -a 256 -c -
	gzip -dc dl/mihomo.gz > dl/mihomo.tmp && mv dl/mihomo.tmp dl/mihomo
fi
[ -f dl/geoip.metadb ] || fetch "$GEO_BASE/geoip.metadb" dl/geoip.metadb
[ -f dl/geosite.dat ]  || fetch "$GEO_BASE/geosite.dat"  dl/geosite.dat
[ "$(wc -c < dl/geoip.metadb)" -gt 1000000 ] || { echo "geoip.metadb 不完整" >&2; exit 1; }
[ "$(wc -c < dl/geosite.dat)" -gt 1000000 ] || { echo "geosite.dat 不完整" >&2; exit 1; }

# ---- 组装 apk-root：files/ 全量（含重装保护的两份现网配置逻辑在脚本里），
#      排除 /etc/config/mihomo（订阅归用户所有，post-install 生成） ----
rm -rf apk-root
mkdir -p apk-root
(cd files && tar cf - --exclude='./etc/config/mihomo' .) | (cd apk-root && tar xf -)
cp dl/mihomo apk-root/usr/bin/mihomo
chmod 755 apk-root/usr/bin/mihomo
mkdir -p apk-root/usr/share/mihomo
cp dl/geoip.metadb apk-root/usr/share/mihomo/geoip.metadb
cp dl/geosite.dat apk-root/usr/share/mihomo/GeoSite.dat

# ---- mkpkg（v3 包，字段照抄 openwrt include/package-pack.mk） ----
docker run --rm -v "$(cd .. && pwd)":/w -w /w alpine:edge apk mkpkg \
	--info "name:mihomo" --info "version:$VER-r1" \
	--info "description:mihomo (Clash.Meta) kernel + service + LuCI app" \
	--info "arch:aarch64_cortex-a53" --info "license:GPL-3.0" \
	--info "origin:f50-openwrt/custom/mihomo-port" \
	--info "url:https://github.com/MetaCubeX/mihomo" --info "maintainer:veildawn" \
	--info "depends:curl ucode-mod-uci rpcd-mod-ucode rpcd jsonfilter ca-bundle" \
	--script post-install:/w/mihomo-openwrt/scripts/post-install \
	--script post-deinstall:/w/mihomo-openwrt/scripts/post-deinstall \
	--files /w/mihomo-openwrt/apk-root \
	--output /w/mihomo-openwrt/mihomo-$VER-r1.apk
ls -lh mihomo-$VER-r1.apk
