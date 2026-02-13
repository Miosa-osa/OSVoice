-- Add WPM tracking columns to user_profiles
ALTER TABLE user_profiles ADD COLUMN best_wpm INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_profiles ADD COLUMN total_duration_ms INTEGER NOT NULL DEFAULT 0;
