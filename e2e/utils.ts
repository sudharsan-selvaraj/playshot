import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { SCREEN_SHOT_DIRECTORY } from './index';
import fs from 'fs';
import { TestInfo } from '@playwright/test';
import path from 'path';
import { s3Client } from './setup';

export function clearLocalScreenshots() {
  fs.rmSync(SCREEN_SHOT_DIRECTORY, { recursive: true, force: true });
}

export function createBucket(bucketName: string) {
  return s3Client.send(
    new CreateBucketCommand({
      Bucket: bucketName,
    }),
  );
}

export async function deleteBucket(bucketName: string) {
  const files = await getFilesFromBucket('', bucketName);

  if (files.Contents) {
    await Promise.all(
      files.Contents.map((c) => {
        return s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucketName,
            Key: c.Key,
          }),
        );
      }),
    );
  }

  return s3Client.send(
    new DeleteBucketCommand({
      Bucket: bucketName,
    }),
  );
}

export function getFilesFromBucket(
  prefix: string,
  bucketName = process.env.S3_BUCKET,
) {
  return s3Client.send(
    new ListObjectsCommand({
      Bucket: bucketName,
      Prefix: prefix,
    }),
  );
}

export function getTestFileName(testInfo: TestInfo) {
  return path.basename(testInfo.file);
}

export async function uploadDemoFiles(
  bucketName: string,
  files: { file: string; remotePath: string }[],
) {
  await Promise.all(
    files.map((info) => {
      const base64String = fs.readFileSync(info.file, 'base64');
      const body = Buffer.from(base64String, 'base64');
      return s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: info.remotePath,
          Body: body,
          ContentEncoding: 'base64',
          ContentType: 'image/png',
        }),
      );
    }),
  );
}
