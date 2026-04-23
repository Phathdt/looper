@auth @auth-logout
Feature: User Authentication - Logout
  As a logged-in user
  I want to log out
  So that my session ends and I can't access protected pages

  @priority_high
  Scenario: Logout returns to login page
    Given I am logged in as the seeded user
    When I click the logout button
    Then I should be redirected to the login page
