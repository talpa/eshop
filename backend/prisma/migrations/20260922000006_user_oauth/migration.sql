-- Make passwordHash nullable (OAuth users have no password)
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- Add OAuth provider fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "providerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
