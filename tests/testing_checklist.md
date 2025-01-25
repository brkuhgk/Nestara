# Testing Checklist

- [ ] Topic Creation
  - [ ] All topic types create successfully
  - [ ] Validation works correctly
    - [ ] Rating parameters validated
    - [ ] Users validated

- [ ] Rating Processing
  - [ ] Correct points applied (-50 for conflicts)
    - [ ] Correct points applied (+10 for mentions)
  - [ ] Rating boundaries respected
  - [ ] History recorded correctly

- [ ] Topic Archival
  - [ ] Topics archived after processing
  - [ ] Archived topics not processed again
  - [ ] Archive date recorded

- [ ] Error Handling
  - [ ] Invalid user IDs handled
  - [ ] Invalid rating parameters handled
  - [ ] Database connection issues handled
  - [ ] Concurrent processing handled

Manual Testing Steps:

First-time setup:

Create test users
Create a test house
Add users to house
Initialize user ratings


Create topics:

Create several topics of each type
Make some topics with multiple users in created_for
Create topics with different rating parameters


Test rating updates:
bashCopy# Wait for 30 days or manually update created_at dates
UPDATE topics 
SET created_at = created_at - INTERVAL '31 days' 
WHERE id = 'topic-id';

# Run rating processing
node scripts/process-ratings.js

Verify results:

Check user ratings updated correctly
Verify rating history entries created
Confirm topics archived
Check notifications sent




Edge Cases to Test:

Creating topic with non-existent users
Creating topic with users not in the house
Invalid rating parameters
Rating going above max or below min
Multiple topics affecting same rating parameter
Concurrent topic processing

1. Topic Creation Scenarios:
// 1. Create a Conflict Topic
const conflictTopic = {
    house_id: "house-id",
    created_by: "user1-id",
    created_for: ["user2-id"],
    type: "conflict",
    description: "Noise complaint at night",
    rating_parameter: "rp2"  // Behavior parameter
};

// 2. Create a Mentions Topic
const mentionsTopic = {
    house_id: "house-id",
    created_by: "user1-id",
    created_for: ["user2-id"],
    type: "mentions",
    description: "Great job cleaning the kitchen",
    rating_parameter: "rp1"  // Cleanliness parameter
};

// 3. Create a General Topic
const generalTopic = {
    house_id: "house-id",
    created_by: "user1-id",
    type: "general",
    description: "House meeting next week"
};