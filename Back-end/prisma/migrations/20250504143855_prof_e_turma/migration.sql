-- CreateTable
CREATE TABLE "user" (
    "id_user" TEXT NOT NULL,
    "matricula" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "dt_nasc" TIMESTAMP(3) NOT NULL,
    "telefone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "ft_perfil" TEXT NOT NULL,
    "tipo" INTEGER NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "professor" (
    "id_professor" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,

    CONSTRAINT "professor_pkey" PRIMARY KEY ("id_professor")
);

-- CreateTable
CREATE TABLE "aluno" (
    "id_aluno" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "id_turma" TEXT NOT NULL,

    CONSTRAINT "aluno_pkey" PRIMARY KEY ("id_aluno")
);

-- CreateTable
CREATE TABLE "secretaria" (
    "id_secretaria" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,

    CONSTRAINT "secretaria_pkey" PRIMARY KEY ("id_secretaria")
);

-- CreateTable
CREATE TABLE "curso" (
    "id_curso" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" SERIAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ch_total" TEXT NOT NULL,
    "freq_min" TEXT NOT NULL,

    CONSTRAINT "curso_pkey" PRIMARY KEY ("id_curso")
);

-- CreateTable
CREATE TABLE "materia" (
    "id_materia" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "ch_total" TEXT NOT NULL,
    "freq_min" TEXT NOT NULL,
    "id_curso" TEXT NOT NULL,

    CONSTRAINT "materia_pkey" PRIMARY KEY ("id_materia")
);

-- CreateTable
CREATE TABLE "turma" (
    "id_turma" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dt_inicio" TIMESTAMP(3) NOT NULL,
    "semestres" TEXT NOT NULL,
    "id_curso" TEXT NOT NULL,

    CONSTRAINT "turma_pkey" PRIMARY KEY ("id_turma")
);

-- CreateTable
CREATE TABLE "professor_turma" (
    "id_prof_turma" TEXT NOT NULL,
    "id_professor" TEXT NOT NULL,
    "id_turma" TEXT NOT NULL,

    CONSTRAINT "professor_turma_pkey" PRIMARY KEY ("id_prof_turma")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_telefone_key" ON "user"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "user_cpf_key" ON "user"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "professor_id_user_key" ON "professor"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "aluno_id_user_key" ON "aluno"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "secretaria_id_user_key" ON "secretaria"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "curso_codigo_key" ON "curso"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "materia_codigo_key" ON "materia"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "professor_turma_id_professor_key" ON "professor_turma"("id_professor");

-- CreateIndex
CREATE UNIQUE INDEX "professor_turma_id_turma_key" ON "professor_turma"("id_turma");

-- AddForeignKey
ALTER TABLE "professor" ADD CONSTRAINT "professor_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secretaria" ADD CONSTRAINT "secretaria_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "user"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materia" ADD CONSTRAINT "materia_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma" ADD CONSTRAINT "turma_id_curso_fkey" FOREIGN KEY ("id_curso") REFERENCES "curso"("id_curso") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professor_turma" ADD CONSTRAINT "professor_turma_id_professor_fkey" FOREIGN KEY ("id_professor") REFERENCES "professor"("id_professor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professor_turma" ADD CONSTRAINT "professor_turma_id_turma_fkey" FOREIGN KEY ("id_turma") REFERENCES "turma"("id_turma") ON DELETE RESTRICT ON UPDATE CASCADE;
