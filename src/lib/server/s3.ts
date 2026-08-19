import {
	S3_ACCESS_KEY_ID,
	S3_BUCKET_NAME,
	S3_ENDPOINT,
	S3_SECRET_ACCESS_KEY
} from '$env/static/private';
import { PUBLIC_CDN_ENDPOINT } from '$env/static/public';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const S3 = new S3Client({
	region: 'auto',
	endpoint: S3_ENDPOINT,
	credentials: {
		accessKeyId: S3_ACCESS_KEY_ID,
		secretAccessKey: S3_SECRET_ACCESS_KEY
	}
});

/**
 * Converts an image to webp, optionally resized it, and uploads it to S3 with the given key.
 */
async function uploadImage(
	buffer: ArrayBuffer,
	key: string,
	opts?: { width?: number; height?: number }
) {
	const converted = await sharp(buffer).webp({ lossless: true }).resize(opts).toBuffer();

	const command = new PutObjectCommand({
		Bucket: S3_BUCKET_NAME,
		Key: key,
		Body: converted,
		ContentType: `image/webp`
	});

	await S3.send(command);
}

async function deleteFile(key: string) {
	const command = new DeleteObjectCommand({
		Bucket: S3_BUCKET_NAME,
		Key: key
	});

	await S3.send(command);
}

export default { uploadImage, deleteFile };
