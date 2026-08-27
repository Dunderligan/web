import {
	S3_ACCESS_KEY_ID,
	S3_BUCKET_NAME,
	S3_ENDPOINT,
	S3_SECRET_ACCESS_KEY
} from '$env/static/private';
import {
	CopyObjectCommand,
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';
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
 * Uploads a webp image to S3.
 */
async function uploadImage(buffer: Buffer, key: string) {
	const command = new PutObjectCommand({
		Bucket: S3_BUCKET_NAME,
		Key: key,
		Body: buffer,
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

async function copyFile(sourceKey: string, destinationKey: string) {
	const command = new CopyObjectCommand({
		Bucket: S3_BUCKET_NAME,
		CopySource: `${S3_BUCKET_NAME}/${sourceKey}`,
		Key: destinationKey
	});

	await S3.send(command);
}

export default { uploadImage, deleteFile, copyFile };
