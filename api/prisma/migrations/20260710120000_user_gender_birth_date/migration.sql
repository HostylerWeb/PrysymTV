-- CreateEnum
CREATE TYPE "UserGender" AS ENUM ('male', 'female', 'non_binary', 'transgender', 'prefer_not_to_say');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "gender" "UserGender",
ADD COLUMN "birth_date" DATE;
