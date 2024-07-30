interface StorageAdapter {
  fetchScreenShot(filepathOnDisk: string, basePath: string): Promise<string>;
  saveScreenShot(
    base64String: string,
    filepathOnDisk: string,
    basePath: string
  ): Promise<void>;
}
