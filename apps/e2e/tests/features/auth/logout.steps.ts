import { TimeoutValue } from '@config/test.config'
import { Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import type { BrowserWorld } from '@support/world'
import { logger } from '@utils/logger'

When('I click the logout button', async function (this: BrowserWorld) {
  logger.info('Clicking logout')
  await this.page.getByRole('button', { name: /logout|sign out/i }).click()
})

Then('I should be redirected to the login page', async function (this: BrowserWorld) {
  await expect(this.page).toHaveURL(/\/login/, { timeout: TimeoutValue.NAVIGATION })
})
