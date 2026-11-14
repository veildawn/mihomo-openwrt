'use strict';
'require view';
'require poll';
'require rpc';
'require ui';
'require dom';
'require mihomo.common as mihomo';
'require view.cellular.common as cm';

const callUpdateStatus = rpc.declare({ object: 'luci.mihomo', method: 'update_status' });
const callUpdateStart = rpc.declare({ object: 'luci.mihomo', method: 'update_start', params: [ 'job', 'version' ] });
const callProfileUpdate = rpc.declare({ object: 'luci.mihomo', method: 'profile_update' });

const MODES = [ [ 'rule', _('规则') ], [ 'global', _('全局') ], [ 'direct', _('直连') ] ];

const CSS = `
.mo-hero .state { width: 88px; height: 88px; font-size: 40px; }
.mo-hero .state.on { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; }
.mo-hero .state.off { background: rgba(107,114,128,.12); color: #6b7280; }
.mo-hero .state.bad { background: rgba(220,38,38,.1); color: #dc2626; }
.mo-hero .side { flex-direction: column; align-items: flex-end; gap: 12px; }
.mo-seg { display: inline-flex; border: 1px solid rgba(128,128,128,.3); border-radius: 9px; padding: 2px; gap: 2px; }
.mo-seg button { border: 0; background: transparent; color: inherit; font: inherit; font-size: 13px; padding: 5px 14px; border-radius: 7px; cursor: pointer; opacity: .7; }
.mo-seg button.on { background: #4f46e5; color: #fff; opacity: 1; font-weight: 600; }
.mo-seg button[disabled] { cursor: not-allowed; opacity: .35; }
.mo-ctl { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
@media (max-width: 720px) { .mo-hero .side { align-items: stretch; } .mo-ctl { justify-content: flex-start; } }
.mo-sub .name { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mo-rows { display: flex; flex-direction: column; }
.mo-row { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-top: 1px dashed rgba(128,128,128,.22); flex-wrap: wrap; }
.mo-row:first-child { border-top: 0; padding-top: 2px; }
.mo-row .lead { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; background: rgba(79,70,229,.1); color: #4f46e5; flex: none; }
.mo-row .main { flex: 1; min-width: 200px; }
.mo-row .t { font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mo-row .d { font-size: 12px; opacity: .65; margin-top: 3px; }
.mo-row .ctl { display: flex; gap: 6px; flex-wrap: wrap; }
`;

/* "v1.19.33" > "v1.19.32" */
function newer(a, b) {
	const pa = String(a || '').replace(/^v/, '').split('.').map(Number);
	const pb = String(b || '').replace(/^v/, '').split('.').map(Number);

	for (let i = 0; i < Math.max(pa.length, pb.length); i++)
		if ((pa[i] || 0) != (pb[i] || 0))
			return (pa[i] || 0) > (pb[i] || 0);

	return false;
}

function ago(ts) {
	if (!ts)
		return '—';

	const s = Math.max(0, Date.now() / 1000 - ts);

	if (s < 3600)
		return _('%d 分钟前').format(Math.max(1, Math.floor(s / 60)));
	if (s < 86400)
		return _('%d 小时前').format(Math.floor(s / 3600));

	return _('%d 天前').format(Math.floor(s / 86400));
}

return view.extend({
	last: null,
	upd: null,
	updAt: 0,

	load: function() {
		return Promise.all([ mihomo.status(), L.resolveDefault(callUpdateStatus(), null) ])
			.catch((err) => [ { __err: err }, null ]);
	},

	refresh: function() {
		/* the update card needs `mihomo -v` twice: poll it slowly unless a job runs */
		const busy = this.upd?.busy || this.upd?.job?.state == 'running';
		const want = busy || Date.now() - this.updAt > 15000;

		return Promise.all([ mihomo.status(), want ? L.resolveDefault(callUpdateStatus(), null) : null ]).then((r) => {
			if (r[1]) {
				this.upd = r[1];
				this.updAt = Date.now();
			}
			this.update(r[0]);
		});
	},

	act: function(p, ok) {
		return Promise.resolve(p).then((res) => {
			if (res && (res.code > 0 || res.ok === false))
				throw new Error(res.output || _('操作失败'));
			if (ok)
				ui.addNotification(null, E('p', ok), 'info');
		}).catch(mihomo.notifyError).then(() => this.refresh());
	},

	startJob: function(job, version, msg) {
		return callUpdateStart(job, version).then((res) => {
			if (!res?.ok)
				throw new Error(res?.output || _('无法开始'));

			this.upd = Object.assign({}, this.upd, { busy: true, job: { job: job, state: 'running', msg: msg, at: Date.now() / 1000 } });
			this.updAt = 0;
			this.update(this.st);
		}).catch(mihomo.notifyError);
	},

	/* ---------- hero ---------- */

	renderHero: function(st) {
		const run = st.running;
		const crashing = st.crash && (!run || (st.uptime ?? 0) < 180);
		let cls = run ? 'on' : 'off', icon = run ? 'shield' : 'stop', title, sub = [];

		if (!st.profile_count) {
			title = _('还没有订阅，mihomo 未启动');
			sub.push(E('a', { 'href': L.url('admin/services/mihomo/subscriptions') }, _('去添加订阅 ›')));
		}
		else if (run) {
			title = [ _('代理运行中'), cm.chip(st.active_name || '-', '', 'cloud') ];
			sub.push(E('span', {}, [ cm.icon('clock'), ' ', mihomo.duration(st.uptime) ]));
			sub.push(E('span', {}, [ cm.icon('chip'), ' ', _('内存 %s').format(mihomo.bytes(st.rss)) ]));
			sub.push(E('span', {}, 'mihomo ' + (st.version || '')));
		}
		else {
			if (crashing) {
				cls = 'bad';
				icon = 'alert';
			}
			title = crashing ? _('mihomo 启动失败') : _('代理已停止');
			sub.push(E('span', {}, crashing ? _('局域网设备现在不经过代理') : _('局域网设备直接上网，不经过代理')));
		}

		const seg = E('div', { 'class': 'mo-seg', 'role': 'radiogroup', 'aria-label': _('代理模式') }, MODES.map((m) => E('button', {
			'type': 'button',
			'class': st.mode == m[0] ? 'on' : '',
			'disabled': run ? null : '',
			'click': ui.createHandlerFn(this, () => st.mode == m[0] ? null
				: this.act(mihomo.api('PATCH', '/configs', { mode: m[0] }), _('已切换为%s模式').format(m[1])))
		}, m[1])));

		const ctl = [];

		if (st.profile_count) {
			if (run) {
				ctl.push(cm.button('cbi-button-neutral', _('重启'), () => this.act(mihomo.service('restart')), 'refresh'));
				ctl.push(cm.button('cbi-button-negative', _('停止'), () =>
					cm.confirm(_('停止代理？'), _('停止后局域网设备直接上网，需要代理的网站会打不开。'), _('停止'))
						.then((yes) => yes ? this.act(mihomo.service('stop')) : null), 'stop'));
			}
			else {
				ctl.push(cm.button('cbi-button-action', _('启动'), () => this.act(mihomo.service('start')), 'play'));
			}
		}

		ctl.push(E('div', { 'class': 'cm-sw', 'style': 'flex-direction:row;gap:8px' }, [
			cm.toggle(st.enabled, (on) => this.act(mihomo.service(on ? 'enable' : 'disable'),
				on ? _('已设为开机自启') : _('已取消开机自启'))),
			E('span', { 'class': 'lbl' }, _('开机自启'))
		]));

		return E('div', { 'class': 'cm-card cm-hero mo-hero' }, [
			E('div', { 'class': 'state ' + cls }, cm.icon(icon)),
			E('div', { 'class': 'main' }, [
				E('div', { 'class': 'op' }, title),
				E('div', { 'class': 'line' }, sub)
			]),
			E('div', { 'class': 'side' }, [ run ? seg : '', E('div', { 'class': 'mo-ctl' }, ctl) ])
		]);
	},

	renderCrash: function(st) {
		const c = st.crash;

		if (!c || (st.running && (st.uptime ?? 0) >= 180))
			return '';

		return cm.strip('bad', 'alert', st.running ? _('mihomo 刚刚反复退出过（开机以来 %d 次）').format(c.count)
			: _('mihomo 起不来（开机以来退出 %d 次）').format(c.count),
			[ E('code', { 'style': 'word-break:break-all' }, c.msg), c.at ? ' · ' + c.at : '' ],
			E('a', { 'href': L.url('admin/services/mihomo/log') }, _('看日志 ›')));
	},

	/* ---------- numbers ---------- */

	renderStats: function(st) {
		if (!st.running)
			return '';

		const now = Date.now();
		let up = 0, down = 0;

		if (this.last && st.upload_total >= this.last.up) {
			const dt = (now - this.last.t) / 1000;
			up = (st.upload_total - this.last.up) / dt;
			down = (st.download_total - this.last.down) / dt;
		}
		this.last = { t: now, up: st.upload_total, down: st.download_total };

		return E('div', { 'class': 'cm-grid' }, [
			cm.stat('down', _('下载'), mihomo.speed(down), _('累计 %s').format(mihomo.bytes(st.download_total)), 'dl'),
			cm.stat('up', _('上传'), mihomo.speed(up), _('累计 %s').format(mihomo.bytes(st.upload_total)), 'ul'),
			cm.stat('link', _('活动连接'), String(st.connections ?? '—'),
				E('a', { 'href': L.url('admin/services/mihomo/connections') }, _('查看 ›'))),
			cm.stat('globe', _('代理端口'), st.mixed_port ? String(st.mixed_port) : '—',
				st.tun ? _('TUN 已接管局域网') : _('TUN 未开启'))
		]);
	},

	/* ---------- the active subscription ---------- */

	renderSub: function(st) {
		const p = (st.providers || []).filter((x) => x.vehicle == 'HTTP')[0];

		if (!st.running || !p)
			return '';

		const info = p.info || {};
		const used = (info.Upload || 0) + (info.Download || 0);
		const total = info.Total || 0;
		const pct = total ? Math.min(100, used / total * 100) : null;
		const color = cm.usageColor(pct, 80);

		return E('div', {}, [
			cm.heading('cloud', _('当前订阅'), E('a', { 'href': L.url('admin/services/mihomo/subscriptions') }, _('管理订阅 ›'))),
			E('div', { 'class': 'cm-card mo-sub' }, [
				E('div', { 'class': 'cm-toolbar', 'style': 'margin:0' }, [
					E('div', { 'class': 'grow' }, [
						E('div', { 'class': 'name' }, [ st.active_name || p.name, cm.chip(_('%d 个节点').format(p.count)) ]),
						E('div', { 'class': 'cm-muted', 'style': 'margin-top:4px' }, [
							_('更新于 %s').format(mihomo.datetime(p.updated)),
							info.Expire ? ' · ' + _('到期 %s').format(mihomo.datetime(info.Expire)) : ''
						])
					]),
					cm.button('cbi-button-neutral', _('更新订阅'), () => this.act(callProfileUpdate(), _('订阅已更新')), 'refresh')
				]),
				total ? E('div', {}, [
					cm.usageBar({ pct: pct, warn_pct: 80, limit: total }),
					E('div', { 'class': 'cm-muted' }, [ E('b', { 'style': 'color:' + color }, mihomo.bytes(used)), ' / ', mihomo.bytes(total),
						' · ', _('剩余 %s').format(mihomo.bytes(Math.max(0, total - used))) ])
				]) : ''
			])
		]);
	},

	/* ---------- core + GEO ---------- */

	renderJob: function(u) {
		const j = u?.job;

		if (!j)
			return '';

		if (j.state == 'running' || u.busy)
			return cm.strip('info', 'refresh', [ E('span', { 'class': 'cm-spin-i' }), j.msg || _('正在处理…') ],
				_('下载走 mihomo 自己的代理，大文件可能要一两分钟；可以离开本页，后台会继续。'));

		/* results stay visible for 2 minutes */
		if (Date.now() / 1000 - (j.at || 0) > 120)
			return '';

		return j.state == 'ok' ? cm.strip('ok', 'check', j.msg) : cm.strip('bad', 'x', j.msg);
	},

	renderUpdates: function() {
		const u = this.upd;

		if (!u)
			return '';

		const busy = u.busy || u.job?.state == 'running';
		const core = u.core || {};
		const latest = core.latest?.version;
		const hasNew = latest && newer(latest, core.version);
		const lock = (b) => { if (busy) b.disabled = true; return b; };

		const coreTags = [];
		if (latest && !hasNew)
			coreTags.push(cm.tag('ok', _('已是最新'), 'check'));
		if (hasNew)
			coreTags.push(cm.tag('warn', _('有新版本 %s').format(latest)));

		const coreCtl = [ lock(cm.button('cbi-button-neutral', _('检查更新'), () => this.startJob('core-check', undefined, _('正在查询最新版本')), 'search')) ];
		if (hasNew)
			coreCtl.push(lock(cm.button('cbi-button-action', _('更新到 %s').format(latest), () =>
				cm.confirm(_('更新 mihomo 内核到 %s？').format(latest),
					_('下载约 20 MB，校验通过后替换并重启 mihomo（代理中断几秒）；新内核起不来会自动回滚。'), _('更新'), 'cbi-button-action')
					.then((yes) => yes ? this.startJob('core', latest, _('正在下载 mihomo %s').format(latest)) : null), 'up')));
		if (core.prev)
			coreCtl.push(lock(cm.button('cbi-button-neutral', _('回滚到 %s').format(core.prev), () =>
				cm.confirm(_('回滚到 %s？').format(core.prev), _('换回上一个内核并重启 mihomo，代理中断几秒。'), _('回滚'), 'cbi-button-action')
					.then((yes) => yes ? this.startJob('core-rollback', undefined, _('正在回滚')) : null), 'rollback')));

		const newestGeo = Math.max(0, ...(u.geo || []).map((g) => g.mtime || 0));

		return E('div', {}, [
			cm.heading('database', _('内核与规则数据')),
			this.renderJob(u),
			E('div', { 'class': 'cm-card mo-rows' }, [
				E('div', { 'class': 'mo-row' }, [
					E('div', { 'class': 'lead' }, cm.icon('chip')),
					E('div', { 'class': 'main' }, [
						E('div', { 'class': 't' }, [ _('mihomo 内核'), cm.chip(core.version || '—', 'nr') ].concat(coreTags)),
						E('div', { 'class': 'd' }, core.latest?.checked ? _('上次检查 %s').format(ago(core.latest.checked)) : _('还没检查过更新'))
					]),
					E('div', { 'class': 'ctl' }, coreCtl)
				])
			].concat((u.geo || []).map((g) => E('div', { 'class': 'mo-row' }, [
				E('div', { 'class': 'lead' }, cm.icon(g.file.indexOf('ip') >= 0 ? 'globe' : 'list')),
				E('div', { 'class': 'main' }, [
					E('div', { 'class': 't' }, [ g.label, cm.chip(g.file) ]),
					E('div', { 'class': 'd' }, g.size ? _('%s · 更新于 %s（%s）').format(mihomo.bytes(g.size), mihomo.datetime(g.mtime), ago(g.mtime))
						: _('缺失：mihomo 启动时会用固件自带的那份'))
				])
			]))).concat([
				E('div', { 'class': 'mo-row' }, [
					E('div', { 'class': 'main cm-muted' }, u.geo_auto ? _('mihomo 每 %d 小时自动更新一次 GEO 数据库').format(u.geo_interval || 24)
						: _('GEO 数据库不会自动更新')),
					E('div', { 'class': 'ctl' }, lock(cm.button('cbi-button-action', _('更新 GEO 数据库'),
						() => this.startJob('geo', undefined, _('正在下载 GEO 数据库')), 'refresh',
						newestGeo ? _('当前数据：%s').format(ago(newestGeo)) : null)))
				])
			]))
		]);
	},

	update: function(st) {
		this.st = st;

		dom.content(this.root, [
			this.renderCrash(st),
			this.renderHero(st),
			this.renderStats(st),
			this.renderSub(st),
			this.renderUpdates()
		]);
	},

	render: function(r) {
		const st = r[0];

		if (st && st.__err)
			return mihomo.loadError(st.__err);

		mihomo.injectStyle();
		this.upd = r[1];
		this.updAt = Date.now();
		this.root = E('div');
		this.update(st);
		poll.add(L.bind(this.refresh, this), 3);

		return E('div', {}, [
			E('style', {}, cm.CSS + CSS),
			E('h2', {}, 'Mihomo'),
			E('div', { 'class': 'cbi-map-descr' }, _('mihomo（Clash.Meta）透明代理，局域网设备经 TUN 自动接管。')),
			this.root
		]);
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
