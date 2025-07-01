# Streak Tracking Implementation

This implementation adds streak tracking to the anxiety application, allowing students to see how many consecutive days they've been active in the app.

## Overview

The streak tracking system consists of:

1. **Database Schema Changes**: New columns in the profiles table
2. **Streak Service**: Logic for calculating and updating streaks
3. **UI Integration**: Displaying the streak in the Dashboard

## Setup Instructions

### 1. Database Migration

Run the `sql/add_streak_tracking_migration.sql` file in your Supabase SQL Editor to:

- Add the `streak` and `last_activity_date` columns to the profiles table
- Create a function to reset inactive streaks
- Set default values for existing profiles

### 2. Integration

The implementation includes:

- `src/lib/streakService.ts`: Service with functions to get and update user streaks
- Updated `src/user/Dashboard.tsx`: Uses the streak service to display dynamic streak values

## How it Works

1. **Streak Calculation Logic**:
   - When a user logs in or performs an activity, `updateUserStreak()` is called
   - If this is the user's first time, streak is set to 1
   - If the user was active yesterday, streak is incremented by 1
   - If the user was active today, streak remains the same
   - If the user was inactive for more than a day, streak resets to 1

2. **Dashboard Integration**:
   - The Dashboard component calls `updateUserStreak()` when loaded
   - Displays a loading spinner while streak is being calculated
   - Shows the current streak value and a motivational message

## Future Enhancements

- Create a scheduled function to run `resetInactiveStreaks()` daily
- Add streak-based achievements and rewards
- Implement streak notification reminders
- Add streak visualization in the profile or progress section

## Troubleshooting

- If streaks aren't updating, check the database logs for errors
- Verify that the `last_activity_date` is being properly updated
- Ensure the user has the necessary permissions to update their profile 