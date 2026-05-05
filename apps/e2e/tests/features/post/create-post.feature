@post @create-post
Feature: Create Post
  As a logged-in user
  I want to create a new post
  So that my followers can see it in their feed

  @smoke @priority_high
  Scenario: Create a post from the create page
    Given I am logged in as the seeded user
    And I navigate to the create post page
    When I submit a new post with content "Hello from e2e test"
    Then I should be redirected to the feed page
    And I should see my new post at the top of the feed

  @priority_medium
  Scenario: Create post submit button is disabled when content is empty
    Given I am logged in as the seeded user
    And I navigate to the create post page
    Then the create post submit button should be disabled
