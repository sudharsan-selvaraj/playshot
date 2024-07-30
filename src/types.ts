import { PageAssertionsToHaveScreenshotOptions } from '@playwright/test';

export type CloudVisualRegressionOptions = {
  adapter: StorageAdapter;
  remotePathDelimiter: string;
};

export type ScreenshotAssertionOption =
  PageAssertionsToHaveScreenshotOptions & {
    update?: boolean;
  };
