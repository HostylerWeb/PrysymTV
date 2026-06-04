-- Add vertical_episode to watch history content types
ALTER TYPE "WatchContentType" ADD VALUE IF NOT EXISTS 'vertical_episode';
