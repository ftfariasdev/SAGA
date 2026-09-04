/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `turma` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "aluno" DROP CONSTRAINT "aluno_id_turma_fkey";

-- AlterTable
ALTER TABLE "aluno" ALTER COLUMN "id_turma" DROP NOT NULL;

-- AlterTable
ALTER TABLE "materia" ADD COLUMN     "id_prof" TEXT;

-- AlterTable
ALTER TABLE "turma" ADD COLUMN     "codigo" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "turma_codigo_key" ON "turma"("codigo");

-- AddForeignKey
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materia" ADD CONSTRAINT "materia_id_prof_fkey" FOREIGN KEY ("id_prof") REFERENCES "professor"("id_professor") ON DELETE SET NULL ON UPDATE CASCADE;
