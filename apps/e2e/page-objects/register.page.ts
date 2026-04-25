import { TimeoutValue } from '@config/test.config'
import { getAppUrl, URLS } from '@config/urls.config'
import { expect, type Page } from '@playwright/test'

export class RegisterPage {
  constructor(private readonly page: Page) {}

  private get nameInput() {
    return this.page.getByPlaceholder(/^name$/i)
  }
  private get emailInput() {
    return this.page.getByPlaceholder(/email/i)
  }
  private get passwordInput() {
    return this.page.getByPlaceholder(/password/i)
  }
  private get submitButton() {
    return this.page.getByRole('button', { name: /sign up|^register$|create account/i })
  }

  async navigate(): Promise<void> {
    await this.page.goto(getAppUrl(URLS.ROUTES.REGISTER), {
      waitUntil: 'domcontentloaded',
      timeout: TimeoutValue.NAVIGATION,
    })
  }

  async fillAndSubmit(name: string, email: string, password: string): Promise<void> {
    await this.nameInput.fill(name)
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async expectOnRegisterPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/register/, { timeout: TimeoutValue.NAVIGATION })
  }

  async expectErrorVisible(): Promise<void> {
    const error = this.page.getByText(/already|exist|failed|invalid/i).first()
    await expect(error).toBeVisible({ timeout: TimeoutValue.ACTION })
  }
}
