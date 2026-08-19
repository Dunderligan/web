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
function imageSrcUrl(path: string, { width, height }: { width: number; height?: number }) {
	let filters = `format=auto,fit=scale-down,width=${width}`;
	if (height) {
		filters += `,height=${height}`;
	}

	return srcUrl(`/cdn-cgi/image/${filters}${path}`);
}

/** Returns the S3 key for a roster logo. */
function rosterLogoKey(rosterId: string) {
	return `logos/${rosterId}.webp`;
}

function rosterLogoUrl(rosterId: string, { width, height }: { width: number; height?: number }) {
	return imageSrcUrl(rosterLogoKey(rosterId), { width, height });
}

function submissionLogoKey(submissionId: string) {
	return `submissions/${submissionId}.webp`;
}

function submissionLogoUrl(
	submissionId: string,
	{ width, height }: { width: number; height?: number }
) {
	return imageSrcUrl(submissionLogoKey(submissionId), { width, height });
}

export default {
	srcUrl,
	imageSrcUrl,
	rosterLogoKey,
	rosterLogoUrl,
	submissionLogoKey,
	submissionLogoUrl
};
