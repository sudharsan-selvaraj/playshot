import { PageAssertionsToHaveScreenshotOptions } from '@playwright/test';

export type PlayShotOptions = {
  adapter: StorageAdapter;
  remotePathDelimiter: string;
  attachImagesToReport?: boolean;
};

export type ScreenshotAssertionOption =
  PageAssertionsToHaveScreenshotOptions & {
    update?: boolean;
  };
