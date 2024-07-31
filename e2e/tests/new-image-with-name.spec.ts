import { expect } from '@playwright/test';
import { SCREEN_SHOT_DIRECTORY, test } from '../index';
import { getTestFileName, getFilesFromBucket } from '../utils';
import fs from 'fs';
import path from 'path';

test('test new image is Uploaded to s3 if not present with Default name', async ({
  page,
  playShot,
}, testInfo) => {
  test.setTimeout(0);
  const fileName = getTestFileName(testInfo);
  await page.goto('https://the-internet.herokuapp.com/challenging_dom');
  await page.waitForSelector('table');

  let files = await getFilesFromBucket(fileName);

  expect(files.Contents).toBeFalsy();

  expect(
    fs.existsSync(path.join(SCREEN_SHOT_DIRECTORY, fileName, 'table.png')),
  ).toEqual(false);
  await playShot.soft.assertElement(page.locator('table'), 'table.png');
  files = await getFilesFromBucket(fileName);
  expect(files.Contents.length).toEqual(1);
  expect(files.Contents[0].Key).toEqual(`${fileName}/table.png`);
  expect(
    fs.existsSync(path.join(SCREEN_SHOT_DIRECTORY, fileName, 'table.png')),
  ).toEqual(true);

  expect(
    fs.existsSync(
      path.join(SCREEN_SHOT_DIRECTORY, fileName, 'sub-folder', 'canvas.png'),
    ),
  ).toEqual(false);
  await playShot.soft.assertElement(page.locator('#canvas'), [
    'sub-folder',
    'canvas.png',
  ]);
  files = await getFilesFromBucket(fileName);
  expect(files.Contents.length).toEqual(2);
  expect(files.Contents.map((c) => c.Key)).toContain(
    `${fileName}/sub-folder/canvas.png`,
  );
  expect(
    fs.existsSync(
      path.join(SCREEN_SHOT_DIRECTORY, fileName, 'sub-folder', 'canvas.png'),
    ),
  ).toEqual(true);

  expect(testInfo.errors.length).toEqual(2);
});
