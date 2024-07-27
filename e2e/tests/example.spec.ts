import { test, expect } from "@playwright/test";
import { PlaywrighCloudVisualRegression } from "../../src/index";

test("has title", async ({ page }, testInfo) => {
  test.setTimeout(0);
  const regression = new PlaywrighCloudVisualRegression({
    screenShotsBasePath: "__screenshots__",
  });
  const visualAssert = regression.createMatcher(page, testInfo, expect);
  await visualAssert.toHaveScreenShot();
  // try {
  //   // Expect a title "to contain" a substring.
  // await expect(page).toHaveScreenshot();
  //   await expect(page).toHaveScreenshot();
  // } catch (err) {
  //   const oldAttachments = testInfo.attachments.map((a) => {
  //     a.path = a.path
  //       ? `data:image/png;base64,${fs.readFileSync(a.path, "base64")}`
  //       : a.path;
  //     return a;
  //   });
  //   testInfo.attachments.push(...JSON.parse(JSON.stringify(oldAttachments)));
  //   console.log(testInfo);
  // }
});
