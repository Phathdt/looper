import { When } from "@cucumber/cucumber";
import { URLS, getAppUrl } from "@config/urls.config";
import { logger } from "@utils/logger";
import { TimeoutValue } from "@config/test.config";
import type { BrowserWorld } from "@support/world";

When(
  "I visit the protected page {string} without auth",
  async function (this: BrowserWorld, route: string) {
    logger.info({ route }, "Visiting protected route without token");
    // Ensure no auth token in localStorage
    await this.page.goto(getAppUrl(URLS.ROUTES.LOGIN), {
      waitUntil: "domcontentloaded",
      timeout: TimeoutValue.NAVIGATION,
    });
    await this.page.evaluate(() => localStorage.clear());
    await this.page.goto(getAppUrl(route), {
      waitUntil: "domcontentloaded",
      timeout: TimeoutValue.NAVIGATION,
    });
  },
);
