import { getTestCredentials } from '@config/urls.config'
import { Given, Then, When } from '@cucumber/cucumber'
import { faker } from '@faker-js/faker'
import { FeedPage } from '@page-objects/feed.page'
import { RegisterPage } from '@page-objects/register.page'
import type { BrowserWorld } from '@support/world'
import { logger } from '@utils/logger'

Given('I navigate to the register page', async function (this: BrowserWorld) {
  logger.info('Navigating to register page')
  await new RegisterPage(this.page).navigate()
})

When('I register with a unique email', async function (this: BrowserWorld) {
  const name = faker.person.firstName()
  const email = `${name.toLowerCase()}-${Date.now()}@looper.test`
  const password = 'password123'
  this.data = { name, email, password }
  logger.info({ email }, 'Registering new user')
  await new RegisterPage(this.page).fillAndSubmit(name, email, password)
})

When('I register with an existing email', async function (this: BrowserWorld) {
  const { email, password } = getTestCredentials()
  logger.info({ email }, 'Registering with existing email')
  await new RegisterPage(this.page).fillAndSubmit('Dup User', email, password)
})

Then('I should remain on the register page', async function (this: BrowserWorld) {
  await new RegisterPage(this.page).expectOnRegisterPage()
})

Then('I should see a register error', async function (this: BrowserWorld) {
  await new RegisterPage(this.page).expectErrorVisible()
})

Then('I should land on the feed page', async function (this: BrowserWorld) {
  await new FeedPage(this.page).expectLoaded()
})

When('I fill the register form with a short password', async function (this: BrowserWorld) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  await new RegisterPage(this.page).fillForm('Tom', `short-${stamp}@looper.test`, '123')
})

Then('the register submit button should be disabled', async function (this: BrowserWorld) {
  await new RegisterPage(this.page).expectSubmitDisabled()
})
