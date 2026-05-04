@post @like
Feature: Like / Unlike Post
  As a logged-in user
  I want to like and unlike posts
  So that I can express appreciation and undo it

  @priority_high
  Scenario: Like and unlike a post from the feed
    Given I am logged in as the seeded user
    When I visit the feed page
    Then the first post's like button should be visible
    When I remember the first post's like count
    And I click the first post's like button
    Then the first post should be in the liked state
    And the first post's like count should have increased by 1
    When I click the first post's like button
    Then the first post should be in the unliked state
    And the first post's like count should match the remembered value

  @priority_medium
  Scenario: Like state persists after page reload
    Given I am logged in as the seeded user
    When I visit the feed page
    And I click the first post's like button
    Then the first post should be in the liked state
    When I reload the page
    Then the first post should be in the liked state
    When I click the first post's like button
    Then the first post should be in the unliked state
