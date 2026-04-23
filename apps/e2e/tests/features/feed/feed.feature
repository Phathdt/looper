@feed
Feature: Feed
  As a logged-in user
  I want to browse the feed
  So that I can see posts from people I follow

  @smoke @priority_high
  Scenario: Feed loads with posts after login
    Given I am logged in as the seeded user
    When I visit the feed page
    Then I should see at least one post
