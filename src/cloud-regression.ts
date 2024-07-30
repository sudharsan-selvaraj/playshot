import type {
  Page,
  TestInfo,
  PageAssertionsToHaveScreenshotOptions,
  Locator,
} from "@playwright/test";
import { expect } from "@playwright/test";
import _ from "lodash";
import { SnapshotHelper } from "./SanpshotHelper";

type CloudVisualRegressionOptions = {
  adapter?: StorageAdapter;
  screenShotsBasePath: string;
};

type ScreenshotAssertionOption = PageAssertionsToHaveScreenshotOptions & {
  element?: Locator;
};

class VisualExpect {
  private softExpect: VisualExpect;
  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
    private readonly matchOption: CloudVisualRegressionOptions,
    private readonly isSoftAssert: boolean = false
  ) {}

  public get soft() {
    if (!this.softExpect) {
      this.softExpect = new VisualExpect(
        this.page,
        this.testInfo,
        this.matchOption,
        true
      );
    }
    return this.softExpect;
  }

  private getAsserionOptions(
    nameOrOptions?: string | string[] | ScreenshotAssertionOption,
    options?: ScreenshotAssertionOption
  ): {
    name: string;
    options: ScreenshotAssertionOption;
  } {
    let name: string | string[] | undefined,
      opts = {} as ScreenshotAssertionOption;
    if (
      (nameOrOptions && _.isString(nameOrOptions)) ||
      _.isArray(nameOrOptions)
    ) {
      name = nameOrOptions;
      opts = options;
    } else if (nameOrOptions && _.isPlainObject(nameOrOptions)) {
      opts = nameOrOptions as ScreenshotAssertionOption;
    }

    return {
      name: (name || "") as string,
      options: opts,
    };
  }

  async assertPage(): Promise<void>;
  async assertPage(
    name: string | string[],
    options?: PageAssertionsToHaveScreenshotOptions
  ): Promise<void>;
  async assertPage(
    name: string | string[],
    options: PageAssertionsToHaveScreenshotOptions
  ): Promise<void>;
  async assertPage(
    nameOrOptions?: string | string[],
    options?: PageAssertionsToHaveScreenshotOptions
  ): Promise<void> {
    const { name, options: opts } = this.getAsserionOptions(
      nameOrOptions as string,
      options
    );
    await this.toHaveScreenShot(name, opts);
  }

  async assertElement(element: Locator): Promise<void>;
  async assertElement(element: Locator, name: string | string[]): Promise<void>;
  async assertElement(
    element: Locator,
    options: PageAssertionsToHaveScreenshotOptions
  ): Promise<void>;
  async assertElement(
    element: Locator,
    name: string | string[],
    options: PageAssertionsToHaveScreenshotOptions
  ): Promise<void>;
  async assertElement(
    element: Locator,
    nameOrOptions?: string | string[] | PageAssertionsToHaveScreenshotOptions,
    options?: PageAssertionsToHaveScreenshotOptions
  ) {
    const { name, options: opts } = this.getAsserionOptions(
      nameOrOptions as string,
      options
    );
    await this.toHaveScreenShot(name, {
      ...opts,
      clip: await element.boundingBox(),
    });
  }

  private async toHaveScreenShot(
    name: string | string[],
    options: ScreenshotAssertionOption
  ): Promise<void> {
    const { adapter } = this.matchOption;
    const helper = new SnapshotHelper(this.testInfo, "png", name);
    const expectMethod = this.isSoftAssert ? expect.soft : expect;

    console.log(helper.expectedPath);
    await expectMethod(this.page).toHaveScreenshot(name || "", options);
  }
}

class PlaywrighCloudVisualRegression {
  constructor(private readonly options: CloudVisualRegressionOptions) {}

  createMatcher(page: Page, testInfo: TestInfo) {
    return new VisualExpect(page, testInfo, this.options);
  }
}

export { PlaywrighCloudVisualRegression, VisualExpect };
