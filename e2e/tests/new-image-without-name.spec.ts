import { expect } from '@playwright/test';
import { test } from '../index';
import { getTestFileName, getFilesFromBucket } from '../utils';

test('test new image is uploaded to s3 if not present without default name', async ({
  page,
  playShot,
}, testInfo) => {
  test.setTimeout(0);
  const fileName = getTestFileName(testInfo);
  const imagePrefix = `${fileName}/${testInfo.title.split(' ').join('-')}`;
  await page.goto('https://the-internet.herokuapp.com/challenging_dom');
  await page.waitForSelector('table');

  let files = await getFilesFromBucket(fileName);

  expect(files.Contents).toBeFalsy();

  await playShot.soft.assertElement(page.locator('table'));
  files = await getFilesFromBucket(fileName);
  expect(files.Contents.length).toEqual(1);
  expect(files.Contents[0].Key).toEqual(`${imagePrefix}-1.png`);

  await playShot.soft.assertElement(page.locator('#canvas'));
  files = await getFilesFromBucket(fileName);
  expect(files.Contents.length).toEqual(2);
  expect(files.Contents.map((c) => c.Key)).toContain(`${imagePrefix}-2.png`);

  expect(testInfo.errors.length).toEqual(2);
});
