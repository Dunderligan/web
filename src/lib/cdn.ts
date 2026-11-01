import { PUBLIC_CDN_ENDPOINT } from '$env/static/public';

class Cdn {
	/**
	 * Returns a url to the CDN endpoint (specified via environment variable) with a path appended.
	 * The path must not be prefixed with a forward slash.
	 */
	srcUrl(key: string) {
		return `${PUBLIC_CDN_ENDPOINT}/${key}`;
	}

	/**
	 * Returns a url to the Cloudflare Images endpoint with the specified transformations applied.
	 * See https://developers.cloudflare.com/images/transform-images/transform-via-url/ for details.
	 *
	 * This assumes Images is configured on top of the CDN domain (called zones by cloudflare).
	 */
	imageSrcUrl(key: string, opts?: { width?: number; height?: number }) {
		let filters = `format=auto,fit=scale-down`;
		if (opts?.width) {
			filters += `,width=${opts.width}`;
		}
		if (opts?.height) {
			filters += `,height=${opts.height}`;
		}

		return this.srcUrl(`cdn-cgi/image/${filters}/${key}`);
	}

	/** Returns the S3 key for a roster logo. */
	rosterLogoKey(rosterId: string) {
		return `logos/${rosterId}.webp`;
	}

	rosterLogoUrl(rosterId: string, opts?: { width?: number; height?: number }) {
		return this.imageSrcUrl(this.rosterLogoKey(rosterId), opts);
	}

	submissionLogoKey(submissionId: string) {
		return `submissions/${submissionId}.webp`;
	}

	awardLogoKey(awardTypeId: string) {
		return `awards/${awardTypeId}.webp`;
	}
}

const cdn = new Cdn();

export default cdn;
