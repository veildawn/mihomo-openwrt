# mihomo for OpenWrt（aarch64 / apk）

标准 .apk 安装包，来自 `f50-openwrt` 的 `custom/mihomo-port`（自写 LuCI 界面）。

| 组件 | 版本/来源 |
|---|---|
| .apk 包 | `mihomo-1.19.34-r1.apk`（apk-tools v3 格式，未签名，安装加 `--allow-untrusted`） |
| mihomo 核心 | v1.19.34 官方 `mihomo-linux-arm64`（静态链接） |
| GEO 数据 | MetaCubeX/meta-rules-dat `latest`（geoip.metadb + GeoSite.dat 随包附带） |
| 服务/脚本/LuCI | f50-openwrt `custom/mihomo-port` 原样未改 |

## 安装（标准 apk 依赖解析）

```sh
scp -O mihomo-openwrt.tar.gz root@192.168.1.1:/tmp/
ssh root@192.168.1.1
cd /tmp && tar xzf mihomo-openwrt.tar.gz && cd mihomo-openwrt
./install.sh
# 等价于一条命令:
# apk add --allow-untrusted \
#   -X https://downloads.openwrt.org/snapshots/packages/aarch64_cortex-a53/packages \
#   ./mihomo-1.19.34-r1.apk
```

包声明的依赖（`depends: curl ucode-mod-uci rpcd-mod-ucode rpcd jsonfilter ca-bundle`）
由 apk 自动解析：机上已有的直接满足，缺的（如 curl + libcurl4 + libnghttp2）从
官方 snapshots `packages` feed 自动拉取，卸载时孤儿依赖一并移除。
**不改动** `/etc/apk/repositories`（用 `-X` 临时仓库参数）。

装好后在 **LuCI → 服务 → Mihomo → 订阅** 添加订阅并启用，即完成全局透明代理
（TUN + auto-route，局域网设备零配置）。

## kmod-tun（唯一进固件的依赖）

TUN 内核模块**无法在线安装**：自编译内核的 vermagic 与官方源不匹配。
固件 defconfig 加：

```
CONFIG_PACKAGE_kmod-tun=y
```

缺它时安装照样完成、服务 enable 但不启动；固件带上后 `/etc/init.d/mihomo start` 即可。
（TUN 方案不需要 nft_tproxy / nft_socket。）

## 卸载 / 更新

```sh
./uninstall.sh            # apk del mihomo；订阅配置保留
./uninstall.sh --purge    # 连 /etc/mihomo /etc/config/mihomo 一起删
```

升级核心/GEO：LuCI 概览页或 `mihomo-update core|geo`（走 mihomo 自身代理）。
改了 scripts/ 或文件树后重建 .apk：`./build-apk.sh`（需 Docker，完整源在
`files/` 与 `apk-root/`，随工作区目录保存，不随 tarball 分发）。

## 已验证（2026-11-15, OpenWrt SNAPSHOT r38253 / 6.18.60）

- `apk add` 正常解析并拉取 curl 闭包，post-install 生成 `/etc/config/mihomo`
  （含随机 API secret）与防火墙 zone（Meta 设备 + lan→mihomo 转发）
- 无订阅时不启动（日志提示去 LuCI 添加），`ubus` 后端 `luci.mihomo` 注册成功
- `apk del` 干净移除（含防火墙 zone、rc.d 链接、孤儿依赖）
- 固件自带的陈旧源地址可能报 `wget: exited with error 8` 噪音，无害

## 仓库结构

```
install.sh / uninstall.sh   路由器上安装/卸载（标准 apk 依赖解析）
build-apk.sh                从源码重建 .apk（需 Docker，自动下载核心与 GEO）
files/                      主文件树（init/uci-defaults/genconf/update/LuCI/keep.d）
scripts/                    apk 安装钩子（post-install / post-deinstall）
firmware-package/           固件集成包（烤入固件，线刷后数据不丢）
```

构建产物（`*.apk`、`apk-root/`、`dl/`、二进制与 GEO）不入库，
`build-apk.sh` 可从源码完整重建。

## 固件集成（刷机后数据不丢）

USB 线刷（Maskrom 直写 eMMC）会清空 overlay，sysupgrade keep 列表无效——
把本包烤进固件即可：

```sh
cp -R firmware-package <openwrt-build-tree>/package/mihomo
# defconfig: CONFIG_PACKAGE_mihomo=y （依赖 kmod-tun curl 自动带入）
```

核心 mihomo 构建时按 sha256 从官方 release 下载，GEO 用 latest tag（运行期
`mihomo-update geo` 在线刷新）。`firmware-package/files/etc/config/mihomo`
可预置订阅（刷机后开机即用），默认为空模板。日常升级建议走系统内
`sysupgrade`：烤入固件的文件在镜像里，订阅与 `/etc/mihomo` 走 overlay 保留。
