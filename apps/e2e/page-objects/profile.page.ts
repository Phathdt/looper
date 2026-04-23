import { expect, type Page } from "@playwright/test";
import { TimeoutValue } from "@config/test.config";
import { getAppUrl, URLS } from "@config/urls.config";

export class ProfilePage {
  constructor(private readonly page: Page) {}

  private get followButton() {
    return this.page.getByRole("button", { name: /^follow$/i });
  }
  private get unfollowButton() {
    return this.page.getByRole("button", { name: /^unfollow$/i });
  }

  async navigate(userId: string): Promise<void> {
    await this.page.goto(getAppUrl(URLS.ROUTES.USER(userId)), {
      waitUntil: "domcontentloaded",
      timeout: TimeoutValue.NAVIGATION,
    });
  }

  async expectUserName(name: string): Promise<void> {
    await expect(this.page.getByText(name, { exact: false }).first()).toBeVisible({
      timeout: TimeoutValue.ACTION,
    });
  }

  async clickFollow(): Promise<void> {
    await this.followButton.click();
  }
  async clickUnfollow(): Promise<void> {
    await this.unfollowButton.click();
  }
  async expectFollowingState(): Promise<void> {
    await expect(this.unfollowButton).toBeVisible({ timeout: TimeoutValue.ACTION });
  }
  async expectNotFollowingState(): Promise<void> {
    await expect(this.followButton).toBeVisible({ timeout: TimeoutValue.ACTION });
  }
}
