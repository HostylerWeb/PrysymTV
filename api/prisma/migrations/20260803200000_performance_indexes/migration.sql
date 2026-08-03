-- Performance indexes for feeds, notifications, analytics, and watch history

CREATE INDEX IF NOT EXISTS "follows_following_id_idx" ON "follows"("following_id");

CREATE INDEX IF NOT EXISTS "streams_status_viewer_count_idx" ON "streams"("status", "viewer_count" DESC);

CREATE INDEX IF NOT EXISTS "streams_temporary_stream_token_idx" ON "streams"("temporary_stream_token");

CREATE INDEX IF NOT EXISTS "videos_status_visibility_views_count_idx" ON "videos"("status", "visibility", "views_count" DESC);

CREATE INDEX IF NOT EXISTS "videos_status_visibility_created_at_idx" ON "videos"("status", "visibility", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "watch_history_user_id_updated_at_idx" ON "watch_history"("user_id", "updated_at" DESC);

CREATE INDEX IF NOT EXISTS "analytics_events_event_type_created_at_target_id_idx" ON "analytics_events"("event_type", "created_at", "target_id");
