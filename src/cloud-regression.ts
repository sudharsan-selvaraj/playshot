import type {
  Page,
  TestInfo,
  PageAssertionsToHaveScreenshotOptions,
  Locator,
} from "@playwright/test";
import { expect } from "@playwright/test";
import _ from "lodash";
import { SnapshotHelper } from "./SanpshotHelper";
import fs from "fs";
import path from "path";
import { RemoteFileNotFoundException } from "./errors";

type CloudVisualRegressionOptions = {
  adapter?: StorageAdapter;
  screenShotsBasePath: string;
};

type ScreenshotAssertionOption = PageAssertionsToHaveScreenshotOptions & {
  update?: boolean;
};

/*
 * Sample error message
 * Error: A snapshot doesn't exist at /Users/sudharsanselvaraj/Documents/git/oss/plawright-cloud-visuals/e2e/tests/__screenshots__/1800x992 darwin chromium/example.spec.ts/element/search.png, writing actual
 */
const IMAGE_PATH_REGEX = /at\s(.*\.(png|jpg|jpeg|gif|bmp|svg))/;

class VisualExpect {
  private softExpect: VisualExpect;
  private imageList = new Set<string>();

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
      options: opts || {},
    };
  }

  async assertPage(): Promise<void>;
  async assertPage(
    name: string | string[],
    options?: ScreenshotAssertionOption
  ): Promise<void>;
  async assertPage(
    name: string | string[],
    options: ScreenshotAssertionOption
  ): Promise<void>;
  async assertPage(
    nameOrOptions?: string | string[],
    options?: ScreenshotAssertionOption
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
    options: ScreenshotAssertionOption
  ): Promise<void>;
  async assertElement(
    element: Locator,
    name: string | string[],
    options: ScreenshotAssertionOption
  ): Promise<void>;
  async assertElement(
    element: Locator,
    nameOrOptions?: string | string[] | ScreenshotAssertionOption,
    options?: ScreenshotAssertionOption
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

  cleanUp() {
    this.imageList.forEach((image) => fs.unlinkSync(image));
    this.softExpect?.cleanUp();
  }

  private async toHaveScreenShot(
    name: string | string[],
    options: ScreenshotAssertionOption
  ): Promise<void> {
    const { adapter } = this.matchOption;
    const helper = new SnapshotHelper(this.testInfo, "png", name);
    const expectMethod = this.isSoftAssert ? expect.soft : expect;

    if (
      helper.expectedPath &&
      !fs.existsSync(helper.expectedPath) &&
      !options.update
    ) {
      try {
        const base64 = await adapter.fetchScreenShot(
          helper.expectedPath,
          this.matchOption.screenShotsBasePath
        );
        fs.mkdirSync(path.dirname(helper.expectedPath), { recursive: true });
        fs.writeFileSync(helper.expectedPath, base64, "base64");
      } catch (err) {
        if (err instanceof RemoteFileNotFoundException) {
          console.log(err.message);
        } else {
          throw err;
        }
      }
    }

    if (fs.existsSync(helper.expectedPath) && options.update) {
      fs.unlinkSync(helper.expectedPath);
    }

    await expectMethod(this.page).toHaveScreenshot(name || "", options);
    const filesToUpload = this.testInfo.errors
      .filter((e) =>
        e.message?.toLocaleLowerCase().includes("snapshot doesn't exist")
      )
      .map((e) => e.message?.toLocaleLowerCase().match(IMAGE_PATH_REGEX)[1])
      .filter(Boolean)
      .filter((f) => fs.existsSync(f));

    filesToUpload.forEach((f) => this.imageList.add(f));

    await Promise.all(
      filesToUpload.map((f) =>
        adapter.saveScreenShot(
          fs.readFileSync(f, { encoding: "base64" }),
          f,
          this.matchOption.screenShotsBasePath
        )
      )
    );
  }
}

class PlaywrighCloudVisualRegression {
  constructor(private readonly options: CloudVisualRegressionOptions) {}

  createMatcher(page: Page, testInfo: TestInfo) {
    return new VisualExpect(page, testInfo, this.options);
  }
}

export { PlaywrighCloudVisualRegression, VisualExpect };
