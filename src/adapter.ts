interface StorageAdapter {
  verifyConnection(): Promise<boolean>;
  fetchScreenShot(filepathOnDisk: string, basePath: string): Promise<string>;
  saveScreenShot(filepathOnDisk: string, basePath: string): Promise<void>;
}
