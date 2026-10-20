-- A chave do Google volta a ficar no navegador: as chaves cifradas salvas nas contas são apagadas.
-- DropIndex
DROP INDEX "User_googleApiKeyHash_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleApiKey",
DROP COLUMN "googleApiKeyHash";
