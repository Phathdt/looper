import { getTestCredentials } from '@config/urls.config'
import { Given, Then, When } from '@cucumber/cucumber'
import { FeedPage } from '@page-objects/feed.page'
import { LoginPage } from '@page-objects/login.page'
import type { BrowserWorld } from '@support/world'
import { logger } from '@utils/logger'

Given('I am logged in as the seeded user', async function (this: BrowserWorld) {
  const { email, password } = getTestCredentials()
  logger.info({ email }, 'Logging in for feed test')
  const loginPage = new LoginPage(this.page)
  await loginPage.navigate()
  await loginPage.fillAndSubmit(email, password)
  await new FeedPage(this.page).expectLoaded()
})

When('I visit the feed page', async function (this: BrowserWorld) {
  await new FeedPage(this.page).navigate()
})

Then('I should see at least one post', async function (this: BrowserWorld) {
  await new FeedPage(this.page).expectAtLeastOnePost()
})
