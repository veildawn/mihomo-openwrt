#
# mihomo (Clash.Meta) + LuCI —— 固件集成包
#
# 放入 photonicat-openwrt/port/patch/package/mihomo/，
# defconfig 加 CONFIG_PACKAGE_mihomo=y。
# 核心 mihomo 与 GEO 数据库均在构建时从官方 release 下载（mihomo 按 sha256
# 锁定；GEO 用 latest tag，刷机后 mihomo-update 会在线刷新，无需锁死）。
# files/ 里是全部脚本/LuCI 界面；files/etc/config/mihomo 可选预置订阅
# （烤入固件刷机后开机即用）——默认为空模板。
#
include $(TOPDIR)/rules.mk

PKG_NAME:=mihomo
PKG_VERSION:=1.19.34
PKG_RELEASE:=1
PKG_LICENSE:=GPL-3.0
PKG_MAINTAINER:=veildawn

# 官方 arm64 预编译二进制（.gz）
PKG_SOURCE:=mihomo-linux-arm64-v$(PKG_VERSION).gz
PKG_SOURCE_URL:=https://github.com/MetaCubeX/mihomo/releases/download/v$(PKG_VERSION)
PKG_HASH:=daaf78a6240a282cdfd75bcbf98fe321f6bd52765cc29e79f344191198f0b50f
PKG_BUILD_DEPENDS:=

# 不解包 tar，直接 gunzip 出二进制
PKG_UNPACK:=gzip -dc $(DL_DIR)/$(PKG_SOURCE) > $(PKG_BUILD_DIR)/mihomo

GEO_BASE:=https://github.com/MetaCubeX/meta-rules-dat/releases/download/latest

include $(INCLUDE_DIR)/package.mk

define Package/mihomo
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Proxy
  TITLE:=mihomo (Clash.Meta) TUN transparent proxy with LuCI app
  URL:=https://github.com/MetaCubeX/mihomo
  DEPENDS:=+kmod-tun +curl +ucode-mod-uci +rpcd-mod-ucode +jsonfilter +ca-bundle
  PKGARCH:=aarch64_cortex-a53
endef

define Package/mihomo/description
  mihomo (Clash.Meta) 内核 + 服务脚本 + 自写 LuCI 界面，来自
  f50-openwrt custom/mihomo-port。TUN + auto-route 全局域网透明代理。
  订阅在 LuCI -> 服务 -> Mihomo -> 订阅 管理；/etc/config/mihomo
  预置订阅时刷机后开机即用。
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)/geo
	$(PKG_UNPACK)
	chmod 755 $(PKG_BUILD_DIR)/mihomo
	curl -fsSL --retry 3 -o $(PKG_BUILD_DIR)/geo/geoip.metadb $(GEO_BASE)/geoip.metadb \
		|| wget -q -O $(PKG_BUILD_DIR)/geo/geoip.metadb $(GEO_BASE)/geoip.metadb
	curl -fsSL --retry 3 -o $(PKG_BUILD_DIR)/geo/GeoSite.dat $(GEO_BASE)/geosite.dat \
		|| wget -q -O $(PKG_BUILD_DIR)/geo/GeoSite.dat $(GEO_BASE)/geosite.dat
endef

define Package/mihomo/install
	$(CP) ./files/* $(1)/
	$(INSTALL_DIR) $(1)/usr/bin $(1)/usr/share/mihomo
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/mihomo $(1)/usr/bin/mihomo
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/geo/geoip.metadb $(1)/usr/share/mihomo/geoip.metadb
	$(INSTALL_DATA) $(PKG_BUILD_DIR)/geo/GeoSite.dat $(1)/usr/share/mihomo/GeoSite.dat
endef

$(eval $(call BuildPackage,mihomo))
