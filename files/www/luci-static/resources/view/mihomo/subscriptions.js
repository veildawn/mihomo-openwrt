'use strict';
'require view';
'require rpc';
'require ui';
'require dom';
'require poll';
'require mihomo.common as mihomo';

const callProfiles = rpc.declare({ object: 'luci.mihomo', method: 'profiles' });
const callSave = rpc.declare({ object: 'luci.mihomo', method: 'profile_save', params: [ 'id', 'name', 'url', 'user_agent', 'interval' ] });
const callDelete = rpc.declare({ object: 'luci.mihomo', method: 'profile_delete', params: [ 'id' ] });
const callActivate = rpc.declare({ object: 'luci.mihomo', method: 'profile_activate', params: [ 'id' ] });
const callUpdate = rpc.declare({ object: 'luci.mihomo', method: 'profile_update' });

/* 24x24 stroke icons, drawn for this app */
const ICONS = {
	cloud: 'M7 18.5h10.5a4 4 0 00.6-7.96A6 6 0 006.4 9.1 4.75 4.75 0 007 18.5z',
	check: 'M5 12.5l4.5 4.5L19 7.5',
	plus: 'M12 5v14M5 12h14',
	refresh: 'M19.5 12a7.5 7.5 0 11-2.2-5.3M19.5 4.5v4h-4',
	edit: 'M4.5 19.5h4l10-10a2.8 2.8 0 00-4-4l-10 10z',
	trash: 'M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13',
	swap: 'M7 7h11l-3-3M17 17H6l3 3',
	eye: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z'
};

const CSS = `
.ms-ico { display: inline-flex; vertical-align: middle; line-height: 0; }
.ms-ico svg { width: 1em; height: 1em; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ms-list { border: 1px solid rgba(128,128,128,.22); border-radius: 10px; overflow: hidden; }
.ms-row { display: flex; align-items: center; gap: 12px; padding: 14px; border-top: 1px solid rgba(128,128,128,.15); flex-wrap: wrap; }
.ms-row:first-child { border-top: 0; }
.ms-row.on { background: rgba(22,163,74,.07); }
.ms-lead { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; background: rgba(128,128,128,.12); flex: none; }
.ms-row.on .ms-lead { background: rgba(22,163,74,.15); color: #16a34a; }
.ms-main { flex: 1; min-width: 200px; }
.ms-name { font-weight: 600; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ms-meta { font-size: 12px; opacity: .65; margin-top: 4px; word-break: break-all; }
.ms-ctl { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.ms-ctl .btn .ms-ico { margin-right: 4px; }
.ms-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; background: rgba(22,163,74,.14); color: #15803d; }
.ms-bar { height: 6px; border-radius: 3px; background: rgba(128,128,128,.2); overflow: hidden; margin-top: 6px; max-width: 320px; }
.ms-bar i { display: block; height: 100%; background: #2563eb; }
.ms-empty { text-align: center; padding: 40px 16px; }
.ms-empty > .ms-ico { font-size: 44px; opacity: .4; }
.ms-empty .t { font-weight: 600; margin: 8px 0 4px; }
.ms-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.ms-toolbar .grow { flex: 1; opacity: .7; font-size: 13px; }
.ms-form { display: grid; gap: 14px; }
.ms-form label { display: block; font-weight: 600; font-size: 13px; margin-bottom: 5px; }
.ms-form input { width: 100%; box-sizing: border-box; }
.ms-form .hint { font-size: 12px; opacity: .65; margin-top: 4px; }
.ms-adv summary { cursor: pointer; opacity: .8; }
`;

function icon(name) {
	const s = E('span', { 'class': 'ms-ico' });
	s.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICONS[name] + '"/></svg>';
	return s;
}

function button(cls, label, ic, fn) {
	return E('button', { 'class': 'btn cbi-button ' + cls, 'click': ui.createHandlerFn(null, fn) }, [ ic ? icon(ic) : '', label ]);
}

/* show scheme://host/…  so the token part of the link is not on screen */
function maskUrl(u) {
	const m = /^(https?:\/\/[^\/?#]+)(.*)$/.exec(u || '');
	return m ? m[1] + (m[2].length > 1 ? '/…' : '') : u;
}

function row(title, input, hint) {
	return E('div', {}, [ E('label', {}, title), input, hint ? E('div', { 'class': 'hint' }, hint) : '' ]);
}

return view.extend({
	load: function() {
		return Promise.all([ callProfiles(), mihomo.status() ]).catch(function(err) { return { __err: err } });
	},

	refresh: function() {
		return Promise.all([ callProfiles(), mihomo.status() ]).then(L.bind(this.update, this));
	},

	result: function(res, okMsg) {
		if (!res || !res.ok) {
			mihomo.notifyError((res && res.output) || _('操作失败'));
			return false;
		}
		if (okMsg)
			ui.addNotification(null, E('p', okMsg), 'info');
		return true;
	},

	edit: function(p) {
		const name = E('input', { 'class': 'cbi-input-text', 'value': p ? p.name : '', 'maxlength': 48, 'placeholder': _('例如：机场 A') });
		const url = E('input', { 'class': 'cbi-input-text', 'value': p ? p.url : '', 'placeholder': 'https://…' });
		const ua = E('input', { 'class': 'cbi-input-text', 'value': p ? p.user_agent : '', 'placeholder': 'clash-verge/v2.4.2' });
		const interval = E('input', { 'class': 'cbi-input-text', 'type': 'number', 'min': 5, 'max': 10080,
			'value': p ? Math.round(p.interval / 60) : 60, 'style': 'max-width:140px' });

		const save = () => callSave(p ? p.id : '', name.value, url.value, ua.value, Math.round(+interval.value * 60)).then((res) => {
			if (!this.result(res, res && res.activated ? _('已添加并启用订阅，mihomo 正在启动') : _('订阅已保存'))) return;
			ui.hideModal();
			return this.refresh();
		}).catch(mihomo.notifyError);

		ui.showModal(p ? _('编辑订阅') : _('添加订阅'), [
			E('div', { 'class': 'ms-form' }, [
				row(_('名称'), name),
				row(_('订阅链接'), url, _('机场提供的 Clash / Mihomo 订阅地址。节点会套用本机的分流规则模板。')),
				E('details', { 'class': 'ms-adv' }, [
					E('summary', {}, _('高级')),
					E('div', { 'class': 'ms-form', 'style': 'margin-top:12px' }, [
						row(_('User-Agent'), ua, _('部分机场按 UA 返回不同格式，留空使用 clash-verge/v2.4.2')),
						row(_('自动更新间隔（分钟）'), interval)
					])
				])
			]),
			E('div', { 'class': 'right', 'style': 'margin-top:16px' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('取消')), ' ',
				E('button', { 'class': 'btn cbi-button-action', 'click': ui.createHandlerFn(this, save) }, _('保存'))
			])
		]);

		(p ? url : name).focus();
	},

	renderList: function(data, st) {
		const list = data.profiles || [];

		if (!list.length)
			return E('div', { 'class': 'ms-empty' }, [
				icon('cloud'),
				E('div', { 'class': 't' }, _('还没有订阅')),
				E('div', { 'style': 'opacity:.7;font-size:13px' }, _('添加一个机场订阅后 mihomo 会自动启动。')),
				E('div', { 'style': 'margin-top:14px' }, button('cbi-button-action', _('添加订阅'), 'plus', () => this.edit(null)))
			]);

		return E('div', { 'class': 'ms-list' }, list.map((p) => {
			const on = p.id == data.active;
			const meta = [ maskUrl(p.url), _('每 %d 分钟更新').format(Math.round(p.interval / 60)) ];
			let extra = '';

			if (on && data.provider) {
				meta.push(_('%d 个节点').format(data.provider.count));
				if (data.provider.updated)
					meta.push(_('更新于 %s').format(mihomo.datetime(data.provider.updated)));

				const info = data.provider.info;
				if (info && info.Total) {
					const used = (info.Upload || 0) + (info.Download || 0);
					const pct = Math.min(100, used / info.Total * 100);
					extra = E('div', {}, [
						E('div', { 'class': 'ms-meta' }, _('流量 %s / %s%s').format(mihomo.bytes(used), mihomo.bytes(info.Total),
							info.Expire ? ' · ' + _('到期 %s').format(mihomo.datetime(info.Expire)) : '')),
						E('div', { 'class': 'ms-bar' }, E('i', { 'style': 'width:' + pct.toFixed(1) + '%' }))
					]);
				}
			}

			return E('div', { 'class': 'ms-row' + (on ? ' on' : '') }, [
				E('div', { 'class': 'ms-lead' }, icon(on ? 'check' : 'cloud')),
				E('div', { 'class': 'ms-main' }, [
					E('div', { 'class': 'ms-name' }, [ p.name, on ? E('span', { 'class': 'ms-tag' }, [ icon('check'), _('使用中') ]) : '' ]),
					E('div', { 'class': 'ms-meta' }, meta.join(' · ')),
					extra
				]),
				E('div', { 'class': 'ms-ctl' }, [
					on
						? button('cbi-button-neutral', _('更新'), 'refresh', () => callUpdate().then((r) => this.result(r, _('订阅已更新')) && this.refresh()))
						: button('cbi-button-action', _('切换到此订阅'), 'swap', () => callActivate(p.id).then((r) => this.result(r, _('已切换到 %s，mihomo 已重启').format(p.name)) && this.refresh())),
					button('cbi-button-neutral', _('编辑'), 'edit', () => this.edit(p)),
					button('cbi-button-remove', _('删除'), 'trash', () => {
						if (!confirm(on && list.length > 1 ? _('删除正在使用的订阅 %s？将自动切换到下一个订阅。').format(p.name)
							: on ? _('删除唯一的订阅 %s？mihomo 将停止。').format(p.name) : _('删除订阅 %s？').format(p.name)))
							return;
						return callDelete(p.id).then((r) => this.result(r, _('已删除')) && this.refresh());
					})
				])
			]);
		}));
	},

	update: function(res) {
		const data = res[0], st = res[1];
		dom.content(this.list, this.renderList(data, st));
		dom.content(this.state, st && st.running
			? _('mihomo 运行中 · 当前订阅：%s').format(st.active_name || '-')
			: (data.profiles || []).length ? _('mihomo 未运行') : _('添加订阅后 mihomo 会自动启动'));
	},

	render: function(res) {
		if (res && res.__err)
			return mihomo.loadError(res.__err);

		mihomo.injectStyle();
		this.list = E('div');
		this.state = E('div', { 'class': 'grow' });

		const root = E('div', {}, [
			E('style', {}, CSS),
			E('h2', {}, _('订阅')),
			E('div', { 'class': 'cbi-map-descr' }, _('管理机场订阅。可以保存多个，随时切换当前使用的订阅；节点套用"配置模板"里的分流规则。')),
			E('div', { 'class': 'ms-toolbar' }, [ this.state, button('cbi-button-add', _('添加订阅'), 'plus', () => this.edit(null)) ]),
			this.list
		]);

		this.update(res);
		poll.add(L.bind(this.refresh, this), 10);

		return root;
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
