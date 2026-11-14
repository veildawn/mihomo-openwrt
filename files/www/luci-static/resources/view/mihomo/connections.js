'use strict';
'require view';
'require poll';
'require ui';
'require dom';
'require mihomo.common as mihomo';

return view.extend({
	conns: [],
	filter: '',
	paused: false,

	load: function() {
		return mihomo.api('GET', '/connections').catch(function() { return {} })
			.catch(function(err) { return { __err: err } });
	},

	fetch: function() {
		if (this.paused)
			return Promise.resolve();

		return mihomo.api('GET', '/connections').then(L.bind(function(res) {
			this.conns = (res && res.connections) || [];
			this.renderTable();
		}, this)).catch(function() {});
	},

	closeConn: function(id) {
		return mihomo.api('DELETE', '/connections/' + encodeURIComponent(id))
			.then(L.bind(this.fetch, this))
			.catch(mihomo.notifyError);
	},

	closeAll: function() {
		if (!confirm(_('关闭全部 %d 条连接？正在进行的下载、视频会中断后重连。').format(this.conns.length)))
			return;

		return mihomo.api('DELETE', '/connections')
			.then(L.bind(this.fetch, this))
			.catch(mihomo.notifyError);
	},

	target: function(m) {
		const host = m.host || m.sniffHost || m.destinationIP || '';
		const ip6 = host.indexOf(':') >= 0;
		return (ip6 ? '[' + host + ']' : host) + ':' + m.destinationPort;
	},

	renderTable: function() {
		const q = this.filter.toLowerCase();
		const now = Date.now();
		let list = this.conns.slice().sort(function(a, b) { return new Date(b.start) - new Date(a.start) });

		if (q)
			list = list.filter(L.bind(function(c) {
				const m = c.metadata || {};
				return [ this.target(m), m.sourceIP, c.rule, c.rulePayload, (c.chains || []).join(' ') ]
					.join(' ').toLowerCase().indexOf(q) >= 0;
			}, this));

		dom.content(this.countEl, _('%d 条连接').format(this.conns.length) +
			(q ? _('，匹配 %d 条').format(list.length) : ''));

		const rows = list.slice(0, 300).map(L.bind(function(c) {
			const m = c.metadata || {};
			const rule = c.rule + (c.rulePayload ? '(' + c.rulePayload + ')' : '');

			return E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td' }, '%h'.format(this.target(m))),
				E('td', { 'class': 'td' }, '%h'.format(m.network ? m.network.toUpperCase() : '-')),
				E('td', { 'class': 'td' }, '%h'.format(m.sourceIP || '-')),
				E('td', { 'class': 'td' }, '%h'.format(rule)),
				E('td', { 'class': 'td' }, '%h'.format((c.chains || []).slice().reverse().join(' → '))),
				E('td', { 'class': 'td', 'style': 'white-space:nowrap' },
					'↑ %s<br>↓ %s'.format(mihomo.bytes(c.upload), mihomo.bytes(c.download))),
				E('td', { 'class': 'td', 'style': 'white-space:nowrap' },
					mihomo.duration((now - new Date(c.start)) / 1000)),
				E('td', { 'class': 'td' }, mihomo.button('cbi-button-negative', '', () => this.closeConn(c.id), 'x', _('关闭这条连接')))
			]);
		}, this));

		dom.content(this.tbody, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('目标')),
				E('th', { 'class': 'th' }, _('类型')),
				E('th', { 'class': 'th' }, _('来源')),
				E('th', { 'class': 'th' }, _('规则')),
				E('th', { 'class': 'th' }, _('链路')),
				E('th', { 'class': 'th' }, _('流量')),
				E('th', { 'class': 'th' }, _('时长')),
				E('th', { 'class': 'th' }, '')
			])
		].concat(rows.length ? rows : [
			E('tr', { 'class': 'tr placeholder' }, E('td', { 'class': 'td' }, E('em', _('没有连接'))))
		]));
	},

	render: function(data) {
		try {
			if (data && data.__err)
				return mihomo.loadError(data.__err);
			return this.renderPage(data);
		}
		catch (e) {
			console.error(e);
			return mihomo.loadError(e);
		}
	},

	renderPage: function(res) {
		mihomo.injectStyle();
		this.conns = (res && res.connections) || [];
		this.countEl = E('span', { 'style': 'flex:1' });
		this.tbody = E('table', { 'class': 'table' });

		const pause = mihomo.button('cbi-button-neutral', _('暂停刷新'), () => {
			this.paused = !this.paused;
			pause.lastChild.textContent = this.paused ? _('继续刷新') : _('暂停刷新');
		}, 'stop');

		const node = E('div', {}, [
			E('h2', {}, _('连接')),
			E('div', { 'class': 'mh-actions' }, [
				E('input', {
					'type': 'search', 'class': 'cbi-input-text', 'placeholder': _('筛选：域名 / IP / 规则 / 节点'),
					'style': 'max-width:280px',
					'input': L.bind(function(ev) { this.filter = ev.target.value.trim(); this.renderTable(); }, this)
				}),
				this.countEl,
				pause,
				mihomo.button('cbi-button-negative', _('全部关闭'), () => this.closeAll(), 'x')
			]),
			E('div', { 'class': 'cbi-section mh-table-wrap' }, this.tbody)
		]);

		this.renderTable();
		poll.add(L.bind(this.fetch, this), 3);

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
