@feed @pagination
Feature: Infinite scroll pagination
  As a logged-in user
  I want more posts to load when I scroll down
  So that I can browse the feed without manual pagination

  @priority_medium
  Scenario: Scrolling to bottom loads next page
    Given I am logged in as the seeded user
    When I scroll the feed to the bottom
    Then I should see more than one page worth of posts
