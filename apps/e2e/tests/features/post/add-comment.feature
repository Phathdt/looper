@post @add-comment
Feature: Add Comment to Post
  As a logged-in user
  I want to comment on a post
  So that I can interact with the author

  @priority_medium
  Scenario: Add a comment from the feed
    Given I am logged in as the seeded user
    When I visit the feed page
    And I expand the first post's comments
    And I submit a comment "Nice post e2e"
    Then the comment "Nice post e2e" should be visible
