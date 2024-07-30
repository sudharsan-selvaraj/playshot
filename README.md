# `playwright-cloud-visuals`

`playwright-cloud-visuals` is a library designed to enhance the visual regression testing capabilities of Playwright. Unlike Playwright's built-in functionality, which stores screenshots locally, this library allows you to store screenshots on remote servers like Amazon S3 or SFTP servers, eliminating the need to manage screenshots in your local file system.

## Installation

You can install `playwright-cloud-visuals` via npm:

```bash
npm install playwright-cloud-visuals --save
```

## Basic Usage

**Create an instance of `PlaywrightCloudVisualRegression`:**

```javascript
const cloudVisuals = new PlaywrightCloudVisualRegression({
  adapter: s3Adapter, // or sshAdapter for SFTP
  remotePathDelimiter: '__screenshots__',
});
```

`remotePathDelimiter` is required to split the local file path to map it to s3 path.
For example if the `snapshotPathTemplate` path in config file is

```javascript
export default defineConfig({
  snapshotPathTemplate: `{testDir}/__screenshots__/{testFileName}/{arg}{ext}`,
  // other option
});
```

and if `remotePathDelimiter` is `__screenshots__`, the screenshots will be stored in s3 under `{testFileName}/{arg}{ext}` directory

Example:

1. Local file path: `/Users/user/tests/__screenshots__/test.spect.ts/test-existing-image-s3-without-name-1.png`
2. S3 Key for the same screenshot would be `test.spect.ts/test-existing-image-s3-without-name-1.png`

## Setting up adapters:

### Amazon S3 Adapter:

```javascript
const s3Adapter = new AmazonS3Adapter(new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: process.env.S3_REGION,
} as any), {
  bucket: process.env.S3_BUCKET, // bucket where the image to be stored
});
```

### SFTP adapter:

```javascript
const sftpAdapter = new SftpAdapter({
  remoteDirectory: '/home/user/visual-regressions',
  pathSeparator: '/', // for windows server it should be "\\"
  host: 'localhost', // remote host name
  username: '',
  password: '',
  port: 22,
});
```

## Creating matcher object and use it in your tests:

```javascript
import { test, expect } from '@playwright/test';
import { PlaywrightCloudVisualRegression } from 'playwright-cloud-visuals';

const cloudVisuals = new PlaywrightCloudVisualRegression({
  adapter: s3Adapter, // or sshAdapter for SFTP
  remotePathDelimiter: '__screenshots__',
});

test('snapshot test', async ({ page }, testInfo) => {
  const visualMatcher = cloudVisuals.createMatcher(page, testInfo);

  await page.goto('https://www.google.com');
  await visualMatcher.assertPage();
  // or
  await visualMatcher.assertElement(page.locator('table')); // asserts a specific web element
  await visualMatcher.assertPage({
    fullScreen: true, // asserts the full page
  });
});
```

Both will support all options supported by native `toHaveScreenshot` matcher provided by playwright.

## Configuting mather via fixtures:

The easiest way to configure the matchers is by using playwright test fixtures

### extended-test.ts

```javscript
import { test as BaseTest, expect } from '@playwright/test';
import { PlaywrightCloudVisualRegression } from 'playwright-cloud-visuals';

const cloudVisuals = new PlaywrightCloudVisualRegression({
  adapter: s3Adapter, // or sshAdapter for SFTP
  remotePathDelimiter: '__screenshots__',
});

const test = BaseTest.extend<{ visualMatcher: VisualMatcher }>({
  visualMatcher: async ({ page }, use, testInfo) => {
    await use(cloudVisuals.createMatcher(page, testInfo));
  },
});

export default test;
```

### visual-test.spec.ts

```javascript
import test from './extended-test';

test('snapshot test', async ({ page, visualMatcher }) => {
  await page.goto('https://www.google.com');
  await visualMatcher.assertPage();
  await visualMatcher.assertElement(page.locator('table')); // asserts a specific web element
  await visualMatcher.assertPage({
    fullScreen: true, // asserts the full page
  });
});
```

## Advanced Features

- **Automatic Screenshot Upload**: Missing screenshots are automatically pushed to the remote server based on test failures. You dont need to save the screenshots to the version control.
- **Screenshot Update**: Users can individually update screenshots when the UI changes.
- **Flexible Validation**: Methods for validating visual regression for both pages and individual web elements:

  - `await visualMatcher.assertElement(locator);`
  - `await visualMatcher.assertPage();`
  - `await visualMatcher.assertPage({ fullScreen: true })`

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
