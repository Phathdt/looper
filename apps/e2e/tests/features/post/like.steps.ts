import { TimeoutValue } from '@config/test.config'
import { Then, When } from '@cucumber/cucumber'
import { expect, type Locator } from '@playwright/test'
import type { BrowserWorld } from '@support/world'
import { logger } from '@utils/logger'

function firstCard(world: BrowserWorld): Locator {
  return world.page.locator("[data-testid='post-card']").first()
}

function likeButton(world: BrowserWorld): Locator {
  return firstCard(world).getByTestId('like-button')
}

function likeCount(world: BrowserWorld): Locator {
  return firstCard(world).getByTestId('like-count')
}

async function readCount(world: BrowserWorld): Promise<number> {
  const text = (await likeCount(world).textContent()) ?? '0'
  return Number(text.trim())
}

Then("the first post's like button should be visible", async function (this: BrowserWorld) {
  await expect(likeButton(this)).toBeVisible({ timeout: TimeoutValue.ACTION })
})

When("I remember the first post's like count", async function (this: BrowserWorld) {
  const value = await readCount(this)
  this.data.likeCountBefore = value
  logger.info({ value }, 'Remembered like count')
})

When("I click the first post's like button", async function (this: BrowserWorld) {
  await likeButton(this).click()
})

Then('the first post should be in the liked state', async function (this: BrowserWorld) {
  await expect(likeButton(this)).toHaveAttribute('aria-pressed', 'true', { timeout: TimeoutValue.ACTION })
})

Then('the first post should be in the unliked state', async function (this: BrowserWorld) {
  await expect(likeButton(this)).toHaveAttribute('aria-pressed', 'false', { timeout: TimeoutValue.ACTION })
})

Then("the first post's like count should have increased by 1", async function (this: BrowserWorld) {
  const before = (this.data.likeCountBefore as number) ?? 0
  await expect(likeCount(this)).toHaveText(String(before + 1), { timeout: TimeoutValue.ACTION })
})

Then("the first post's like count should match the remembered value", async function (this: BrowserWorld) {
  const before = (this.data.likeCountBefore as number) ?? 0
  await expect(likeCount(this)).toHaveText(String(before), { timeout: TimeoutValue.ACTION })
})
