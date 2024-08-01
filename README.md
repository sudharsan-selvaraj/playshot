# `playshot`

`playshot` is a library designed to enhance the visual regression testing capabilities of Playwright. Unlike Playwright's built-in functionality, which stores screenshots locally, this library allows you to store screenshots on remote servers like Amazon S3 or SFTP servers, eliminating the need to manage screenshots in your local file system.

## Installation

You can install `playshot` via npm:

```bash
npm install playshot --save
```

## Basic Usage

Create an instance of `PlayShot`:

```javascript
const playshot = new PlayShot({
  adapter: s3Adapter, // or sshAdapter for SFTP
  remotePathDelimiter: '__screenshots__',
});
```

The `remotePathDelimiter` is a required parameter that specifies how to divide the local file path to correspond with the storage path on S3 or on remote sftp server.

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
2. The corresponding S3 key for this screenshot would be `test.spect.ts/test-existing-image-s3-without-name-1.png` under the `bucket` configured in the adapter.

## Options:

| Name                 | type           | Required | Description                                                                                                                                                                                                                                                                                                       |   |
|----------------------|----------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---|
| adapter              | StorageAdapter | Yes      | Adpater that handles the storage and retrieval of images from remote server eg: AmazonS3Adapter, SftpAdapter                                                                                                                                                                                                      |   |
| remotePathDelimiter  | String         | Yes      | Specifies how to divide the local file path to correspond with the storage path on S3 or on remote sftp server.                                                                                                                                                                                                   |   |
| attachImagesToReport | Boolean        | No       | When enabled, if screenshot matching fails, the plugin attaches the actual, expected, and difference images to the HTML report in base64 format. This feature is particularly useful when running tests in CI environments. <br>  **Note:** Enabling this feature will increase the file size of the HTML report. |   |

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
  bucket: process.env.S3_BUCKET, // bucket where the images are to be stored
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
import { PlayShot } from 'playshot';

const playshot = new PlayShot({
  adapter: s3Adapter, // or sshAdapter for SFTP
  remotePathDelimiter: '__screenshots__',
});

test('snapshot test', async ({ page }, testInfo) => {
  const playShot = playshot.createMatcher(page, testInfo);

  await page.goto('https://www.google.com');
  await playShot.assertPage();
  // or
  await playShot.assertElement(page.locator('table')); // asserts a specific web element
  await playShot.assertPage({
    fullScreen: true, // asserts the full page
  });
});
```

Both `assertElement` and `assertPage` methods support all the options available in the native `toHaveScreenshot` matcher provided by Playwright.

## Configuting matcher via fixtures:

The simplest way to configure the matchers is by using Playwright test fixtures.

### extended-test.ts

```javascript
import { test as BaseTest, expect } from '@playwright/test';
import { PlayShot } from 'playwright-cloud-visuals';

const playshot = new PlayShot({
  adapter: s3Adapter, // or sshAdapter for SFTP
  remotePathDelimiter: '__screenshots__',
});

const test =
  BaseTest.extend <{ playShot: PlayShotMatcher }>
  {
    playShot: async ({ page }, use, testInfo) => {
      await use(playshot.createMatcher(page, testInfo));
    },
  };

export default test;
```

### visual-test.spec.ts

```javascript
import test from './extended-test';

test('snapshot test', async ({ page, playShot }) => {
  await page.goto('https://www.google.com');
  await playShot.assertPage();
  await playShot.assertElement(page.locator('table')); // asserts a specific web element
  await playShot.assertPage({
    fullScreen: true, // asserts the full page
  });
});
```

## How It Works

1. When the assertion method is invoked via `assertElement` or `assertPage`, the plugin constructs the expected image path internally and checks if the image already exists on the remote server. If the image is found, it is downloaded and placed in the directory where Playwright looks for baseline screenshots.
2. If the tests are run for the first time and no baseline images are available, the plugin automatically identifies this and uploads the screenshot captured by Playwright to the remote server.
3. If the user explicitly wants to update an image, the plugin will replace the existing image with the newly captured screenshot.

## Advanced Features

- **Automatic Screenshot Upload**: Missing screenshots are automatically pushed to the remote server based on test failures. You dont need to save the screenshots to the version control.
- **Screenshot Update**: Users can individually update screenshots when the UI changes.

```javascript
await playShot.assertPage({
  update: true,
});
```

This will replace the existing image in remote server with the latest screenshot taken during test execution

- **Flexible Validation**: Methods for validating visual regression for both pages and individual web elements:

```javascript
await playShot.assertElement(locator);
await playShot.assertPage();
await playShot.assertPage({ fullScreen: true });
await playShot.assertPage('login-page.png');
await playShot.assertPage(['nested-folder', 'login-page.png']);
```

- **Support for Soft Assertions**: The library includes built-in support for soft assertions, which means that test failures will not halt the execution of subsequent test steps. The test will continue to run even if a soft assertion fails.

```javascript
await playShot.soft.assertElement(locator);
await playShot.soft.assertPage();
await playShot.soft.assertPage({ fullScreen: true });
await playShot.soft.assertPage('login-page.png');
await playShot.soft.assertPage(['nested-folder', 'login-page.png']);
```

## License

This project is licensed under MIT License - see the [LICENSE](LICENSE) file for details.
