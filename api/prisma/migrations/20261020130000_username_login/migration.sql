-- O login passa a ser por nome de usuário. A coluna é renomeada, e quem já existe mantém o valor que tinha.
-- AlterTable
ALTER TABLE "User" RENAME COLUMN "email" TO "username";

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "User_username_key";
