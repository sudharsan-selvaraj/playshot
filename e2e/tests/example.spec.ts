import { test } from "@playwright/test";
import { PlaywrighCloudVisualRegression, VisualExpect } from "../../src/index";

const extendedTest = test.extend<{
  visualExpect: VisualExpect;
}>({
  visualExpect: async ({ page }, use, testInfo) => {
    const regression = new PlaywrighCloudVisualRegression({
      screenShotsBasePath: "__screenshots__",
    });
    await use(regression.createMatcher(page, testInfo));
  },
});

extendedTest("has title", async ({ page, visualExpect }) => {
  test.setTimeout(0);
  await page.goto("https://www.google.com/search?q=demo2");
  const search = page.locator("[jsname='RNNXgb']");

  await visualExpect.soft.assertElement(search, ["element", "search.png"]);
  await visualExpect.soft.assertPage(["page", "full-page.png"]);
});
