import { test } from "@playwright/test";
import { PlaywrighCloudVisualRegression, VisualExpect } from "../../src/index";
import { AmazonS3Adapter } from "../../src/storage-adapters/amazon-s3-adapter";
import { S3Client } from "@aws-sdk/client-s3";

const extendedTest = test.extend<{
  visualAssert: VisualExpect;
}>({
  visualAssert: async ({ page }, use, testInfo) => {
    const regression = new PlaywrighCloudVisualRegression({
      screenShotsBasePath: "__screenshots__",
      adapter: new AmazonS3Adapter(
        new S3Client({
          forcePathStyle: true,
          endpoint: "http://localhost:9100/",
          credentials: {
            accessKeyId: "",
            secretAccessKey: "",
          },
          region: "us-east-1",
        } as any),
        {
          bucket: "visual-regression",
        }
      ),
    });
    const matcher = regression.createMatcher(page, testInfo);
    await use(matcher);
    // await matcher.cleanUp();
  },
});

extendedTest("has title", async ({ page, visualAssert }) => {
  test.setTimeout(0);
  await page.goto("https://www.google.com/search?q=demo5");
  const search = page.locator("[jsname='RNNXgb']");

  await visualAssert.soft.assertElement(search, ["element", "search.png"]);

  await page.goto("https://www.github.com");
  await visualAssert.assertPage(["page", "full-page-github.png"]);
});
