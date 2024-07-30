import { expect } from '@playwright/test';
import { SCREEN_SHOT_DIRECTORY, test } from '../index';
import { getTestFileName, uploadDemoFiles } from '../utils';
import fs from 'fs';
import path from 'path';

test.beforeAll(async ({}, testInfo) => {
  const fileName = getTestFileName(testInfo);
  const demoScreenshotsFolder = path.join(__dirname, '..', 'demo-screenshots');
  await uploadDemoFiles(process.env.S3_BUCKET, [
    {
      file: path.join(demoScreenshotsFolder, 'page', 'page.png'),
      remotePath: `${fileName}/page/page.png`,
    },
    {
      file: path.join(demoScreenshotsFolder, 'table.png'),
      remotePath: `${fileName}/table.png`,
    },
    {
      file: path.join(
        demoScreenshotsFolder,
        'test-existing-image-s3-without-name-1.png',
      ),
      remotePath: `${fileName}/test-existing-image-s3-without-name-1.png`,
    },
    {
      file: path.join(
        demoScreenshotsFolder,
        'test-existing-image-s3-without-name-2.png',
      ),
      remotePath: `${fileName}/test-existing-image-s3-without-name-2.png`,
    },
  ]);
});

test('test existing image s3 with name', async ({
  page,
  visualMatcher,
}, testInfo) => {
  test.setTimeout(0);
  const fileName = getTestFileName(testInfo);
  await page.goto('https://the-internet.herokuapp.com/challenging_dom');
  await page.waitForSelector('table');
  await visualMatcher.soft.assertElement(page.locator('table'), 'table.png');
  expect(
    fs.existsSync(path.join(SCREEN_SHOT_DIRECTORY, fileName, 'table.png')),
  );

  await page.goto('https://the-internet.herokuapp.com/forgot_password');
  await visualMatcher.soft.assertPage(['page', 'page.png']);
  expect(
    fs.existsSync(
      path.join(SCREEN_SHOT_DIRECTORY, fileName, 'page', 'page.png'),
    ),
  );
});

test('test existing image s3 without name', async ({
  page,
  visualMatcher,
}, testInfo) => {
  test.setTimeout(0);
  const fileName = getTestFileName(testInfo);
  await page.goto('https://the-internet.herokuapp.com/challenging_dom');
  await page.waitForSelector('table');
  await visualMatcher.soft.assertElement(page.locator('table'));
  expect(
    fs.existsSync(
      path.join(
        SCREEN_SHOT_DIRECTORY,
        fileName,
        'test-existing-image-s3-without-name-1.png',
      ),
    ),
  );

  await page.goto('https://the-internet.herokuapp.com/forgot_password');
  await visualMatcher.soft.assertPage();
  expect(
    fs.existsSync(
      path.join(
        SCREEN_SHOT_DIRECTORY,
        fileName,
        'test-existing-image-s3-without-name-2.png',
      ),
    ),
  );
});
