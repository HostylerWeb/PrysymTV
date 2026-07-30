-- CreateTable
CREATE TABLE "tv_auth_sessions" (
    "id" UUID NOT NULL,
    "device_code" TEXT NOT NULL,
    "user_code" TEXT NOT NULL,
    "poll_token_hash" TEXT NOT NULL,
    "user_id" UUID,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "approved_at" TIMESTAMP(3),
    "consumed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tv_auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tv_auth_sessions_device_code_key" ON "tv_auth_sessions"("device_code");

-- CreateIndex
CREATE INDEX "tv_auth_sessions_user_code_idx" ON "tv_auth_sessions"("user_code");

-- CreateIndex
CREATE INDEX "tv_auth_sessions_expires_at_idx" ON "tv_auth_sessions"("expires_at");
