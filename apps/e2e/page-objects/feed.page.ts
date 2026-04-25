import { TimeoutValue } from '@config/test.config'
import { getAppUrl, URLS } from '@config/urls.config'
import { expect, type Page } from '@playwright/test'

export class FeedPage {
  constructor(private readonly page: Page) {}

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`^${URLS.APP}/?$`), {
      timeout: TimeoutValue.NAVIGATION,
    })
    // Authed layout renders a "Create Post" link in the top nav
    await expect(this.page.getByRole('link', { name: /create post/i })).toBeVisible({
      timeout: TimeoutValue.ACTION,
    })
  }

  async expectAtLeastOnePost(): Promise<void> {
    const posts = this.page.locator("article, [data-testid='post-card']")
    await expect(posts.first()).toBeVisible({ timeout: TimeoutValue.ACTION })
  }

  async navigate(): Promise<void> {
    await this.page.goto(getAppUrl(URLS.ROUTES.FEED), {
      waitUntil: 'domcontentloaded',
      timeout: TimeoutValue.NAVIGATION,
    })
  }
}
