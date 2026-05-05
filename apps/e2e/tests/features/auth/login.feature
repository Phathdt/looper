@auth @auth-login
Feature: User Authentication - Login
  As a Looper user
  I want to log in with my credentials
  So that I can see my feed

  @smoke @priority_high
  Scenario: Successful login with seeded credentials
    Given I navigate to the login page
    When I submit valid login credentials
    Then I should be redirected to the feed page

  @priority_high
  Scenario: Failed login with invalid credentials
    Given I navigate to the login page
    When I submit invalid login credentials
    Then I should remain on the login page
    And I should see a login error

  @priority_medium
  Scenario: Login submit button disabled when form is empty
    Given I navigate to the login page
    Then the login submit button should be disabled
