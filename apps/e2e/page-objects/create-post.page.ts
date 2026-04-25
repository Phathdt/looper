import { TimeoutValue } from '@config/test.config'
import { getAppUrl, URLS } from '@config/urls.config'
import { expect, type Page } from '@playwright/test'

export class CreatePostPage {
  constructor(private readonly page: Page) {}

  private get contentTextarea() {
    return this.page.getByPlaceholder(/mind/i)
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: /^post$|publish|share/i })
  }

  async navigate(): Promise<void> {
    await this.page.goto(getAppUrl(URLS.ROUTES.CREATE), {
      waitUntil: 'domcontentloaded',
      timeout: TimeoutValue.NAVIGATION,
    })
  }

  async submitPost(content: string): Promise<void> {
    await this.contentTextarea.fill(content)
    await this.submitButton.click()
  }

  async expectOnCreatePage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/create/, { timeout: TimeoutValue.NAVIGATION })
  }
}
