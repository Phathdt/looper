import { Given, When, Then } from "@cucumber/cucumber";
import { ProfilePage } from "@page-objects/profile.page";
import { URLS } from "@config/urls.config";
import { logger } from "@utils/logger";
import type { BrowserWorld } from "@support/world";

async function lookupUserIdByName(apiUrl: string, name: string): Promise<string> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation { login(input: { email: "${name}@looper.dev", password: "password123" }) { user { id } } }`,
    }),
  });
  const json = (await res.json()) as { data?: { login?: { user?: { id: string } } } };
  const id = json.data?.login?.user?.id;
  if (!id) throw new Error(`User ${name} not found`);
  return id;
}

Given("I visit the profile of user {string}", async function (this: BrowserWorld, name: string) {
  const id = await lookupUserIdByName(URLS.API, name);
  logger.info({ name, id }, "Visiting user profile");
  this.data.targetUserId = id;
  this.data.targetUserName = name;
  await new ProfilePage(this.page).navigate(id);
  await new ProfilePage(this.page).expectUserName(name);
});

When("I click the follow button", async function (this: BrowserWorld) {
  await new ProfilePage(this.page).clickFollow();
});

When("I click the unfollow button", async function (this: BrowserWorld) {
  await new ProfilePage(this.page).clickUnfollow();
});

Then("I should see the follow button", async function (this: BrowserWorld) {
  await new ProfilePage(this.page).expectNotFollowingState();
});

Then("I should see the unfollow button", async function (this: BrowserWorld) {
  await new ProfilePage(this.page).expectFollowingState();
});
