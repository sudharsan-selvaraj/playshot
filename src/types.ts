import { PageAssertionsToHaveScreenshotOptions } from '@playwright/test';

export type PlayShotOptions = {
  adapter: StorageAdapter;
  remotePathDelimiter: string;
};

export type ScreenshotAssertionOption =
  PageAssertionsToHaveScreenshotOptions & {
    update?: boolean;
  };
