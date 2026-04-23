@auth @auth-guard
Feature: Protected route guard
  As an unauthenticated visitor
  I should not access protected pages
  So that my data stays private

  @priority_high
  Scenario Outline: Protected page redirects to login
    When I visit the protected page "<route>" without auth
    Then I should be redirected to the login page

    Examples:
      | route    |
      | /        |
      | /create  |
