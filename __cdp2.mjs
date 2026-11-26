const PORT = 9333;
const PAGE = process.argv[2] ?? 'http://localhost:5174/';

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const target = list.find((p) => p.type === 'page');
if (!target) throw new Error('no page target');

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const events = [];

ws.addEventListener('message', (e) => {
	const msg = JSON.parse(e.data);
	if (msg.id && pending.has(msg.id)) {
		pending.get(msg.id)(msg);
		pending.delete(msg.id);
		return;
	}
	const p = msg.params;
	switch (msg.method) {
		case 'Runtime.consoleAPICalled':
			events.push(`console.${p.type}: ` + p.args.map((a) => a.value ?? a.description ?? a.type).join(' '));
			break;
		case 'Runtime.exceptionThrown':
			events.push('EXCEPTION: ' + (p.exceptionDetails.exception?.description ?? p.exceptionDetails.text));
			break;
		case 'Log.entryAdded':
			events.push(`log.${p.entry.level}: ${p.entry.text}${p.entry.url ? ' (' + p.entry.url + ')' : ''}`);
			break;
		case 'Network.requestWillBeSent':
			if (/__devtools|devframe/.test(p.request.url)) events.push(`REQ ${p.request.url}`);
			break;
		case 'Network.responseReceived':
			if (/__devtools|devframe/.test(p.response.url)) events.push(`RES ${p.response.status} ${p.response.url}`);
			break;
		case 'Network.loadingFailed':
			events.push(`FAILED ${p.errorText} ${p.blockedReason ?? ''}`);
			break;
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
	if (res.result?.exceptionDetails) return { error: res.result.exceptionDetails.text };
	return res.result?.result?.value;
};

await send('Runtime.enable');
await send('Log.enable');
await send('Network.enable');
await send('Page.enable');
await send('Page.navigate', { url: PAGE });
await new Promise((r) => setTimeout(r, 12000));

const info = await evaluate(`(() => {
	const el = document.querySelector('devframes-dock-embedded');
	const scripts = [...document.querySelectorAll('script')].map(s => s.src || ('inline:' + (s.textContent||'').slice(0,40)));
	const resources = performance.getEntriesByType('resource').map(r => r.name).filter(n => /__devtools|devframe/.test(n));
	return {
		title: document.title,
		dockElement: el ? { connected: el.isConnected, children: el.shadowRoot ? el.shadowRoot.innerHTML.slice(0, 300) : null } : null,
		bodyChildren: [...document.body.children].map(x => x.tagName + (x.id ? '#' + x.id : '')),
		scripts,
		resources,
		storage: { local: Object.keys(localStorage), session: Object.keys(sessionStorage) },
		errorOverlay: !!document.querySelector('vite-error-overlay')
	};
})()`);
console.log(JSON.stringify(info, null, 2));
console.log('--- events ---');
console.log(events.join('\n'));

const shot = await send('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) {
	const fs = await import('node:fs');
	fs.writeFileSync(process.env.TEMP + '/oc-cdp-shot.png', Buffer.from(shot.result.data, 'base64'));
	console.log('screenshot saved');
}
ws.close();
