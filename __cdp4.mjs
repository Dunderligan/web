const PORT = 9333;
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const target = list.find((p) => p.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
	const msg = JSON.parse(e.data);
	if (msg.id && pending.has(msg.id)) {
		pending.get(msg.id)(msg);
		pending.delete(msg.id);
	}
});
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
function send(method, params = {}) {
	return new Promise((resolve) => {
		const msgId = ++id;
		pending.set(msgId, resolve);
		ws.send(JSON.stringify({ id: msgId, method, params }));
	});
}
const res = await send('Runtime.evaluate', {
	expression: `(() => {
		const el = document.querySelector('devframes-dock-embedded');
		const sr = el?.shadowRoot;
		if (!sr) return { noShadow: true };
		const all = [...sr.querySelectorAll('*')];
		const visible = all.map(x => {
			const cs = getComputedStyle(x);
			const r = x.getBoundingClientRect();
			return { tag: x.tagName, cls: (x.className?.toString?.() ?? '').slice(0,60), display: cs.display, position: cs.position, rect: [r.x,r.y,r.width,r.height].map(Math.round), text: (x.textContent||'').trim().slice(0,40) };
		}).filter(x => x.rect[2] > 0 && x.rect[3] > 0);
		return {
			htmlLen: sr.innerHTML.length,
			total: all.length,
			visible,
			outer: sr.innerHTML.slice(0, 4000)
		};
	})()`,
	returnByValue: true,
});
const v = res.result?.result?.value;
console.log(JSON.stringify(v, null, 2));
ws.close();
