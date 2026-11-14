'use strict';
'require baseclass';
'require rpc';
'require ui';
'require view.cellular.common as cm';

const callStatus = rpc.declare({ object: 'luci.mihomo', method: 'status' });
const callService = rpc.declare({ object: 'luci.mihomo', method: 'service', params: [ 'action' ] });
const callApi = rpc.declare({ object: 'luci.mihomo', method: 'api', params: [ 'method', 'path', 'body' ] });
const callGetConfig = rpc.declare({ object: 'luci.mihomo', method: 'get_config', expect: { content: '' } });
const callSetConfig = rpc.declare({ object: 'luci.mihomo', method: 'set_config', params: [ 'content', 'test_only' ] });
const callLog = rpc.declare({ object: 'luci.mihomo', method: 'log', params: [ 'lines' ], expect: { log: '' } });

const CSS = `
.mh-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:10px; margin:0 0 1em; }
.mh-card { border:1px solid rgba(128,128,128,.3); border-radius:6px; padding:10px 12px; min-width:0; }
.mh-card .k { font-size:12px; opacity:.7; }
.mh-card .v { font-size:18px; font-weight:600; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mh-actions { display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin:.5em 0 1em; }
.mh-actions .cbi-button { margin:0; }
.mh-group { border:1px solid rgba(128,128,128,.3); border-radius:6px; padding:10px 12px; margin-bottom:12px; }
.mh-group-head { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:8px; }
.mh-group-head .name { font-weight:600; font-size:15px; }
.mh-group-head .now { opacity:.75; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.mh-nodes { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:6px; }
.mh-node { border:1px solid rgba(128,128,128,.3); border-radius:5px; padding:6px 8px; display:flex; justify-content:space-between; gap:6px; font-size:13px; }
.mh-node.sel { border-color:#2a7ae2; box-shadow:inset 3px 0 0 #2a7ae2; }
.mh-node.click { cursor:pointer; }
.mh-node.click:hover { background:rgba(42,122,226,.08); }
.mh-node .n { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
.mh-node .d { flex:none; font-variant-numeric:tabular-nums; }
.mh-d-good { color:#3a9a4a; } .mh-d-ok { color:#d08a00; } .mh-d-bad { color:#d9534f; } .mh-d-none { opacity:.5; }
.mh-badge { font-size:11px; padding:1px 6px; border-radius:3px; border:1px solid rgba(128,128,128,.4); opacity:.8; }
.mh-mono { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:12px; width:100%; box-sizing:border-box; }
.mh-table-wrap { overflow-x:auto; }
.mh-table-wrap td { word-break:break-all; }
`;

return baseclass.extend({
	status: callStatus,
	service: callService,
	getConfig: callGetConfig,
	setConfig: callSetConfig,
	log: callLog,

	/* call the mihomo controller through rpcd; rejects on non-2xx */
	api: function(method, path, body) {
		/* ubus rejects null for typed args, so leave body out entirely when unused */
		return callApi(method, path, body != null ? JSON.stringify(body) : undefined).then(function(res) {
			if (!res || res.status < 200 || res.status >= 300) {
				const msg = (res && res.data && (res.data.message || res.data)) || _('请求失败');
				throw new Error('%s (HTTP %s)'.format(msg, res ? res.status : '?'));
			}
			return res.data;
		});
	},

	/* also loads the shared component styles (icons, cards, strips) */
	injectStyle: function() {
		if (!document.getElementById('mihomo-css'))
			document.head.appendChild(E('style', { id: 'mihomo-css' }, cm.CSS + CSS));
	},

	/* toolbar button with a drawn icon, same look as the router's other pages */
	button: function(cls, label, fn, icon, title) {
		return cm.button(cls, label, fn, icon, title);
	},

	/* LuCI leaves the "Loading view…" spinner up when load() rejects, so render the error in-page instead */
	loadError: function(err) {
		return E('div', {}, [
			E('h2', {}, 'Mihomo'),
			E('div', { 'class': 'alert-message error' }, [
				E('p', {}, E('strong', {}, _('页面加载失败'))),
				E('pre', { 'style': 'white-space:pre-wrap' }, '%h'.format(err && err.message ? err.message : String(err)))
			])
		]);
	},

	notifyError: function(err) {
		ui.addNotification(null, E('p', {}, '%h'.format(err && err.message ? err.message : String(err))), 'danger');
	},

	bytes: function(n) {
		if (n == null || isNaN(n)) return '-';
		return '%1024.2mB'.format(n);
	},

	speed: function(n) {
		return '%1024.1mB/s'.format(Math.max(0, n || 0));
	},

	duration: function(s) {
		if (s == null || isNaN(s)) return '-';
		s = Math.floor(s);
		const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
		if (d) return _('%d天 %d小时').format(d, h);
		if (h) return _('%d小时 %d分').format(h, m);
		if (m) return _('%d分 %d秒').format(m, s % 60);
		return _('%d秒').format(s);
	},

	datetime: function(v) {
		const d = (typeof v === 'number') ? new Date(v * 1000) : new Date(v);
		if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '-';
		const p = function(x) { return String(x).padStart(2, '0') };
		return '%s-%s-%s %s:%s'.format(d.getFullYear(), p(d.getMonth() + 1), p(d.getDate()), p(d.getHours()), p(d.getMinutes()));
	},

	delayClass: function(ms) {
		if (!ms) return 'mh-d-none';
		if (ms < 300) return 'mh-d-good';
		if (ms < 800) return 'mh-d-ok';
		return 'mh-d-bad';
	},

	delayText: function(ms) {
		return ms ? ms + 'ms' : '-';
	}
});
