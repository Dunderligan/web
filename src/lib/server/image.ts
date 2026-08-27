import sharp from 'sharp';

async function convertToWebp(
	buffer: Buffer,
	opts?: { width?: number; height?: number }
): Promise<Buffer> {
	const converted = await sharp(buffer).webp({ lossless: true }).resize(opts).toBuffer();
	return converted;
}

async function trim(buffer: Buffer): Promise<Buffer> {
	const { data, info } = await sharp(buffer)
		.trim({ lineArt: true })
		.toBuffer({ resolveWithObject: true });

	// Already square after trimming.
	if (info.width === info.height) {
		return data;
	}

	// Expand the trimmed image to a square based on the larger dimension,
	// padding the shorter side so no content is cut off. Use a transparent
	// background when the image has an alpha channel, otherwise white.
	const size = Math.max(info.width, info.height);
	const background =
		info.channels < 4 ? { r: 255, g: 255, b: 255, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 0 };

	const image = sharp(data).resize({
		width: size,
		height: size,
		fit: 'contain',
		background
	});

	return await image.toBuffer();
}

export default { convertToWebp, trim };
