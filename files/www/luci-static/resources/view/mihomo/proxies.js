'use strict';
'require view';
'require ui';
'require dom';
'require mihomo.common as mihomo';

const TEST_URL = 'https://www.gstatic.com/generate_204';
const TYPES = {
	Selector: _('手动'), URLTest: _('自动'), Fallback: _('故障转移'),
	LoadBalance: _('负载均衡'), Relay: _('链式')
};

return view.extend({
	proxies: {},
	delays: {},

	load: function() {
		return mihomo.api('GET', '/proxies').catch(function(err) {
			mihomo.notifyError(err);
			return { proxies: {} };
		})
			.catch(function(err) { return { __err: err } });
	},

	groups: function() {
		const p = this.proxies;
		const order = (p.GLOBAL && p.GLOBAL.all) || [];
		const names = order.filter(function(n) { return p[n] && p[n].all });

		Object.keys(p).forEach(function(n) {
			if (p[n].all && n !== 'GLOBAL' && names.indexOf(n) < 0)
				names.push(n);
		});

		return names.filter(function(n) { return !p[n].hidden });
	},

	delayOf: function(name) {
		if (this.delays[name] != null)
			return this.delays[name];

		const h = this.proxies[name] && this.proxies[name].history;
		return (h && h.length) ? h[h.length - 1].delay : 0;
	},

	select: function(group, node) {
		return mihomo.api('PUT', '/proxies/' + encodeURIComponent(group), { name: node })
			.then(L.bind(this.reload, this))
			.catch(mihomo.notifyError);
	},

	testGroup: function(group) {
		const g = this.proxies[group];
		const url = (g && g.testUrl) || TEST_URL;
		const path = '/group/%s/delay?url=%s&timeout=5000'.format(encodeURIComponent(group), encodeURIComponent(url));

		return mihomo.api('GET', path).then(L.bind(function(res) {
			for (const n in res)
				this.delays[n] = res[n];
			/* nodes that timed out are missing from the reply */
			(g.all || []).forEach(L.bind(function(n) {
				if (res[n] == null && !(this.proxies[n] && this.proxies[n].all))
					this.delays[n] = 0;
			}, this));
			return this.reload();
		}, this)).catch(mihomo.notifyError);
	},

	testAll: function() {
		return Promise.all(this.groups().map(L.bind(this.testGroup, this)));
	},

	reload: function() {
		return mihomo.api('GET', '/proxies').then(L.bind(function(res) {
			this.proxies = res.proxies || {};
			dom.content(this.root, this.renderGroups());
		}, this));
	},

	renderGroups: function() {
		const names = this.groups();
		if (!names.length)
			return E('p', { 'class': 'cbi-section-descr' }, _('没有代理组，mihomo 是否在运行？'));

		return names.map(L.bind(function(gname) {
			const g = this.proxies[gname];
			const selectable = g.type === 'Selector';

			const nodes = (g.all || []).map(L.bind(function(n) {
				const d = this.delayOf(n);
				const attrs = {
					'class': 'mh-node' + (n === g.now ? ' sel' : '') + (selectable ? ' click' : ''),
					'title': n
				};
				if (selectable && n !== g.now)
					attrs.click = ui.createHandlerFn(this, 'select', gname, n);

				return E('div', attrs, [
					E('span', { 'class': 'n' }, '%h'.format(n)),
					E('span', { 'class': 'd ' + mihomo.delayClass(d) }, mihomo.delayText(d))
				]);
			}, this));

			return E('div', { 'class': 'mh-group' }, [
				E('div', { 'class': 'mh-group-head' }, [
					E('span', { 'class': 'name' }, '%h'.format(gname)),
					E('span', { 'class': 'mh-badge' }, '%h'.format(TYPES[g.type] || g.type)),
					E('span', { 'class': 'now' }, '%h'.format(g.now ? '→ ' + g.now : '')),
					mihomo.button('cbi-button-neutral', _('测速'), () => this.testGroup(gname), 'speed')
				]),
				E('div', { 'class': 'mh-nodes' }, nodes)
			]);
		}, this));
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
		this.proxies = (res && res.proxies) || {};
		this.root = E('div', {}, this.renderGroups());

		return E('div', {}, [
			E('h2', {}, _('代理')),
			E('div', { 'class': 'cbi-map-descr' }, _('点击「手动」组中的节点即可切换；「自动」组按延迟自动选择。')),
			E('div', { 'class': 'mh-actions' }, [
				mihomo.button('cbi-button-action', _('全部测速'), () => this.testAll(), 'speed'),
				mihomo.button('cbi-button-neutral', _('刷新'), () => this.reload(), 'refresh')
			]),
			E('div', { 'class': 'cbi-section' }, this.root)
		]);
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
