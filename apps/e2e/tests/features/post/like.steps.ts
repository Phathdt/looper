import { TimeoutValue } from '@config/test.config'
import { getAppUrl, URLS } from '@config/urls.config'
import { Given, Then, When } from '@cucumber/cucumber'
import { LoginPage } from '@page-objects/login.page'
import { expect, type Locator } from '@playwright/test'
import { createPostAs, followUserAs, registerFreshUser, type ApiUser } from '@support/api-helpers'
import type { BrowserWorld } from '@support/world'
import { logger } from '@utils/logger'

interface LikeWorldData {
  viewer?: ApiUser
  helperPostId?: string
  likeCountBefore?: number
}

function firstCard(world: BrowserWorld): Locator {
  return world.page.locator("[data-testid='post-card']").first()
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

// Hermetic setup: register a fresh viewer + a fresh post author, have viewer
// follow author so the post shows up in viewer's feed. Logs viewer in via UI.
// Parallel-safe — each scenario gets its own users + posts.
Given('I have a fresh viewer with a likable post in their feed', async function (this: BrowserWorld) {
  const viewer = await registerFreshUser('viewer')
  const author = await registerFreshUser('author')
  await followUserAs(viewer, author.id)
  const postId = await createPostAs(author, `e2e likable ${Date.now()}`)

  const data = this.data as LikeWorldData
  data.viewer = viewer
  data.helperPostId = postId
  logger.info({ viewerEmail: viewer.email, postId }, 'Hermetic like setup')

  const loginPage = new LoginPage(this.page)
  await loginPage.navigate()
  await loginPage.fillAndSubmit(viewer.email, viewer.password)
  await this.page.waitForURL(new RegExp(`^${URLS.APP}/?$`), { timeout: TimeoutValue.NAVIGATION })
})

When('I navigate to the home feed', async function (this: BrowserWorld) {
  await this.page.goto(getAppUrl('/'), { waitUntil: 'domcontentloaded', timeout: TimeoutValue.NAVIGATION })
  await firstCard(this).waitFor({ state: 'visible', timeout: TimeoutValue.ACTION })
})

Then("the first post's like button should be visible", async function (this: BrowserWorld) {
  await expect(likeButton(firstCard(this))).toBeVisible({ timeout: TimeoutValue.ACTION })
})

When("I remember the first post's like count", async function (this: BrowserWorld) {
  const value = await readCount(firstCard(this))
  ;(this.data as LikeWorldData).likeCountBefore = value
  logger.info({ value }, 'Remembered like count')
})

When("I click the first post's like button", async function (this: BrowserWorld) {
  await likeButton(firstCard(this)).click()
})

Then('the first post should be in the liked state', async function (this: BrowserWorld) {
  await expect(likeButton(firstCard(this))).toHaveAttribute('aria-pressed', 'true', {
    timeout: TimeoutValue.ACTION,
  })
})

Then('the first post should be in the unliked state', async function (this: BrowserWorld) {
  await expect(likeButton(firstCard(this))).toHaveAttribute('aria-pressed', 'false', {
    timeout: TimeoutValue.ACTION,
  })
})

Then("the first post's like count should have increased by 1", async function (this: BrowserWorld) {
  const before = ((this.data as LikeWorldData).likeCountBefore as number) ?? 0
  await expect(likeCount(firstCard(this))).toHaveText(String(before + 1), { timeout: TimeoutValue.ACTION })
})

Then("the first post's like count should match the remembered value", async function (this: BrowserWorld) {
  const before = ((this.data as LikeWorldData).likeCountBefore as number) ?? 0
  await expect(likeCount(firstCard(this))).toHaveText(String(before), { timeout: TimeoutValue.ACTION })
})
