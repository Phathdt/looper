import { When, Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { TimeoutValue } from "@config/test.config";
import type { BrowserWorld } from "@support/world";

When("I scroll the feed to the bottom", async function (this: BrowserWorld) {
  // Trigger sentinel visibility → fetchNextPage
  for (let i = 0; i < 5; i++) {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(500);
  }
});

Then("I should see more than one page worth of posts", async function (this: BrowserWorld) {
  const cards = this.page.locator("[data-testid='post-card']");
  await expect(async () => {
    const count = await cards.count();
    expect(count).toBeGreaterThan(10);
  }).toPass({ timeout: TimeoutValue.ACTION });
});
