const PORT = 9333;
const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const target = list.find((p) => p.type === 'page');
if (!target) throw new Error('no page target');
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
const evaluate = async (expression) => {
	const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
	if (res.result?.exceptionDetails) return { error: res.result.exceptionDetails.text, details: res.result.exceptionDetails };
	return res.result?.result?.value;
};
await send('Page.enable');
await send('Page.navigate', { url: 'http://localhost:5174/' });
await new Promise((r) => setTimeout(r, 12000));
const info = await evaluate(`(() => {
	const el = document.querySelector('devframes-dock-embedded');
	if (!el) return { present: false, url: location.href, body: [...document.body.children].map(x => x.tagName) };
	const cs = getComputedStyle(el);
	const r = el.getBoundingClientRect();
	const sr = el.shadowRoot;
	const kids = sr ? [...sr.children].map(k => {
		const kcs = getComputedStyle(k);
		const kr = k.getBoundingClientRect();
		return { tag: k.tagName, display: kcs.display, visibility: kcs.visibility, opacity: kcs.opacity, position: kcs.position, zIndex: kcs.zIndex, rect: [kr.x, kr.y, kr.width, kr.height].map(Math.round), cls: k.className?.toString?.().slice(0,80) };
	}) : null;
	return {
		present: true,
		url: location.href,
		host: { display: cs.display, position: cs.position, zIndex: cs.zIndex, visibility: cs.visibility, opacity: cs.opacity, rect: [r.x, r.y, r.width, r.height].map(Math.round), attrs: [...el.attributes].map(a => a.name + '=' + a.value) },
		kids,
		connectionMeta: window.__DEVTOOLS__ ?? null
	};
})()`);
console.log(JSON.stringify(info, null, 2));
ws.close();
