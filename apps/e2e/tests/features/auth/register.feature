@auth @auth-register
Feature: User Authentication - Register
  As a new user
  I want to create an account
  So that I can start using Looper

  @priority_high
  Scenario: Successful registration with new email
    Given I navigate to the register page
    When I register with a unique email
    Then I should be redirected to the feed page

  @priority_medium
  Scenario: Register fails with existing email
    Given I navigate to the register page
    When I register with an existing email
    Then I should remain on the register page
    And I should see a register error
