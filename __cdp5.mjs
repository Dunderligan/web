const PORT = 9333;
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const target = list.find((p) => p.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const logs = [];
ws.addEventListener('message', (e) => {
	const msg = JSON.parse(e.data);
	if (msg.id && pending.has(msg.id)) {
		pending.get(msg.id)(msg);
		pending.delete(msg.id);
		return;
	}
	if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type !== 'log')
		logs.push(`console.${msg.params.type}: ` + msg.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ').slice(0, 300));
	if (msg.method === 'Runtime.exceptionThrown')
		logs.push('EXCEPTION: ' + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text).slice(0, 500));
});
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
function send(method, params = {}) {
	return new Promise((resolve) => {
		const msgId = ++id;
		pending.set(msgId, resolve);
		ws.send(JSON.stringify({ id: msgId, method, params }));
	});
}
await send('Runtime.enable');
await send('Page.enable');
await send('Page.navigate', { url: 'http://localhost:5174/' });
await new Promise((r) => setTimeout(r, 12000));
const res = await send('Runtime.evaluate', {
	expression: `(() => {
		const el = document.querySelector('devframes-dock-embedded');
		const sr = el?.shadowRoot;
		if (!sr) return { present: !!el, noShadow: true, body: [...document.body.children].map(x => x.tagName) };
		const all = [...sr.querySelectorAll('*')].map(x => {
			const cs = getComputedStyle(x);
			const r = x.getBoundingClientRect();
			return { tag: x.tagName, display: cs.display, position: cs.position, rect: [r.x,r.y,r.width,r.height].map(Math.round), text: (x.textContent||'').trim().replace(/\\s+/g,' ').slice(0,60) };
		}).filter(x => x.rect[2] > 0 && x.rect[3] > 0);
		return {
			present: true,
			unauthorized: sr.textContent.includes('Unauthorized'),
			hasDockContainer: !!sr.querySelector('#devframes-dock-container'),
			viewport: [innerWidth, innerHeight],
			visible: all.slice(0, 15)
		};
	})()`,
	returnByValue: true,
});
console.log(JSON.stringify(res.result?.result?.value, null, 2));
console.log('--- console ---');
console.log(logs.filter((l) => !/hydration_mismatch|invalid_placement|app_body_unwrapped/.test(l)).join('\n'));
ws.close();
