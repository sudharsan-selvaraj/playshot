import type {
  Page,
  TestInfo,
  PageAssertionsToHaveScreenshotOptions,
  Expect,
} from "@playwright/test";
import _ from "lodash";

type CloudVisualRegressionOptions = {
  adapter?: StorageAdapter;
  screenShotsBasePath: string;
};

class VisualMatcher {
  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
    private readonly matchOption: CloudVisualRegressionOptions,
    private readonly expect: Expect
  ) {}

  async toHaveScreenShot(options?: PageAssertionsToHaveScreenshotOptions);
  async toHaveScreenShot(
    nameOrOptions?: string | string[] | PageAssertionsToHaveScreenshotOptions,
    options?: PageAssertionsToHaveScreenshotOptions
  ) {
    let name: string | string[],
      opts = {};
    if (
      (nameOrOptions && _.isString(nameOrOptions)) ||
      _.isArray(nameOrOptions)
    ) {
      name = nameOrOptions;
      opts = options;
    } else if (nameOrOptions && _.isPlainObject(nameOrOptions)) {
      opts = nameOrOptions;
    }

    const { adapter } = this.matchOption;

    try {
      await this.expect(this.page).toHaveScreenshot(name, options);
    } catch (err) {
      throw err;
    }
  }
}

class PlaywrighCloudVisualRegression {
  constructor(private readonly options: CloudVisualRegressionOptions) {}

  createMatcher(page: Page, testInfo: TestInfo, expect: Expect) {
    return new VisualMatcher(page, testInfo, this.options, expect);
  }
}

export { PlaywrighCloudVisualRegression, VisualMatcher };
