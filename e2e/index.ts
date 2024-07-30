import { test as BaseTest, expect } from '@playwright/test';
import { PlayShot, VisualMatcher } from '../src';
import dotenv from 'dotenv';
import path from 'path';
import { s3Adapter } from './setup';

dotenv.config();

const playshot = new PlayShot({
  adapter: s3Adapter,
  remotePathDelimiter: '__screenshots__',
});

const test = BaseTest.extend<{ visualMatcher: VisualMatcher }>({
  visualMatcher: async ({ page }, use, testInfo) => {
    await use(playshot.createMatcher(page, testInfo));
  },
});

export const SCREEN_SHOT_DIRECTORY = path.join(
  __dirname,
  'tests',
  '__screenshots__',
);

export default test;
export { test };
