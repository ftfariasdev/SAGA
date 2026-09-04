-- CreateTable
CREATE TABLE "chamada" (
    "id_chamada" TEXT NOT NULL,
    "id_professor" TEXT NOT NULL,
    "id_turma" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chamada_pkey" PRIMARY KEY ("id_chamada")
);

-- CreateTable
CREATE TABLE "presenca" (
    "id_presenca" TEXT NOT NULL,
    "id_chamada" TEXT NOT NULL,
    "id_aluno" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL,

    CONSTRAINT "presenca_pkey" PRIMARY KEY ("id_presenca")
);

-- AddForeignKey
ALTER TABLE "chamada" ADD CONSTRAINT "chamada_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id_professor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamada" ADD CONSTRAINT "chamada_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_id_chamada_fkey" FOREIGN KEY ("id_chamada") REFERENCES "chamada"("id_chamada") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presenca" ADD CONSTRAINT "presenca_id_aluno_fkey" FOREIGN KEY ("id_aluno") REFERENCES "aluno"("id_aluno") ON DELETE RESTRICT ON UPDATE CASCADE;
