import { TimeoutValue } from '@config/test.config'
import { Given, Then, When } from '@cucumber/cucumber'
import { CreatePostPage } from '@page-objects/create-post.page'
import { expect } from '@playwright/test'
import type { BrowserWorld } from '@support/world'
import { logger } from '@utils/logger'

Given('I navigate to the create post page', async function (this: BrowserWorld) {
  logger.info('Navigating to create post page')
  await new CreatePostPage(this.page).navigate()
})

When('I submit a new post with content {string}', async function (this: BrowserWorld, content: string) {
  logger.info({ content }, 'Submitting new post')
  this.data.postContent = content
  await new CreatePostPage(this.page).submitPost(content)
})

Then('I should see my new post at the top of the feed', async function (this: BrowserWorld) {
  const content = this.data.postContent as string
  await expect(this.page.getByText(content).first()).toBeVisible({
    timeout: TimeoutValue.ACTION,
  })
})
