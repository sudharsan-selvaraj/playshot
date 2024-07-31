export class RemoteFileNotFoundException extends Error {
  constructor(filePath: string) {
    super(`Remote file not exits in path : ${filePath}`);

    Object.setPrototypeOf(this, RemoteFileNotFoundException.prototype);
  }
}
