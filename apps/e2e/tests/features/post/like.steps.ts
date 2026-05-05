import { TimeoutValue } from '@config/test.config'
import { getTestCredentials } from '@config/urls.config'
import { Then, When } from '@cucumber/cucumber'
import { expect, type Locator } from '@playwright/test'
import type { BrowserWorld } from '@support/world'
import { logger } from '@utils/logger'

const VIEWER_NAME = getTestCredentials().email.split('@')[0]

// Returns the first post card NOT authored by the current viewer (alice).
// LikeService rejects self-likes, so e2e must target another user's post.
async function firstLikableCard(world: BrowserWorld): Promise<Locator> {
  const cards = world.page.locator("[data-testid='post-card']")
  await cards.first().waitFor({ state: 'visible', timeout: TimeoutValue.ACTION })
  const count = await cards.count()
  const authors: string[] = []
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i)
    const author = (await card.locator('a[href^="/user/"]').first().textContent())?.trim()
    authors.push(author ?? '')
    if (author && author !== VIEWER_NAME) return card
  }
  throw new Error(`No post by another user found for viewer "${VIEWER_NAME}". Authors seen: ${authors.join(', ')}`)
}

function likeButton(card: Locator): Locator {
  return card.getByTestId('like-button')
}

function likeCount(card: Locator): Locator {
  return card.getByTestId('like-count')
}

async function readCount(card: Locator): Promise<number> {
  const text = (await likeCount(card).textContent()) ?? '0'
  return Number(text.trim())
}

Then("the first post's like button should be visible", async function (this: BrowserWorld) {
  const card = await firstLikableCard(this)
  await expect(likeButton(card)).toBeVisible({ timeout: TimeoutValue.ACTION })
})

When("I remember the first post's like count", async function (this: BrowserWorld) {
  const card = await firstLikableCard(this)
  const value = await readCount(card)
  this.data.likeCountBefore = value
  logger.info({ value }, 'Remembered like count')
})

When("I click the first post's like button", async function (this: BrowserWorld) {
  const card = await firstLikableCard(this)
  await likeButton(card).click()
})

Then('the first post should be in the liked state', async function (this: BrowserWorld) {
  const card = await firstLikableCard(this)
  await expect(likeButton(card)).toHaveAttribute('aria-pressed', 'true', { timeout: TimeoutValue.ACTION })
})

Then('the first post should be in the unliked state', async function (this: BrowserWorld) {
  const card = await firstLikableCard(this)
  await expect(likeButton(card)).toHaveAttribute('aria-pressed', 'false', { timeout: TimeoutValue.ACTION })
})

Then("the first post's like count should have increased by 1", async function (this: BrowserWorld) {
  const before = (this.data.likeCountBefore as number) ?? 0
  const card = await firstLikableCard(this)
  await expect(likeCount(card)).toHaveText(String(before + 1), { timeout: TimeoutValue.ACTION })
})

Then("the first post's like count should match the remembered value", async function (this: BrowserWorld) {
  const before = (this.data.likeCountBefore as number) ?? 0
  const card = await firstLikableCard(this)
  await expect(likeCount(card)).toHaveText(String(before), { timeout: TimeoutValue.ACTION })
})
