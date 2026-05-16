Feature: VS Mode Sabotage (Re-capturing)
  As a player in a competitive Geobingo game
  I want to be able to steal prompts from other teams after a cooldown
  So that the game remains high-stakes until the walk-back phase.

  Background:
    Given a VS Mode game is active
    And "Allow Re-capturing" is enabled in the game settings
    And the "Global Cooldown" is set to 120 seconds
    And Team "A" and Team "B" are using shared WebSocket IDs per team

  Scenario: A prompt is successfully stolen after the cooldown period
    Given Team "A" has already claimed the prompt "Red Car"
    And the prompt "Red Car" is currently in "Global Cooldown"
    When 121 seconds have passed
    Then the prompt "Red Car" should change status to "Open for All"
    When Team "B" uploads a photo for "Red Car"
    Then the backend should overwrite the owner of "Red Car" to Team "B"
    And the prompt "Red Car" should enter a new "Global Cooldown" for 120 seconds
    And all connected WebSockets should receive the "State Updated" broadcast

  Scenario: A theft attempt is rejected during the cooldown period
    Given Team "A" has just claimed the prompt "Park Bench"
    And the current time is within the 120-second cooldown
    When Team "B" attempts to upload a photo for "Park Bench"
    Then the Rust backend should reject the request
    And Team "A" should still be the owner of "Park Bench"

  Scenario: Final ownership is determined by the last valid claim
    Given the game timer has expired
    And Team "B" was the last to claim "Blue Mailbox" before the lock
    When the game transitions to the "Admin Review" phase
    Then the Admin should see Team "B"'s photo for "Blue Mailbox"
    And if the Admin declines the photo, the point is removed from Team "B"
    But the point does NOT automatically revert to the previous owner