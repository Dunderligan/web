import { S3_ACCESS_KEY_ID, S3_ENDPOINT, S3_SECRET_ACCESS_KEY } from '$env/static/private';
import { S3Client } from '@aws-sdk/client-s3';

const S3 = new S3Client({
	region: 'auto',
	endpoint: S3_ENDPOINT,
	credentials: {
		accessKeyId: S3_ACCESS_KEY_ID,
		secretAccessKey: S3_SECRET_ACCESS_KEY
	}
});

export default S3;
