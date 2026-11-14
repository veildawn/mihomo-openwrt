'use strict';
'require baseclass';
'require rpc';
'require ui';

/*
 * Icons: drawn for this app on a 24x24 grid, 1.8 stroke, round caps.
 * Each entry is a list of SVG elements; 'p:' = path, 'c:' = circle cx,cy,r,
 * 'f:' = filled path.
 */
const ICONS = {
	tower: [ 'p:M12 11v10', 'p:M8.5 21h7', 'p:M9.6 21L12 11l2.4 10', 'c:12,9,1.6',
		'p:M8.2 5.6a5.2 5.2 0 000 6.8', 'p:M15.8 5.6a5.2 5.2 0 010 6.8',
		'p:M5.4 3.2a9 9 0 000 11.6', 'p:M18.6 3.2a9 9 0 010 11.6' ],
	sim: [ 'p:M8 3h6.6L19 7.4V20a1 1 0 01-1 1H8a1 1 0 01-1-1V4a1 1 0 011-1z', 'p:M9.8 11.2h6.4v6.6H9.8z',
		'p:M13 11.2v6.6', 'p:M9.8 14.5h6.4' ],
	plane: [ 'p:M10.2 4.3a1.8 1.8 0 013.6 0V9l7 4.3v2.1l-7-2v4.4l2.3 1.7V21L12 20l-4.1 1v-1.5l2.3-1.7v-4.4l-7 2v-2.1l7-4.3z' ],
	globe: [ 'c:12,12,8.6', 'p:M3.4 12h17.2', 'p:M12 3.4c2.4 2.4 3.6 5.3 3.6 8.6s-1.2 6.2-3.6 8.6',
		'p:M12 3.4C9.6 5.8 8.4 8.7 8.4 12s1.2 6.2 3.6 8.6' ],
	down: [ 'p:M12 4v11.5', 'p:M7.2 11l4.8 4.8 4.8-4.8', 'p:M5.5 20h13' ],
	up: [ 'p:M12 20V8.5', 'p:M7.2 13L12 8.2l4.8 4.8', 'p:M5.5 4h13' ],
	updown: [ 'p:M8 20V5', 'p:M4.5 8.5L8 5l3.5 3.5', 'p:M16 4v15', 'p:M12.5 15.5L16 19l3.5-3.5' ],
	clock: [ 'c:12,12,8.6', 'p:M12 7.5V12l3 2' ],
	chip: [ 'p:M7.5 7.5h9v9h-9z', 'p:M10.5 10.5h3v3h-3z', 'p:M10 3.5v4M14 3.5v4M10 16.5v4M14 16.5v4M3.5 10h4M3.5 14h4M16.5 10h4M16.5 14h4' ],
	temp: [ 'p:M10 14.2V5.5a2 2 0 014 0v8.7a4 4 0 11-4 0z', 'f:M12 15.2a2.3 2.3 0 110 4.6 2.3 2.3 0 010-4.6z', 'p:M12 9.5v6' ],
	swap: [ 'p:M7 3.8L3.6 7.2 7 10.6', 'p:M3.6 7.2h12.9a3.9 3.9 0 010 0', 'p:M17 13.4l3.4 3.4-3.4 3.4', 'p:M20.4 16.8H7.5' ],
	msg: [ 'p:M4 5.2h16a1 1 0 011 1v9.6a1 1 0 01-1 1H10l-4.6 3.7v-3.7H4a1 1 0 01-1-1V6.2a1 1 0 011-1z', 'f:M8.3 10a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zM12 10a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zM15.7 10a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z' ],
	send: [ 'p:M20.5 3.5L3.8 10.4l6.6 2.8 2.8 6.6z', 'p:M20.5 3.5l-10.1 9.7' ],
	reply: [ 'p:M9.5 6L4 11.2l5.5 5.2', 'p:M4 11.2h9.5a6.5 6.5 0 016.5 6.5v.8' ],
	trash: [ 'p:M4.5 6.8h15', 'p:M9.3 6.8V4.6h5.4v2.2', 'p:M6.3 6.8l.9 13.2h9.6l.9-13.2', 'p:M10.2 10.5v6M13.8 10.5v6' ],
	plus: [ 'p:M12 5v14M5 12h14' ],
	terminal: [ 'p:M4 4.8h16a1 1 0 011 1v12.4a1 1 0 01-1 1H4a1 1 0 01-1-1V5.8a1 1 0 011-1z', 'p:M7 9.5l2.8 2.5L7 14.5', 'p:M12.5 15h4.5' ],
	refresh: [ 'p:M19.5 12a7.5 7.5 0 11-2.2-5.3', 'p:M19.6 4.2v4.3h-4.3' ],
	power: [ 'p:M12 3.5v7.5', 'p:M6.7 6.8a7.5 7.5 0 1010.6 0' ],
	check: [ 'p:M5 12.5l4.5 4.5L19 7.5' ],
	x: [ 'p:M6.5 6.5l11 11M17.5 6.5l-11 11' ],
	alert: [ 'p:M10.3 4.2L2.6 17.6A2 2 0 004.3 20.6h15.4a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z', 'p:M12 9v4.5', 'p:M12 17h.01' ],
	info: [ 'c:12,12,8.6', 'p:M12 11v5.5', 'p:M12 7.8h.01' ],
	card: [ 'p:M4 5.5h16a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1v-11a1 1 0 011-1z', 'c:8.5,11,1.8', 'p:M5.6 16c.6-1.4 1.6-2.1 2.9-2.1s2.3.7 2.9 2.1', 'p:M14 10h4M14 13.5h3' ],
	server: [ 'p:M4.5 4.5h15a1 1 0 011 1v4a1 1 0 01-1 1h-15a1 1 0 01-1-1v-4a1 1 0 011-1z',
		'p:M4.5 13.5h15a1 1 0 011 1v4a1 1 0 01-1 1h-15a1 1 0 01-1-1v-4a1 1 0 011-1z', 'p:M7.5 7.5h.01M7.5 16.5h.01' ],
	wave: [ 'p:M2.5 12c1.6-4.6 3.2-4.6 4.75 0s3.15 4.6 4.75 0 3.2-4.6 4.75 0 3.15 4.6 4.75 0' ],
	key: [ 'c:8,15.5,3.8', 'p:M10.8 12.8L19.5 4', 'p:M16.5 7l2.5 2.5', 'p:M14.3 9.2l2 2' ],
	sliders: [ 'p:M4 7h9M17.5 7H20M4 17h3.5M11.5 17H20', 'c:15.3,7,2.2', 'c:9.5,17,2.2' ],
	inbox: [ 'p:M3.5 13.5l2.3-7.6a1 1 0 011-.7h10.4a1 1 0 011 .7l2.3 7.6v5a1 1 0 01-1 1h-15a1 1 0 01-1-1z', 'p:M3.5 13.5h4.7l1.2 2.3h5.2l1.2-2.3h4.7' ],
	list: [ 'p:M9 6.5h11M9 12h11M9 17.5h11', 'p:M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01' ],
	bolt: [ 'p:M13.2 2.8L5 13.4h6.4l-.9 7.8 8.5-10.8h-6.6z' ],
	bluetooth: [ 'p:M6.8 7.6l10 8.8-5 4.4V3.2l5 4.4-10 8.8' ],
	phone: [ 'p:M8 2.8h8a1.6 1.6 0 011.6 1.6v15.2a1.6 1.6 0 01-1.6 1.6H8a1.6 1.6 0 01-1.6-1.6V4.4A1.6 1.6 0 018 2.8z', 'p:M10.8 18h2.4' ],
	search: [ 'c:10.5,10.5,6.3', 'p:M15.2 15.2L20 20' ],
	eye: [ 'p:M2.5 12s3.5-6.3 9.5-6.3 9.5 6.3 9.5 6.3-3.5 6.3-9.5 6.3S2.5 12 2.5 12z', 'c:12,12,2.7' ],
	link: [ 'p:M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1', 'p:M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1' ],
	star: [ 'p:M12 3.6l2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z' ],
	user: [ 'c:12,8.2,3.7', 'p:M4.8 20.2c.9-3.7 3.7-5.9 7.2-5.9s6.3 2.2 7.2 5.9' ],
	data: [ 'p:M4 18.5h16', 'p:M6.5 15v-4M10.5 15V7M14.5 15v-6M18.5 15V5' ],
	shield: [ 'p:M12 3.2l7.5 2.8v5.6c0 4.4-3.1 8-7.5 9.2-4.4-1.2-7.5-4.8-7.5-9.2V6z', 'p:M8.8 12.2l2.2 2.2 4.2-4.4' ],
	database: [ 'p:M4.5 6c0-1.6 3.4-2.8 7.5-2.8s7.5 1.2 7.5 2.8-3.4 2.8-7.5 2.8S4.5 7.6 4.5 6z', 'p:M4.5 6v12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8V6', 'p:M4.5 12c0 1.6 3.4 2.8 7.5 2.8s7.5-1.2 7.5-2.8' ],
	play: [ 'p:M8 5.5l10.5 6.5L8 18.5z' ],
	stop: [ 'p:M7 7h10v10H7z' ],
	rollback: [ 'p:M4.6 12a7.4 7.4 0 107.4-7.4 7.5 7.5 0 00-5.6 2.5', 'p:M4.4 3.8v4.3h4.3' ],
	speed: [ 'p:M4.2 17.5a8.6 8.6 0 1115.6 0', 'p:M12 13.2l3.8-4.4', 'c:12,13.6,1.2' ],
	cloud: [ 'p:M7 18.5h10.5a4 4 0 00.6-7.96A6 6 0 006.4 9.1 4.75 4.75 0 007 18.5z' ],
	circle: [ 'c:12,12,8' ]
};

const LEVEL_NAME = [ _('很差'), _('较差'), _('一般'), _('良好'), _('极好') ];
const LEVEL_HINT = [ _('可能频繁断流'), _('能用，但比较慢'), _('日常上网够用'), _('视频通话流畅'), _('可以跑满速') ];
const LEVEL_COLOR = [ '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#059669' ];

/* the five quality levels sit on these points, so every metric maps them to
 * 0/20/40/60/80/100 % of its scale and the worst metric decides the level */
const SCALE = {
	rsrp: [ -125, -110, -100, -90, -80, -65 ],
	sinr: [ -8, 0, 5, 13, 20, 30 ],
	rsrq: [ -25, -17, -14, -11, -8, -3 ]
};

const CSS = `
.cm-ico { display: inline-flex; vertical-align: middle; line-height: 0; }
.cm-ico svg { width: 1em; height: 1em; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.cm-ico svg .f { fill: currentColor; stroke: none; }
.cm-card { border: 1px solid rgba(128,128,128,.22); border-radius: 14px; padding: 16px 18px; }
.cm-hero { display: grid; grid-template-columns: auto 1fr auto; gap: 8px 22px; align-items: center; margin-bottom: 14px; }
.cm-hero .main { min-width: 0; }
.cm-hero .op { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cm-hero .line { margin-top: 6px; font-size: 13px; opacity: .75; display: flex; gap: 6px 14px; flex-wrap: wrap; align-items: center; }
.cm-hero .line > span { display: inline-flex; align-items: center; gap: 4px; }
.cm-hero .side { display: flex; gap: 18px; }
.cm-hero .state { width: 132px; height: 132px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 46px; }
@media (max-width: 720px) { .cm-hero { grid-template-columns: auto 1fr; } .cm-hero .side { grid-column: 1 / -1; justify-content: flex-end; border-top: 1px solid rgba(128,128,128,.15); padding-top: 12px; } }
@media (max-width: 460px) { .cm-hero { grid-template-columns: 1fr; justify-items: center; text-align: center; } .cm-hero .op, .cm-hero .line { justify-content: center; } }
.cm-gauge { position: relative; width: 150px; height: 104px; flex: none; }
.cm-gauge svg { width: 150px; height: 92px; display: block; }
.cm-gauge .w { position: absolute; left: 0; right: 0; top: 40px; text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 1px; }
.cm-gauge .h { position: absolute; left: 0; right: 0; top: 74px; text-align: center; font-size: 12px; opacity: .75; white-space: nowrap; }
.cm-sw { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; }
.cm-sw .lbl { display: flex; align-items: center; gap: 4px; opacity: .8; }
.cm-switch { position: relative; width: 50px; height: 28px; border-radius: 14px; border: 0; cursor: pointer; transition: background .2s; flex: none; padding: 0; }
.cm-switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; transition: left .2s; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
.cm-switch.on { background: #16a34a; } .cm-switch.on::after { left: 25px; }
.cm-switch.off { background: #9ca3af; }
.cm-switch.warn.on { background: #ea580c; }
.cm-switch[disabled] { opacity: .5; cursor: wait; }
.cm-switch.busy { opacity: .75; }
.cm-switch.busy::after { animation: cm-pulse .9s ease-in-out infinite alternate; }
@keyframes cm-pulse { from { transform: scale(1); } to { transform: scale(.82); } }
.cm-mode.busy { opacity: .7; cursor: wait; }
.cm-mode.busy .mark { animation: cm-spin .8s linear infinite; border-right-color: transparent !important; background: transparent !important; }
@keyframes cm-spin { to { transform: rotate(360deg); } }
.cm-spin-i { display: inline-block; width: 12px; height: 12px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: cm-spin .8s linear infinite; margin-right: 6px; vertical-align: -1px; }
.cm-step { display: flex; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.cm-step > div { flex: 1; min-width: 92px; display: flex; flex-direction: column; gap: 5px; font-size: 12px; }
.cm-step > div i { height: 5px; border-radius: 3px; background: rgba(128,128,128,.2); }
.cm-step > div.done i { background: #16a34a; }
.cm-step > div.now i { background: linear-gradient(90deg, #2563eb 50%, rgba(37,99,235,.25) 50%); background-size: 200% 100%; animation: cm-flow 1.2s linear infinite; }
.cm-step > div.fail i { background: #ea580c; }
.cm-step > div span { opacity: .6; }
.cm-step > div.done span, .cm-step > div.now span, .cm-step > div.fail span { opacity: 1; font-weight: 600; }
@keyframes cm-flow { from { background-position: 100% 0; } to { background-position: 0 0; } }
.cm-rat { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 6px; font-size: 13px; font-weight: 800; color: #fff; letter-spacing: .5px; white-space: nowrap; }
.cm-rat small { font-size: 10px; font-weight: 700; margin-left: 4px; opacity: .85; }
.cm-rat.nr { background: linear-gradient(135deg, #7c3aed, #4f46e5); }
.cm-rat.lte { background: linear-gradient(135deg, #2563eb, #0891b2); }
.cm-rat.old { background: #6b7280; }
.cm-rat.none { background: transparent; color: inherit; border: 1px dashed rgba(128,128,128,.6); font-weight: 600; opacity: .8; }
.cm-chip { display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 8px; border-radius: 6px; font-size: 12px; font-weight: 600; background: rgba(128,128,128,.13); white-space: nowrap; }
.cm-chip.nr { background: rgba(124,58,237,.13); color: #6d28d9; }
.cm-chip.lte { background: rgba(37,99,235,.12); color: #1d4ed8; }
.cm-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.cm-tag.ok { background: rgba(22,163,74,.14); color: #15803d; }
.cm-tag.warn { background: rgba(217,119,6,.15); color: #b45309; }
.cm-tag.bad { background: rgba(220,38,38,.13); color: #b91c1c; }
.cm-tag.idle { background: rgba(107,114,128,.15); }
.cm-strip { display: flex; gap: 12px; padding: 12px 16px; border-radius: 12px; margin: 0 0 14px; align-items: center; flex-wrap: wrap; }
.cm-strip > .cm-ico { font-size: 22px; flex: none; }
.cm-strip .body { flex: 1; min-width: 200px; line-height: 1.5; }
.cm-strip .body .t { font-weight: 700; }
.cm-strip .body .d { font-size: 12px; opacity: .75; }
.cm-strip.ok { background: rgba(22,163,74,.08); } .cm-strip.ok > .cm-ico { color: #16a34a; }
.cm-strip.warn { background: rgba(234,88,12,.09); } .cm-strip.warn > .cm-ico { color: #ea580c; }
.cm-strip.bad { background: rgba(220,38,38,.08); } .cm-strip.bad > .cm-ico { color: #dc2626; }
.cm-strip.info { background: rgba(37,99,235,.07); } .cm-strip.info > .cm-ico { color: #2563eb; }
.cm-cells { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; margin-bottom: 16px; }
.cm-cell .hd { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.cm-cell .hd .grow { flex: 1; }
.cm-cell .verdict { display: flex; align-items: center; gap: 8px; font-weight: 700; }
.cm-scale { margin: 12px 0 4px; }
.cm-scale .top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 7px; }
.cm-scale .top .n { font-size: 13px; }
.cm-scale .top .n small { opacity: .6; margin-left: 4px; }
.cm-scale .top .v { font-size: 15px; font-weight: 700; font-variant-numeric: tabular-nums; }
.cm-scale .top .v small { font-size: 11px; opacity: .6; font-weight: 500; margin-left: 2px; }
.cm-scale .track { position: relative; display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; height: 8px; }
.cm-scale .track i { border-radius: 2px; opacity: .2; }
.cm-scale .track i.on { opacity: 1; }
.cm-scale .pin { position: absolute; top: 50%; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: #fff; border: 3px solid; box-shadow: 0 1px 3px rgba(0,0,0,.35); transition: left .4s; }
.cm-scale .lbls { display: grid; grid-template-columns: repeat(5, 1fr); font-size: 11px; margin-top: 5px; text-align: center; opacity: .55; }
.cm-scale .lbls b { opacity: 1; }
.cm-kv { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px 12px; margin-top: 14px; padding-top: 12px; border-top: 1px dashed rgba(128,128,128,.25); font-size: 12px; }
.cm-kv div span { display: block; opacity: .6; margin-bottom: 2px; }
.cm-kv div b { font-size: 13px; font-variant-numeric: tabular-nums; }
@media (max-width: 500px) { .cm-kv { grid-template-columns: repeat(2, 1fr); } }
.cm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin: 4px 0 16px; }
.cm-stat { border: 1px solid rgba(128,128,128,.2); border-radius: 12px; padding: 12px 14px; min-width: 0; display: flex; gap: 12px; align-items: flex-start; }
.cm-stat > .cm-ico { font-size: 20px; padding: 7px; border-radius: 10px; background: rgba(128,128,128,.1); flex: none; }
.cm-stat .k { font-size: 12px; opacity: .65; margin-bottom: 3px; }
.cm-stat .v { font-size: 15px; font-weight: 600; word-break: break-all; font-variant-numeric: tabular-nums; }
.cm-stat .s { font-size: 12px; opacity: .6; margin-top: 2px; word-break: break-all; }
.cm-stat.dl > .cm-ico { color: #16a34a; background: rgba(22,163,74,.12); }
.cm-stat.ul > .cm-ico { color: #2563eb; background: rgba(37,99,235,.12); }
.cm-modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; margin-bottom: 12px; }
.cm-mode { position: relative; text-align: left; border: 2px solid rgba(128,128,128,.22); border-radius: 14px; padding: 14px; cursor: pointer; background: transparent; color: inherit; font: inherit; display: flex; flex-direction: column; gap: 8px; }
.cm-mode:hover { border-color: rgba(79,70,229,.55); }
.cm-mode.sel { border-color: #4f46e5; background: rgba(79,70,229,.06); }
.cm-mode .art { display: flex; align-items: center; gap: 6px; height: 24px; }
.cm-mode .art .cm-ico { font-size: 16px; opacity: .7; }
.cm-mode .t { font-weight: 700; font-size: 14px; }
.cm-mode .d { font-size: 12px; opacity: .7; line-height: 1.55; }
.cm-mode .mark { position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; border-radius: 50%; border: 2px solid rgba(128,128,128,.35); display: flex; align-items: center; justify-content: center; font-size: 14px; color: #fff; }
.cm-mode.sel .mark { background: #4f46e5; border-color: #4f46e5; }
.cm-mode .rec { font-size: 11px; font-weight: 700; color: #4f46e5; }
.cm-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; align-items: center; }
.btn .cm-ico { margin-right: 5px; font-size: 15px; }
.btn.cm-only .cm-ico { margin: 0; }
.cm-muted { opacity: .65; font-size: 12px; }
.cm-empty { text-align: center; padding: 38px 16px; }
.cm-empty > .cm-ico { font-size: 44px; opacity: .35; margin-bottom: 10px; }
.cm-empty .t { font-weight: 600; margin-bottom: 4px; }
.cm-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.cm-toolbar .grow { flex: 1; }
.cm-h { display: flex; align-items: center; gap: 8px; margin: 18px 0 10px; font-size: 15px; font-weight: 700; }
.cm-h .cm-ico { font-size: 18px; opacity: .7; }
.cm-h .grow { flex: 1; }
.cm-pre { max-height: 460px; overflow: auto; white-space: pre-wrap; font-size: 12px; line-height: 1.55; padding: 12px; border-radius: 10px; background: rgba(128,128,128,.08); margin: 0; font-family: ui-monospace, Menlo, Consolas, monospace; }
.cm-timeline { position: relative; padding-left: 4px; }
.cm-timeline .ev { display: flex; gap: 12px; align-items: flex-start; padding: 6px 0; }
.cm-timeline .dot { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; flex: none; background: rgba(128,128,128,.12); }
.cm-timeline .dot.nr { color: #6d28d9; background: rgba(124,58,237,.13); }
.cm-timeline .dot.lte { color: #1d4ed8; background: rgba(37,99,235,.12); }
.cm-timeline .dot.warn { color: #c2410c; background: rgba(234,88,12,.12); }
.cm-timeline .txt { flex: 1; font-size: 13px; padding-top: 3px; }
.cm-timeline time { font-size: 12px; opacity: .55; white-space: nowrap; padding-top: 4px; font-variant-numeric: tabular-nums; }
.cm-tabs { display: flex; gap: 2px; border-bottom: 1px solid rgba(128,128,128,.25); margin: 4px 0 16px; overflow-x: auto; scrollbar-width: none; }
.cm-tabs::-webkit-scrollbar { display: none; }
.cm-tab { position: relative; display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border: 0; background: transparent; color: inherit; font: inherit; font-size: 14px; cursor: pointer; opacity: .65; white-space: nowrap; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.cm-tab:hover { opacity: .9; }
.cm-tab.active { opacity: 1; font-weight: 700; border-bottom-color: #2563eb; color: #2563eb; }
.cm-tab .cm-ico { font-size: 16px; }
.cm-tab .b { display: none; min-width: 8px; height: 8px; border-radius: 4px; }
.cm-tab .b.on { display: inline-block; }
.cm-tab .b.n { min-width: 18px; height: 18px; border-radius: 9px; font-size: 11px; line-height: 18px; text-align: center; padding: 0 5px; background: rgba(128,128,128,.18); color: inherit; font-weight: 600; }
.cm-pane > :first-child { margin-top: 0; }
.cm-mini { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 12px; margin-bottom: 14px; }
.cm-mini .cm-card { display: flex; flex-direction: column; gap: 8px; }
.cm-mini .hd { display: flex; align-items: center; gap: 8px; font-size: 13px; opacity: .75; }
.cm-mini .hd .grow { flex: 1; }
.cm-mini .hd a { font-size: 12px; cursor: pointer; }
.cm-mini .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cm-mini .num { font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }
.cm-mini .num small { font-size: 13px; font-weight: 600; opacity: .55; margin-left: 4px; }
.cm-mini .cm-ubar { margin: 2px 0 0; height: 8px; }
.cm-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.cm-table th { text-align: left; font-weight: 600; opacity: .6; font-size: 12px; padding: 6px 8px; border-bottom: 1px solid rgba(128,128,128,.2); }
.cm-table td { padding: 8px; border-bottom: 1px dashed rgba(128,128,128,.18); font-variant-numeric: tabular-nums; }
.cm-legend { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; font-size: 12px; }
.cm-legend div { display: flex; gap: 8px; align-items: flex-start; padding: 8px 10px; border-radius: 8px; background: rgba(128,128,128,.07); }
.cm-legend i { width: 10px; height: 10px; border-radius: 3px; flex: none; margin-top: 3px; }
.cm-usage .top { display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.cm-usage .top .grow { flex: 1; min-width: 180px; }
.cm-usage .lbl { font-size: 12px; opacity: .65; display: flex; align-items: center; gap: 6px; }
.cm-usage .big { font-size: 28px; font-weight: 800; font-variant-numeric: tabular-nums; margin-top: 4px; }
.cm-usage .big small { font-size: 15px; font-weight: 600; opacity: .55; margin-left: 6px; }
.cm-usage .when { text-align: right; font-size: 12px; opacity: .7; line-height: 1.6; }
.cm-usage .when b { font-size: 15px; opacity: 1; display: block; }
.cm-ubar { position: relative; height: 12px; border-radius: 6px; background: rgba(128,128,128,.15); margin: 14px 0 6px; }
.cm-ubar i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 6px; transition: width .4s; }
.cm-ubar s { position: absolute; top: -4px; bottom: -4px; width: 2px; background: currentColor; opacity: .35; text-decoration: none; }
.cm-usage .facts { display: flex; gap: 6px 18px; flex-wrap: wrap; font-size: 13px; margin-top: 8px; }
.cm-usage .facts span { display: inline-flex; align-items: center; gap: 5px; }
.cm-usage .facts b { font-variant-numeric: tabular-nums; }
.cm-spark { margin-top: 14px; }
.cm-spark svg { width: 100%; height: 64px; display: block; }
.cm-spark .ax { display: flex; justify-content: space-between; font-size: 11px; opacity: .5; margin-top: 3px; }
`;

const callStatus = rpc.declare({ object: 'luci.cellular', method: 'status' });
const callAction = rpc.declare({ object: 'luci.cellular', method: 'action', params: [ 'name' ] });
const callLog = rpc.declare({ object: 'luci.cellular', method: 'log' });

/* [ badge text, sub text, class ] */
const RAT = {
	'NR5G-SA': [ '5G', 'SA', 'nr' ],
	'NR5G-NSA': [ '5G', 'NSA', 'nr' ],
	'LTE': [ '4G', '', 'lte' ],
	'WCDMA': [ '3G', '', 'old' ]
};

const MODES = {
	nr_first: { title: _('5G 优先（4G 兜底）'), desc: _('模组先找 5G，找不到时用 4G。连上后在 5G / 4G 之间怎么切由运营商网络决定。'), art: [ '5G', 'swap', '4G' ], rec: true },
	nr: { title: _('仅 5G'), desc: _('只连 5G，没有 5G 覆盖的地方会断网。'), art: [ '5G' ] },
	lte: { title: _('仅 4G'), desc: _('只连 4G。5G 时好时坏或想省电时用。'), art: [ '4G' ] },
	auto: { title: _('全制式'), desc: _('5G / 4G / 3G 都允许，偏远地区信号很差时用。'), art: [ '5G', '4G', '3G' ] }
};

function svgIcon(name) {
	const parts = (ICONS[name] || ICONS.circle).map((d) => {
		const kind = d.slice(0, 2), v = d.slice(2);

		if (kind == 'c:') {
			const c = v.split(',');
			return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '"/>';
		}

		return '<path ' + (kind == 'f:' ? 'class="f" ' : '') + 'd="' + v + '"/>';
	});

	return '<svg viewBox="0 0 24 24" aria-hidden="true">' + parts.join('') + '</svg>';
}

/* piecewise-linear position (0..100) of v on a SCALE row */
function pct(row, v) {
	if (v == null || isNaN(v))
		return null;
	if (v <= row[0])
		return 0;

	for (let i = 1; i < row.length; i++)
		if (v <= row[i])
			return (i - 1) * 20 + (v - row[i - 1]) / (row[i] - row[i - 1]) * 20;

	return 100;
}

function levelOf(p) {
	return p == null ? null : Math.min(4, Math.floor(p / 20));
}

return baseclass.extend({
	CSS: CSS,
	RAT: RAT,
	MODES: MODES,
	LEVEL_NAME: LEVEL_NAME,
	LEVEL_COLOR: LEVEL_COLOR,
	callStatus: callStatus,
	callAction: callAction,
	callLog: callLog,

	icon: function(name, style) {
		const s = E('span', { 'class': 'cm-ico', 'style': style || null });
		s.innerHTML = svgIcon(name);
		return s;
	},

	/*
	 * Overall verdict for one carrier.  RSRP says how loud the cell is, SINR
	 * how clean; the weaker of the two limits real throughput, so it decides.
	 * Returns { score 0..100, level 0..4, name, hint, color, by } or null.
	 */
	assess: function(c) {
		if (!c || c.rsrp == null)
			return null;

		const pr = pct(SCALE.rsrp, c.rsrp);
		const ps = pct(SCALE.sinr, c.sinr);
		const score = ps == null ? pr : Math.min(pr, ps);
		const level = levelOf(score);

		return {
			score: score, level: level,
			rsrp_level: levelOf(pr), sinr_level: levelOf(ps),
			name: LEVEL_NAME[level], hint: LEVEL_HINT[level], color: LEVEL_COLOR[level],
			by: (ps != null && ps < pr) ? 'sinr' : 'rsrp'
		};
	},

	/* the carrier that carries the data: NR when present, else the LTE cell */
	primary: function(cell) {
		return cell?.nr || cell?.lte || null;
	},

	/* 5 rising bars; level null = no service */
	bars: function(level, size) {
		const h = size || 18, w = Math.round(h * 1.25);
		const color = level == null ? 'currentColor' : LEVEL_COLOR[level];
		let s = '<svg viewBox="0 0 25 20" width="' + w + '" height="' + h + '" aria-hidden="true">';

		for (let i = 0; i < 5; i++) {
			const bh = 4 + i * 4;
			const on = level != null && i <= level;
			s += '<rect x="' + (i * 5) + '" y="' + (20 - bh) + '" width="3.6" height="' + bh + '" rx="1" stroke="none" fill="' +
				(on ? color : 'currentColor') + '" fill-opacity="' + (on ? 1 : .18) + '"/>';
		}

		if (level == null)
			s += '<path d="M15.5 2.5l6 6m0-6l-6 6" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>';

		const span = E('span', { 'class': 'cm-ico', 'title': level == null ? _('无信号') : LEVEL_NAME[level] });
		span.innerHTML = s + '</svg>';
		return span;
	},

	/* half ring of five level segments, a dot at the score, verdict in the middle */
	gauge: function(a, emptyText) {
		const r = 60, cx = 75, cy = 80;
		const pt = (f) => {
			const t = Math.PI * (1 - f);
			return (cx + Math.cos(t) * r).toFixed(2) + ' ' + (cy - Math.sin(t) * r).toFixed(2);
		};
		let svg = '<svg viewBox="0 0 150 92" aria-hidden="true">';

		for (let i = 0; i < 5; i++) {
			const on = a && i <= a.level;
			svg += '<path d="M' + pt(i / 5 + .012) + 'A' + r + ' ' + r + ' 0 0 1 ' + pt((i + 1) / 5 - .012) +
				'" fill="none" stroke-width="12" stroke="' + (on ? a.color : 'currentColor') + '" stroke-opacity="' + (on ? 1 : .13) + '"/>';
		}

		if (a) {
			const p = pt(Math.max(.01, Math.min(.99, a.score / 100))).split(' ');
			svg += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7.5" fill="#fff" stroke="' + a.color + '" stroke-width="3.5"/>';
		}

		const g = E('div', { 'class': 'cm-gauge' }, [
			E('div', { 'class': 'w', 'style': 'color:' + (a ? a.color : 'inherit') }, a ? a.name : (emptyText || '—')),
			E('div', { 'class': 'h' }, a ? a.hint : '')
		]);

		g.insertAdjacentHTML('afterbegin', svg + '</svg>');
		return g;
	},

	/* metric on a five-zone scale with a pin at the value */
	scale: function(name, unit, metric, value, sub) {
		const p = pct(SCALE[metric], value);
		const lv = levelOf(p);
		const color = lv == null ? '#9ca3af' : LEVEL_COLOR[lv];

		const track = E('div', { 'class': 'track' }, LEVEL_COLOR.map((c, i) =>
			E('i', { 'class': lv != null && i <= lv ? 'on' : '', 'style': 'background:' + (lv != null && i <= lv ? color : c) })));

		if (p != null)
			track.appendChild(E('span', { 'class': 'pin', 'style': 'left:' + Math.max(2, Math.min(98, p)) + '%;border-color:' + color }));

		return E('div', { 'class': 'cm-scale' }, [
			E('div', { 'class': 'top' }, [
				E('span', { 'class': 'n' }, [ name, sub ? E('small', {}, sub) : '' ]),
				E('span', { 'class': 'v', 'style': 'color:' + color }, value != null ? [ String(Math.round(value * 10) / 10), E('small', {}, unit) ] : '—')
			]),
			track,
			E('div', { 'class': 'lbls' }, LEVEL_NAME.map((n, i) => i === lv ? E('b', { 'style': 'color:' + color }, n) : E('span', {}, n)))
		]);
	},

	rat: function(rat, withSub) {
		const r = RAT[rat];

		if (!r)
			return E('span', { 'class': 'cm-rat none' }, _('无服务'));

		return E('span', { 'class': 'cm-rat ' + r[2] }, [ r[0], withSub !== false && r[1] ? E('small', {}, r[1]) : '' ]);
	},

	badge: function(text) {
		return E('span', { 'class': 'cm-rat ' + ({ '5G': 'nr', '4G': 'lte' }[text] || 'old') }, text);
	},

	chip: function(text, cls, icon) {
		return E('span', { 'class': 'cm-chip ' + (cls || '') }, [ icon ? this.icon(icon) : '', text ]);
	},

	tag: function(cls, text, icon) {
		return E('span', { 'class': 'cm-tag ' + cls }, [ icon ? this.icon(icon) : '', text ]);
	},

	stat: function(icon, k, v, s, cls) {
		return E('div', { 'class': 'cm-stat ' + (cls || '') }, [
			this.icon(icon),
			E('div', { 'style': 'min-width:0' }, [
				E('div', { 'class': 'k' }, k),
				E('div', { 'class': 'v' }, v),
				s ? E('div', { 'class': 's' }, s) : ''
			])
		]);
	},

	strip: function(cls, icon, title, desc, actions) {
		return E('div', { 'class': 'cm-strip ' + cls }, [
			this.icon(icon),
			E('div', { 'class': 'body' }, [ E('div', { 'class': 't' }, title), desc ? E('div', { 'class': 'd' }, desc) : '' ]),
			actions || ''
		]);
	},

	heading: function(icon, title, extra) {
		return E('div', { 'class': 'cm-h' }, [ this.icon(icon), E('span', {}, title), E('span', { 'class': 'grow' }), extra || '' ]);
	},

	empty: function(icon, title, desc) {
		return E('div', { 'class': 'cm-empty' }, [
			this.icon(icon), E('div', { 'class': 't' }, title), desc ? E('div', { 'class': 'cm-muted' }, desc) : ''
		]);
	},

	section: function(title, body, desc, id) {
		return E('div', { 'class': 'cbi-section', 'id': id || null }, [
			title ? E('h3', {}, title) : '',
			desc ? E('div', { 'class': 'cbi-section-descr' }, desc) : '',
			E('div', { 'class': 'cbi-section-node' }, body)
		]);
	},

	field: function(title, input, desc) {
		return E('div', { 'class': 'cbi-value' }, [
			E('label', { 'class': 'cbi-value-title' }, title),
			E('div', { 'class': 'cbi-value-field' }, [ input, desc ? E('div', { 'class': 'cbi-value-description' }, desc) : '' ])
		]);
	},

	button: function(cls, label, fn, icon, title) {
		return E('button', { 'class': 'btn cbi-button ' + cls + (label ? '' : ' cm-only'), 'title': title || null, 'aria-label': title || null,
			'click': ui.createHandlerFn(null, fn) }, [ icon ? this.icon(icon) : '', label ]);
	},

	/* flips at once; fn(next) may return false (or a promise of false) to
	 * cancel, e.g. when a confirmation is declined, and the switch flips back */
	toggle: function(on, fn, cls) {
		const set = (b, v) => {
			b.classList.toggle('on', v);
			b.classList.toggle('off', !v);
			b.setAttribute('aria-checked', v ? 'true' : 'false');
		};

		return E('button', {
			'class': 'cm-switch ' + (on ? 'on' : 'off') + (cls ? ' ' + cls : ''),
			'role': 'switch', 'aria-checked': on ? 'true' : 'false',
			'click': (ev) => {
				const b = ev.currentTarget;

				if (b.disabled)
					return;

				b.disabled = true;
				b.classList.add('busy');
				set(b, !on);

				return Promise.resolve(fn(!on)).then((r) => {
					if (r === false) {
						set(b, on);
						b.disabled = false;
						b.classList.remove('busy');
					}
				});
			}
		});
	},

	/*
	 * Tab strip built once; callers fill .panes[key] on every refresh so
	 * polling never resets the selection.  The last tab is remembered per page
	 * and a #key in the URL wins (deep links from other pages).
	 */
	tabs: function(id, defs) {
		const store = 'cm-tab-' + id;
		const has = (k) => defs.some((d) => d[0] == k);
		const panes = {}, btns = {};
		let cur = null;

		try {
			cur = sessionStorage.getItem(store);
		}
		catch (e) {}

		if (has(location.hash.slice(1)))
			cur = location.hash.slice(1);
		if (!has(cur))
			cur = defs[0][0];

		const bar = E('div', { 'class': 'cm-tabs', 'role': 'tablist' });
		const t = {
			panes: panes,
			current: () => cur,
			select: (k, scroll) => {
				if (!has(k))
					return;

				cur = k;
				defs.forEach((d) => {
					btns[d[0]].classList.toggle('active', d[0] == k);
					btns[d[0]].setAttribute('aria-selected', d[0] == k ? 'true' : 'false');
					panes[d[0]].style.display = d[0] == k ? '' : 'none';
				});

				try {
					sessionStorage.setItem(store, k);
				}
				catch (e) {}

				if (scroll)
					bar.scrollIntoView({ behavior: 'smooth', block: 'start' });
			},
			/* small marker on a tab: a colour dot, or a count */
			badge: (k, v, color) => {
				const b = btns[k]?.querySelector('.b');

				if (!b)
					return;

				const on = !(v == null || v === false || v === 0);

				b.className = 'b' + (on ? ' on' : '') + (on && typeof v == 'number' ? ' n' : '');
				b.textContent = on && typeof v == 'number' ? String(v) : '';
				b.style.background = on ? (color || '') : '';
			}
		};

		defs.forEach((d) => {
			btns[d[0]] = E('button', { 'class': 'cm-tab', 'type': 'button', 'role': 'tab', 'click': () => t.select(d[0]) },
				[ d[2] ? this.icon(d[2]) : '', E('span', {}, d[1]), E('span', { 'class': 'b' }) ]);
			bar.appendChild(btns[d[0]]);
			panes[d[0]] = E('div', { 'class': 'cm-pane', 'role': 'tabpanel' });
		});

		t.node = E('div', {}, [ bar ].concat(defs.map((d) => panes[d[0]])));
		t.select(cur);

		return t;
	},

	/* modal yes/no; resolves true when confirmed */
	confirm: function(title, body, ok, cls) {
		return new Promise((resolve) => {
			const done = (v) => { ui.hideModal(); resolve(v); };

			ui.showModal(title, [
				E('p', {}, body),
				E('div', { 'class': 'right' }, [
					E('button', { 'class': 'btn', 'click': () => done(false) }, _('取消')), ' ',
					E('button', { 'class': 'btn ' + (cls || 'cbi-button-negative'), 'click': () => done(true) }, ok || _('确定'))
				])
			]);
		});
	},

	check: function(res) {
		if (!res || !res.ok)
			throw new Error(res?.error || _('操作失败'));

		return res;
	},

	notifyError: function(e) {
		ui.addNotification(null, E('p', _('错误：') + (e.message || e)), 'danger');
	},

	fmtBytes: function(n) {
		if (n == null || isNaN(n))
			return '-';

		const u = [ 'B', 'KB', 'MB', 'GB', 'TB' ];
		let i = 0;

		while (n >= 1024 && i < u.length - 1) {
			n /= 1024;
			i++;
		}

		return (i ? n.toFixed(n < 10 ? 2 : 1) : n) + ' ' + u[i];
	},

	/* colour of a usage percentage against the warn threshold */
	usageColor: function(pct, warn) {
		return pct == null ? '#2563eb' : pct >= 100 ? '#dc2626' : pct >= warn ? '#ea580c' : '#16a34a';
	},

	usageBar: function(u) {
		const pct = u.pct != null ? Math.min(100, u.pct) : null;
		const color = this.usageColor(u.pct, u.warn_pct);

		return E('div', { 'class': 'cm-ubar' }, [
			E('i', { 'style': 'width:' + (pct != null ? Math.max(2, pct) : 100) + '%;background:' + color + (pct == null ? ';opacity:.35' : '') }),
			u.limit ? E('s', { 'style': 'left:' + u.warn_pct + '%', 'title': _('提醒线 %d%%').format(u.warn_pct) }) : ''
		]);
	},

	/* last 30 days as bars, today highlighted */
	spark: function(daily, color) {
		const max = Math.max(1, ...daily.map((d) => d.b));
		const w = 300, h = 64, bw = w / daily.length;
		let s = '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true">';

		daily.forEach((d, i) => {
			const bh = d.b ? Math.max(2, d.b / max * (h - 4)) : 1;
			const last = i == daily.length - 1;

			s += '<rect x="' + (i * bw + 1).toFixed(1) + '" y="' + (h - bh).toFixed(1) + '" width="' + (bw - 2).toFixed(1) +
				'" height="' + bh.toFixed(1) + '" rx="1.5" fill="' + (last ? color : 'currentColor') + '" fill-opacity="' + (last ? 1 : d.b ? .3 : .12) + '">' +
				'<title>' + d.d + '  ' + this.fmtBytes(d.b) + '</title></rect>';
		});

		const wrap = E('div', { 'class': 'cm-spark' }, E('div', { 'class': 'ax' }, [
			E('span', {}, daily[0]?.d.replace('-', '/')), E('span', {}, _('每日用量 · 最高 %s').format(this.fmtBytes(max))), E('span', {}, _('今天'))
		]));

		wrap.insertAdjacentHTML('afterbegin', s + '</svg>');
		return wrap;
	},

	fmtRate: function(bps) {
		if (bps == null || isNaN(bps))
			return '-';

		const bits = bps * 8;

		if (bits >= 1e6)
			return (bits / 1e6).toFixed(bits >= 1e8 ? 0 : 1) + ' Mbps';

		return (bits / 1e3).toFixed(0) + ' Kbps';
	},

	fmtDuration: function(sec) {
		if (sec == null || isNaN(sec))
			return '-';
		if (sec < 60)
			return _('%d 秒').format(sec);
		if (sec < 3600)
			return _('%d 分钟').format(Math.floor(sec / 60));
		if (sec < 86400)
			return _('%d 小时 %d 分').format(Math.floor(sec / 3600), Math.floor(sec % 3600 / 60));

		return _('%d 天 %d 小时').format(Math.floor(sec / 86400), Math.floor(sec % 86400 / 3600));
	},

	fmtTime: function(ts) {
		const d = new Date(ts * 1000);
		const p = (n) => String(n).padStart(2, '0');
		const today = new Date();

		if (d.toDateString() == today.toDateString())
			return p(d.getHours()) + ':' + p(d.getMinutes());

		return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
	},

	/* [ class, icon, title, detail ] when the modem is not usable, else null */
	blocker: function(st) {
		const d = st.daemon;

		if (!st.running)
			return [ 'bad', 'alert', _('后台服务未运行'), _('状态和网络模式切换都不可用。SSH 执行 /etc/init.d/cellmoded restart。') ];
		if (!d || !st.fresh)
			return [ 'info', 'refresh', _('正在读取模组状态…'), null ];
		if (!d.modem)
			return [ 'bad', 'chip', d.error || _('未检测到蜂窝模组'), _('模组刚上电时需要 20–40 秒枚举，稍后会自动刷新。') ];
		if (d.error)
			return [ 'warn', 'alert', d.error, null ];
		if (st.config.airplane)
			return [ 'info', 'plane', _('飞行模式已开启'), _('蜂窝射频已关闭，关掉飞行模式即可恢复。') ];
		if (d.sim.state == 'NOT INSERTED')
			return [ 'bad', 'sim', _('未检测到 SIM 卡'), _('插好 SIM 卡后会自动识别。') ];
		if (d.sim.state && d.sim.state != 'READY')
			return [ 'bad', 'sim', _('SIM 卡状态：%s').format(d.sim.state), _('可能需要 PIN 码或卡已锁定。') ];

		return null;
	}
});
