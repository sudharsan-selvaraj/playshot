import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { RemoteFileNotFoundException } from "../errors";

type AmazonS3AdapterOptions = {
  bucket: string;
};

export class AmazonS3Adapter implements StorageAdapter {
  constructor(
    private readonly s3Client: S3Client,
    private readonly options: AmazonS3AdapterOptions
  ) {}

  private getImageKey(filepathOnDisk: string, basePath: string) {
    return filepathOnDisk.split(basePath)[1];
  }

  async fetchScreenShot(
    filepathOnDisk: string,
    basePath: string
  ): Promise<string> {
    const key = this.getImageKey(filepathOnDisk, basePath);
    try {
      const body = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.options.bucket,
          Key: key,
        })
      );
      return body.Body.transformToString("base64");
    } catch (err) {
      throw new RemoteFileNotFoundException(key);
    }
  }

  async saveScreenShot(
    base64String: string,
    filepathOnDisk: string,
    basePath: string
  ): Promise<void> {
    const body = Buffer.from(base64String, "base64");
    const key = this.getImageKey(filepathOnDisk, basePath);
    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.options.bucket,
          Key: key,
          Body: body,
          ContentEncoding: "base64",
          ContentType: "image/png",
        })
      );
    } catch (err) {
      throw err;
    }
  }
}
