import { Given, When, Then } from "@cucumber/cucumber";
import { faker } from "@faker-js/faker";
import { RegisterPage } from "@page-objects/register.page";
import { FeedPage } from "@page-objects/feed.page";
import { getTestCredentials } from "@config/urls.config";
import { logger } from "@utils/logger";
import type { BrowserWorld } from "@support/world";

Given("I navigate to the register page", async function (this: BrowserWorld) {
  logger.info("Navigating to register page");
  await new RegisterPage(this.page).navigate();
});

When("I register with a unique email", async function (this: BrowserWorld) {
  const name = faker.person.firstName();
  const email = `${name.toLowerCase()}-${Date.now()}@looper.test`;
  const password = "password123";
  this.data = { name, email, password };
  logger.info({ email }, "Registering new user");
  await new RegisterPage(this.page).fillAndSubmit(name, email, password);
});

When("I register with an existing email", async function (this: BrowserWorld) {
  const { email, password } = getTestCredentials();
  logger.info({ email }, "Registering with existing email");
  await new RegisterPage(this.page).fillAndSubmit("Dup User", email, password);
});

Then("I should remain on the register page", async function (this: BrowserWorld) {
  await new RegisterPage(this.page).expectOnRegisterPage();
});

Then("I should see a register error", async function (this: BrowserWorld) {
  await new RegisterPage(this.page).expectErrorVisible();
});

Then("I should land on the feed page", async function (this: BrowserWorld) {
  await new FeedPage(this.page).expectLoaded();
});
