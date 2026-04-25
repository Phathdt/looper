import { TimeoutValue } from '@config/test.config'
import { Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import type { BrowserWorld } from '@support/world'
import { logger } from '@utils/logger'

When("I expand the first post's comments", async function (this: BrowserWorld) {
  const firstCard = this.page.locator("[data-testid='post-card']").first()
  await firstCard.getByRole('button', { name: /comment/i }).click()
})

When('I submit a comment {string}', async function (this: BrowserWorld, content: string) {
  logger.info({ content }, 'Submitting comment')
  const firstCard = this.page.locator("[data-testid='post-card']").first()
  await firstCard.getByLabel(/add a comment/i).fill(content)
  await firstCard.getByRole('button', { name: /send/i }).click()
})

Then('the comment {string} should be visible', async function (this: BrowserWorld, content: string) {
  await expect(this.page.getByText(content, { exact: false }).first()).toBeVisible({
    timeout: TimeoutValue.ACTION,
  })
})
