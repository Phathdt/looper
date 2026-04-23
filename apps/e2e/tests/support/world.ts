import { setWorldConstructor, setDefaultTimeout, World } from "@cucumber/cucumber";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { TimeoutValue } from "@config/test.config";

setDefaultTimeout(TimeoutValue.TEST_WORKFLOW);

export class BrowserWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  data: Record<string, unknown> = {};
}

setWorldConstructor(BrowserWorld);
