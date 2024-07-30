import Sftp, { ConnectOptions } from "ssh2-sftp-client";
import path from "path";
import { RemoteFileNotFoundException } from "../errors";
import fs from "fs";

export type SftpAdapterOptions = ConnectOptions & {
  remoteDirectory: string;
  pathSeparator: string;
};

export class SftpAdapter implements StorageAdapter {
  private readonly sftpClient: Sftp = new Sftp();

  constructor(private readonly options: SftpAdapterOptions) {}

  private getRemoteFilePath(filepathOnDisk: string, basePath: string) {
    return path
      .join(this.options.remoteDirectory, filepathOnDisk.split(basePath)[1])
      .replace(path.sep, this.options.pathSeparator);
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.sftpClient.connect(this.options);
      return true;
    } catch (err) {
      throw new Error(`Unable to connect to remote SSH Server. ${err}`);
    }
  }

  async fetchScreenShot(
    filepathOnDisk: string,
    basePath: string
  ): Promise<string> {
    const remoteFilePath = this.getRemoteFilePath(filepathOnDisk, basePath);
    try {
      fs.mkdirSync(path.dirname(filepathOnDisk), { recursive: true });
      await this.sftpClient.get(remoteFilePath, filepathOnDisk);
      return "";
    } catch (err) {
      fs.unlinkSync(filepathOnDisk);
      throw new RemoteFileNotFoundException(err);
    }
  }

  async saveScreenShot(
    filepathOnDisk: string,
    basePath: string
  ): Promise<void> {
    const remoteFilePath = this.getRemoteFilePath(filepathOnDisk, basePath);
    await this.sftpClient.mkdir(path.dirname(remoteFilePath), true);
    await this.sftpClient.put(filepathOnDisk, remoteFilePath);
  }
}
