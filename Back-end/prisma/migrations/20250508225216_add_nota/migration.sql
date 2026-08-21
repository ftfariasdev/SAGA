-- CreateTable
CREATE TABLE "nota" (
    "id_nota" TEXT NOT NULL,
    "id_aluno" TEXT NOT NULL,
    "id_materia" TEXT NOT NULL,
    "id_professor" TEXT NOT NULL,
    "id_turma" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bimestre" INTEGER NOT NULL,

    CONSTRAINT "nota_pkey" PRIMARY KEY ("id_nota")
);

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_id_materia_fkey" FOREIGN KEY ("id_materia") REFERENCES "materia"("id_materia") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id_professor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota" ADD CONSTRAINT "nota_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;
