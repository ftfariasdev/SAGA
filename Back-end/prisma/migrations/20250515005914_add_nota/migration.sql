/*
  Warnings:

  - You are about to drop the column `bimestre` on the `nota` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `nota` table. All the data in the column will be lost.
  - You are about to drop the column `id_aluno` on the `nota` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `nota` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "nota" DROP CONSTRAINT "nota_id_aluno_fkey";

-- AlterTable
ALTER TABLE "nota" DROP COLUMN "bimestre",
DROP COLUMN "data",
DROP COLUMN "id_aluno",
DROP COLUMN "valor",
ADD COLUMN     "data_lancamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tipo_avaliacao" TEXT;

-- CreateTable
CREATE TABLE "nota_aluno" (
    "id_nota_aluno" TEXT NOT NULL,
    "id_nota" TEXT NOT NULL,
    "id_aluno" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "nota_aluno_pkey" PRIMARY KEY ("id_nota_aluno")
);

-- AddForeignKey
ALTER TABLE "nota_aluno" ADD CONSTRAINT "nota_aluno_id_nota_fkey" FOREIGN KEY ("id_nota") REFERENCES "nota"("id_nota") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_aluno" ADD CONSTRAINT "nota_aluno_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;
