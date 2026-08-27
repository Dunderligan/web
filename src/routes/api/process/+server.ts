import image from '$lib/server/image';

export const POST = async ({ request }) => {
	const data = await request.arrayBuffer();

	let buffer = await image.trim(Buffer.from(data));
	buffer = await image.convertToWebp(buffer);

	return new Response(new Uint8Array(buffer), {
		headers: {
			'Content-Type': 'image/webp'
		}
	});
};
