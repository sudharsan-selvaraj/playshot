import type { Page, TestInfo, Locator, Expect } from '@playwright/test';
import _ from 'lodash';
import { SnapshotHelper } from './snapshot-helper';
import fs from 'fs';
import path from 'path';
import { RemoteFileNotFoundException } from './errors';
import { PlayShotOptions, ScreenshotAssertionOption } from './types';

/*
 * Sample error message
 * Error: A snapshot doesn't exist at /Users/username//e2e/tests/__screenshots__/1800x992 darwin chromium/example.spec.ts/element/search.png, writing actual
 */
const IMAGE_PATH_REGEX = /at\s(.*\.(png|jpg|jpeg|gif|bmp|svg))/;

export class PlayShotMatcher {
  private softExpect: PlayShotMatcher;
  private imageList = new Set<string>();

  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
    private readonly matchOption: PlayShotOptions,
    private readonly expect: Expect,
    private readonly isSoftAssert: boolean = false,
  ) {}

  public get soft() {
    if (!this.softExpect) {
      this.softExpect = new PlayShotMatcher(
        this.page,
        this.testInfo,
        this.matchOption,
        this.expect,
        true,
      );
    }
    return this.softExpect;
  }

  private getAsserionOptions(
    nameOrOptions?: string | string[] | ScreenshotAssertionOption,
    options?: ScreenshotAssertionOption,
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
      name: (name || '') as string,
      options: opts || {},
    };
  }

  async assertPage(): Promise<void>;
  async assertPage(
    name: string | string[] | ScreenshotAssertionOption,
    options?: ScreenshotAssertionOption,
  ): Promise<void>;
  async assertPage(
    name: string | string[],
    options: ScreenshotAssertionOption,
  ): Promise<void>;
  async assertPage(
    nameOrOptions?: string | string[] | ScreenshotAssertionOption,
    options?: ScreenshotAssertionOption,
  ): Promise<void> {
    const { name, options: opts } = this.getAsserionOptions(
      nameOrOptions as string,
      options,
    );
    await this.toHaveScreenShot(name, opts);
  }

  async assertElement(element: Locator): Promise<void>;
  async assertElement(element: Locator, name: string | string[]): Promise<void>;
  async assertElement(
    element: Locator,
    options: ScreenshotAssertionOption,
  ): Promise<void>;
  async assertElement(
    element: Locator,
    name: string | string[],
    options: ScreenshotAssertionOption,
  ): Promise<void>;
  async assertElement(
    element: Locator,
    nameOrOptions?: string | string[] | ScreenshotAssertionOption,
    options?: ScreenshotAssertionOption,
  ) {
    const { name, options: opts } = this.getAsserionOptions(
      nameOrOptions as string,
      options,
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
    options: ScreenshotAssertionOption,
  ): Promise<void> {
    const { adapter } = this.matchOption;
    const helper = new SnapshotHelper(this.testInfo, 'png', name);
    const expectMethod = this.isSoftAssert ? this.expect.soft : this.expect;

    if (
      helper.expectedPath &&
      !fs.existsSync(helper.expectedPath) &&
      !options.update
    ) {
      try {
        const base64 = await adapter.fetchScreenShot(
          helper.expectedPath,
          this.matchOption.remotePathDelimiter,
        );
        if (base64) {
          fs.mkdirSync(path.dirname(helper.expectedPath), { recursive: true });
          fs.writeFileSync(helper.expectedPath, base64, 'base64');
        }
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
    try {
      await expectMethod(this.page).toHaveScreenshot(name || '', options);
    } catch (err) {
      throw err;
    } finally {
      this.attachFailureScreenshotToReport();
    }

    const filesToUpload = this.testInfo.errors
      .map((e) => e.message?.toLocaleLowerCase())
      .filter((message) => message.includes("snapshot doesn't exist"))
      .map((message) => message.match(IMAGE_PATH_REGEX)[1])
      .filter((f) => f && fs.existsSync(f));

    filesToUpload.forEach((f) => this.imageList.add(f));

    await Promise.all(
      filesToUpload.map((f) =>
        adapter.saveScreenShot(f, this.matchOption.remotePathDelimiter),
      ),
    );
  }

  private async attachFailureScreenshotToReport() {
    if (this.matchOption.attachImagesToReport) {
      const oldAttachments = this.testInfo.attachments.map((a) => {
        a.path = a.path
          ? `data:image/png;base64,${fs.readFileSync(a.path, 'base64')}`
          : a.path;
        return a;
      });
      // attach base64 encoded image to the html report
      this.testInfo.attachments.push(
        ...JSON.parse(JSON.stringify(oldAttachments)),
      );
    }
  }
}
