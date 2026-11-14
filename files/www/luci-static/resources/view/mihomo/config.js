'use strict';
'require view';
'require ui';
'require mihomo.common as mihomo';

return view.extend({
	load: function() {
		return mihomo.getConfig()
			.catch(function(err) { return { __err: err } });
	},

	showResult: function(ok, output) {
		this.result.style.display = '';
		this.result.className = 'alert-message ' + (ok ? 'success' : 'error');
		this.result.querySelector('pre').textContent = output || (ok ? _('校验通过') : _('校验失败'));
	},

	check: function() {
		return mihomo.setConfig(this.textarea.value, true).then(L.bind(function(res) {
			this.showResult(res.ok, res.output);
		}, this)).catch(mihomo.notifyError);
	},

	save: function() {
		return mihomo.setConfig(this.textarea.value, false).then(L.bind(function(res) {
			this.showResult(res.ok, res.output);
			if (!res.ok)
				return;

			this.saved = this.textarea.value;
			return mihomo.service('restart').then(function() {
				ui.addNotification(null, E('p', {}, _('配置已保存，mihomo 已重启')), 'info');
			});
		}, this)).catch(mihomo.notifyError);
	},

	reset: function() {
		if (this.textarea.value !== this.saved && !confirm(_('放弃未保存的修改？')))
			return;
		this.textarea.value = this.saved;
		this.result.style.display = 'none';
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

	renderPage: function(content) {
		mihomo.injectStyle();
		this.saved = content;

		this.textarea = E('textarea', {
			'class': 'mh-mono cbi-input-textarea',
			'rows': 32,
			'spellcheck': 'false',
			'wrap': 'off'
		});
		this.textarea.value = content;

		/* insert a tab-equivalent of two spaces instead of leaving the field */
		this.textarea.addEventListener('keydown', function(ev) {
			if (ev.key !== 'Tab' || ev.shiftKey) return;
			ev.preventDefault();
			const t = ev.target, s = t.selectionStart;
			t.setRangeText('  ', s, t.selectionEnd, 'end');
		});

		this.result = E('div', { 'class': 'alert-message', 'style': 'display:none' },
			E('pre', { 'style': 'white-space:pre-wrap; margin:0; font-size:12px' }));

		return E('div', {}, [
			E('h2', {}, _('配置模板')),
			E('div', { 'class': 'cbi-map-descr' },
				_('编辑 /etc/mihomo/template.yaml（分流规则、DNS、TUN 等）。订阅链接等占位符（<code>__SUBSCRIPTION_URL__</code> 等）由当前订阅自动填充，请勿删除。保存前会用当前订阅渲染后经 <code>mihomo -t</code> 校验，校验失败不会写入。')),
			E('div', { 'class': 'cbi-section' }, [
				this.textarea,
				this.result,
				E('div', { 'class': 'mh-actions' }, [
					mihomo.button('cbi-button-neutral', _('仅校验'), () => this.check(), 'check'),
					mihomo.button('cbi-button-reset', _('还原'), () => this.reset(), 'rollback'),
					E('span', { 'style': 'flex:1' }),
					mihomo.button('cbi-button-positive', _('校验并保存、重启'), () => this.save(), 'check')
				])
			])
		]);
	},

	handleSave: null,
	handleSaveApply: null,
	handleReset: null
});
