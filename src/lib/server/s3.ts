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
	S3 as S3Client
} from '@aws-sdk/client-s3';

class S3 {
	#client: S3Client;
	#bucket: string;

	constructor(client: S3Client, bucket: string) {
		this.#client = client;
		this.#bucket = bucket;
	}

	/**
	 * Uploads a webp image to S3.
	 */
	async uploadImage(buffer: Buffer, key: string) {
		const command = new PutObjectCommand({
			Bucket: this.#bucket,
			Key: key,
			Body: buffer,
			ContentType: `image/webp`
		});

		await this.#client.send(command);
	}

	async deleteFile(key: string) {
		const command = new DeleteObjectCommand({
			Bucket: this.#bucket,
			Key: key
		});

		await this.#client.send(command);
	}

	async copyFile(sourceKey: string, destinationKey: string) {
		const command = new CopyObjectCommand({
			Bucket: this.#bucket,
			CopySource: `${this.#bucket}/${sourceKey}`,
			Key: destinationKey
		});

		await this.#client.send(command);
	}
}

const client = new S3Client({
	region: 'auto',
	endpoint: S3_ENDPOINT,
	credentials: {
		accessKeyId: S3_ACCESS_KEY_ID,
		secretAccessKey: S3_SECRET_ACCESS_KEY
	}
});

const s3 = new S3(client, S3_BUCKET_NAME);

export default s3;
