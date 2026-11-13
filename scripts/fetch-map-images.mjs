#!/usr/bin/env node
/**
 * Downloads map screenshots from the OverFast API and stores them as webp files
 * under static/maps, named after the map slugs in the database.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const API_URL = 'https://overfast-api.tekrop.fr/maps';
const OUTPUT_DIR = path.resolve('static/maps');

/** The map slugs seeded into the database, in the same order. */
const MAP_SLUGS = [
	'antarctic-peninsula',
	'busan',
	'ilios',
	'lijiang-tower',
	'nepal',
	'oasis',
	'samoa',
	'circuit-royal',
	'dorado',
	'havana',
	'junkertown',
	'rialto',
	'route-66',
	'shambali-monastery',
	'watchpoint-gibraltar',
	'watchpoint-grimsvotn',
	'aatlis',
	'new-junk-city',
	'suravasa',
	'blizzard-world',
	'eichenwalde',
	'hollywood',
	'kings-row',
	'midtown',
	'neon-junction',
	'numbani',
	'paraiso',
	'colosseo',
	'esperanca',
	'new-queen-street',
	'runasapi',
	'hanaoka',
	'throne-of-anubis'
];

/** Some database slugs differ from the OverFast map keys. */
const REMOTE_KEY_ALIASES = {
	'watchpoint-grimsvotn': 'grimsvotn'
};

/** The API's own static server is missing a few files; the repository copy is a fallback. */
const RAW_BASE_URL = 'https://raw.githubusercontent.com/TeKrop/overfast-api/main/static/maps';

/** All map images are stored at the same maximum size, without cropping or upscaling. */
const MAX_WIDTH = 1000;
const MAX_HEIGHT = 563;

const response = await fetch(API_URL);
if (!response.ok) {
	throw new Error(`Failed to fetch the map catalogue: ${response.status} ${response.statusText}`);
}

const remoteMaps = await response.json();
await mkdir(OUTPUT_DIR, { recursive: true });

for (const slug of MAP_SLUGS) {
	const remoteKey = REMOTE_KEY_ALIASES[slug] ?? slug;
	const map = remoteMaps.find((entry) => entry.key === remoteKey);

	if (!map) {
		throw new Error(`No remote map found for "${slug}" (remote key "${remoteKey}")`);
	}

	const source = await downloadImage(map.screenshot, `${RAW_BASE_URL}/${remoteKey}.jpg`);
	const webp = await sharp(source)
		.resize({ width: MAX_WIDTH, height: MAX_HEIGHT, fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 82, effort: 6 })
		.toBuffer();
	const target = path.join(OUTPUT_DIR, `${slug}.webp`);

	await writeFile(target, webp);
	console.log(`${slug}.webp <- ${map.screenshot}`);
}

console.log(`Wrote ${MAP_SLUGS.length} map images to ${OUTPUT_DIR}`);

async function downloadImage(...urls) {
	let lastStatus = '';

	for (const url of urls) {
		const imageResponse = await fetch(url);
		if (imageResponse.ok) {
			return Buffer.from(await imageResponse.arrayBuffer());
		}

		lastStatus = `${imageResponse.status} ${imageResponse.statusText}`;
	}

	throw new Error(`Failed to download ${urls[0]}: ${lastStatus}`);
}
