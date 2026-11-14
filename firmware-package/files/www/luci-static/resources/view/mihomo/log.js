'use strict';
'require view';
'require poll';
'require ui';
'require mihomo.common as mihomo';

const LEVELS = [ 'debug', 'info', 'warning', 'error', 'silent' ];

/* logread line -> "MM-DD HH:MM:SS level message" */
function tidy(line) {
	const m = line.match(/^\w+ (\w+ +\d+ [\d:]+) \d+ [^:]+: (?:time="[^"]*" )?(?:level=(\w+) )?(?:msg=)?(.*)$/);
	if (!m) return line;
	let msg = m[3];
	if (msg.charAt(0) === '"' && msg.slice(-1) === '"')
		msg = msg.slice(1, -1).replace(/\\"/g, '"');
	return m[1] + '  ' + (m[2] || 'info').padEnd(7) + ' ' + msg;
}

return view.extend({
	load: function() {
		return Promise.all([ mihomo.log(300), mihomo.status() ])
			.catch(function(err) { return { __err: err } });
	},

	show: function(text) {
		const ta = this.textarea;
		const atBottom = ta.scrollTop + ta.clientHeight >= ta.scrollHeight - 20;
		ta.value = text.split('\n').filter(Boolean).map(tidy).join('\n') || _('暂无日志');
		if (atBottom)
			ta.scrollTop = ta.scrollHeight;
	},

	fetch: function() {
		return mihomo.log(300).then(L.bind(this.show, this));
	},

	setLevel: function(level) {
		return mihomo.api('PATCH', '/configs', { 'log-level': level })
			.then(function() {
				ui.addNotification(null, E('p', {}, _('日志级别已临时设为 %h（重启后恢复配置文件中的值）').format(level)), 'info');
			})
			.catch(mihomo.notifyError);
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

	renderPage: function(data) {
		mihomo.injectStyle();
		const st = data[1] || {};

		this.textarea = E('textarea', {
			'class': 'mh-mono cbi-input-textarea', 'rows': 32, 'readonly': 'readonly', 'wrap': 'off'
		});

		const level = E('select', {
			'class': 'cbi-input-select',
			'disabled': st.running ? null : 'disabled',
			'change': ui.createHandlerFn(this, function(ev) { return this.setLevel(ev.target.value) })
		}, LEVELS.map(function(l) {
			return E('option', { 'value': l, 'selected': l === st.log_level ? 'selected' : null }, l);
		}));

		const auto = E('input', { 'type': 'checkbox', 'checked': 'checked', 'id': 'mh-log-auto' });

		const node = E('div', {}, [
			E('h2', {}, _('日志')),
			E('div', { 'class': 'mh-actions' }, [
				E('label', {}, _('日志级别') + ' '), level,
				E('span', { 'style': 'flex:1' }),
				auto, E('label', { 'for': 'mh-log-auto' }, _('自动刷新')),
				mihomo.button('cbi-button-neutral', _('刷新'), () => this.fetch(), 'refresh')
			]),
			E('div', { 'class': 'cbi-section' }, this.textarea)
		]);

		this.show(data[0] || '');
		requestAnimationFrame(L.bind(function() { this.textarea.scrollTop = this.textarea.scrollHeight }, this));
		poll.add(L.bind(function() { return auto.checked ? this.fetch() : Promise.resolve() }, this), 5);

		return node;
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
