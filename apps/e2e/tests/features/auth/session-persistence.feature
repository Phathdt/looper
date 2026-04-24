@auth @persistence
Feature: Session persistence across reload
  As a logged-in user
  I want my session to survive page reload
  So that I don't have to re-login frequently

  @priority_medium
  Scenario: Reload preserves authenticated session
    Given I am logged in as the seeded user
    When I reload the page
    Then I should still be on the feed page
