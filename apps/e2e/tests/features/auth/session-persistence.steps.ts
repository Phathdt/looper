import { Then, When } from '@cucumber/cucumber'
import { FeedPage } from '@page-objects/feed.page'
import type { BrowserWorld } from '@support/world'

When('I reload the page', async function (this: BrowserWorld) {
  await this.page.reload({ waitUntil: 'domcontentloaded' })
})

Then('I should still be on the feed page', async function (this: BrowserWorld) {
  await new FeedPage(this.page).expectLoaded()
})
