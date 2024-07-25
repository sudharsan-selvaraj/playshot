import { test, expect } from '@playwright/test';
import fs from "fs";
test('has title', async ({ page }, testInfo) => {
  await page.goto('https://google.dev/');

  try {
    // Expect a title "to contain" a substring.
  await expect(page).toHaveScreenshot();
  await expect(page).toHaveScreenshot();
  } catch(err) {
   const oldAttachments = testInfo.attachments.map(a => {
      a.path = a.path ? `data:image/png;base64,${fs.readFileSync(a.path, "base64")}` : a.path
      return a;
    });
    testInfo.attachments.push(...JSON.parse(JSON.stringify(oldAttachments)));
    console.log(testInfo)
  }
});