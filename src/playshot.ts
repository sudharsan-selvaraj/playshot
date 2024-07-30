import type { Page, TestInfo } from '@playwright/test';
import _ from 'lodash';
import { PlayShotOptions } from './types';
import { PlayShotMatcher } from './matcher';
import { expect } from '@playwright/test';

class PlayShot {
  constructor(private readonly options: PlayShotOptions) {}

  async verifyConnection() {
    return this.options.adapter.verifyConnection();
  }

  createMatcher(page: Page, testInfo: TestInfo) {
    return new PlayShotMatcher(page, testInfo, this.options, expect);
  }
}

export { PlayShot };
