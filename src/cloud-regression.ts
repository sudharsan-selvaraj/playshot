import type { Page, TestInfo } from '@playwright/test';
import _ from 'lodash';
import { CloudVisualRegressionOptions } from './types';
import { VisualMatcher } from './matcher';
import { expect } from '@playwright/test';
class PlaywrighCloudVisualRegression {
  constructor(private readonly options: CloudVisualRegressionOptions) {}

  async verifyConnection() {
    return this.options.adapter.verifyConnection();
  }

  createMatcher(page: Page, testInfo: TestInfo) {
    return new VisualMatcher(page, testInfo, this.options, expect);
  }
}

export { PlaywrighCloudVisualRegression };
