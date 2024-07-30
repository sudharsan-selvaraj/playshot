import { S3Client } from '@aws-sdk/client-s3';
import { createBucket, deleteBucket } from './utils';
import { AmazonS3Adapter } from '../src/storage-adapters/amazon-s3-adapter';
import { SftpAdapter } from '../src/storage-adapters/sftp-adapter';

const s3Client = new S3Client({
  forcePathStyle: true,
  endpoint: process.env.S3_HOST, //
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY, //'4jdGFPdKG5KOhmm6Ja6g',
    secretAccessKey: process.env.S3_SECRET_KEY, //'dpQLkXz4Pjfy5MVIY7ZBPtM0oDLhSEwY65Ejgtac',
  },
  region: process.env.S3_REGION, //us-east-1
} as any);

const s3Adapter = new AmazonS3Adapter(s3Client, {
  bucket: process.env.S3_BUCKET, //'visual-regression',
});

const sshAdapter = new SftpAdapter({
  remoteDirectory: '/home/user/visual-regressions',
  pathSeparator: '/',
  host: 'localhost',
  username: '',
  password: '',
  port: 22,
});

export default async function globalSetup() {
  try {
    await deleteBucket(process.env.S3_BUCKET);
  } catch (err) {
    console.log(`Error deleting s3 bucket ${err}`);
  }
  await createBucket(process.env.S3_BUCKET);
}

export { s3Client, s3Adapter };
