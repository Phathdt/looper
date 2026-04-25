import { getTestCredentials } from '@config/urls.config'
import { Given, Then, When } from '@cucumber/cucumber'
import { FeedPage } from '@page-objects/feed.page'
import { LoginPage } from '@page-objects/login.page'
import type { BrowserWorld } from '@support/world'
import { logger } from '@utils/logger'

Given('I navigate to the login page', async function (this: BrowserWorld) {
  logger.info('Navigating to login page')
  await new LoginPage(this.page).navigate()
})

When('I submit valid login credentials', async function (this: BrowserWorld) {
  const { email, password } = getTestCredentials()
  logger.info({ email }, 'Submitting valid credentials')
  await new LoginPage(this.page).fillAndSubmit(email, password)
})

When('I submit invalid login credentials', async function (this: BrowserWorld) {
  logger.info('Submitting invalid credentials')
  await new LoginPage(this.page).fillAndSubmit('nobody@looper.dev', 'wrongpass')
})

Then('I should be redirected to the feed page', async function (this: BrowserWorld) {
  await new FeedPage(this.page).expectLoaded()
})

Then('I should remain on the login page', async function (this: BrowserWorld) {
  await new LoginPage(this.page).expectOnLoginPage()
})

Then('I should see a login error', async function (this: BrowserWorld) {
  await new LoginPage(this.page).expectErrorVisible()
})
