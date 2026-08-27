import { PUBLIC_CDN_ENDPOINT } from '$env/static/public';

/**
 * Returns a url to the CDN endpoint (specified via environment variable) with a path appended.
 * The path must not be prefixed with a forward slash.
 */
function srcUrl(key: string) {
	return `${PUBLIC_CDN_ENDPOINT}/${key}`;
}

/**
 * Returns a url to the Cloudflare Images endpoint with the specified transformations applied.
 * See https://developers.cloudflare.com/images/transform-images/transform-via-url/ for details.
 *
 * This assumes Images is configured on top of the CDN domain (called zones by cloudflare).
 */
function imageSrcUrl(key: string, opts?: { width?: number; height?: number }) {
	let filters = `format=auto,fit=scale-down`;
	if (opts?.width) {
		filters += `,width=${opts.width}`;
	}
	if (opts?.height) {
		filters += `,height=${opts.height}`;
	}

	return srcUrl(`cdn-cgi/image/${filters}/${key}`);
}

/** Returns the S3 key for a roster logo. */
function rosterLogoKey(rosterId: string) {
	return `logos/${rosterId}.webp`;
}

function rosterLogoUrl(rosterId: string, opts?: { width?: number; height?: number }) {
	return imageSrcUrl(rosterLogoKey(rosterId), opts);
}

function submissionLogoKey(submissionId: string) {
	return `submissions/${submissionId}.webp`;
}

function awardLogoKey(awardTypeId: string) {
	return `awards/${awardTypeId}.webp`;
}

export default {
	srcUrl,
	imageSrcUrl,
	rosterLogoKey,
	rosterLogoUrl,
	submissionLogoKey,
	awardLogoKey
};
