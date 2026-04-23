@user @follow
Feature: Follow / Unfollow User
  As a logged-in user
  I want to follow other users
  So that their posts appear in my feed

  @priority_high
  Scenario: Follow and unfollow another user via profile
    Given I am logged in as the seeded user
    And I visit the profile of user "bob"
    When I click the follow button
    Then I should see the unfollow button
    When I click the unfollow button
    Then I should see the follow button
