import { TimeoutValue } from '@config/test.config'
import { getAppUrl, URLS } from '@config/urls.config'
import { expect, type Page } from '@playwright/test'

export class LoginPage {
  constructor(private readonly page: Page) {}

  private get emailInput() {
    return this.page.getByPlaceholder(/email/i)
  }

  private get passwordInput() {
    return this.page.getByPlaceholder(/password/i)
  }

  private get submitButton() {
    return this.page.getByRole('button', { name: /^sign in|^log in|^login/i })
  }

  private get registerLink() {
    return this.page.getByRole('link', { name: /register|sign up/i })
  }

  async navigate(): Promise<void> {
    await this.page.goto(getAppUrl(URLS.ROUTES.LOGIN), {
      waitUntil: 'domcontentloaded',
      timeout: TimeoutValue.NAVIGATION,
    })
  }

  async fillAndSubmit(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async expectOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/, { timeout: TimeoutValue.NAVIGATION })
  }

  async expectErrorVisible(): Promise<void> {
    const error = this.page.getByText(/invalid|incorrect|failed/i).first()
    await expect(error).toBeVisible({ timeout: TimeoutValue.ACTION })
  }
}
