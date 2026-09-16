# SAGA Database

🌐 **English** | [Português (Brasil)](pt-BR/database.md)

The data model, what each table holds, the caveats you need to know before writing a query or a
migration, and the history of the schema.

## Contents

1. [Engine and setup](#1-engine-and-setup)
2. [Entity-relationship diagram](#2-entity-relationship-diagram)
3. [Table reference](#3-table-reference)
4. [Modeling notes and caveats](#4-modeling-notes-and-caveats)
5. [Migration history](#5-migration-history)
6. [Everyday commands and rules](#6-everyday-commands-and-rules)

---

## 1. Engine and setup

| Item              | Value                                                                                              |
| ----------------- | -------------------------------------------------------------------------------------------------- |
| Engine            | PostgreSQL 16 (`postgres:16` image), container `saga-db`                                           |
| Definition        | [`Back-end/docker-compose.yml`](../Back-end/docker-compose.yml)                                    |
| Data volume       | `saga-pgdata` (survives `docker compose down`; removed by `docker compose down -v`)                |
| Health check      | `pg_isready` every 5 s — wait for `Up (healthy)` before running Prisma                             |
| ORM               | Prisma 6 — schema in [`Back-end/prisma/schema.prisma`](../Back-end/prisma/schema.prisma)           |
| Connection        | `DATABASE_URL` in `Back-end/.env`, e.g. `postgresql://saga:saga@localhost:5432/saga?schema=public` |
| Local credentials | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (default `saga`/`saga`/`saga`)                 |

**Collation.** The container is initialized with
`--encoding=UTF8 --locale-provider=icu --icu-locale=pt-BR`, so `ORDER BY nome` sorts accented
names correctly (`Ética` before `Zoologia`) on every operating system. These arguments only apply
when the volume is created for the first time; an older volume keeps its original collation until
you recreate it with `docker compose down -v`.

Step-by-step installation: [local-environment.md](local-environment.md).

---

## 2. Entity-relationship diagram

Prisma model names are shown; the real table names (from `@@map`) are listed in
[section 3](#3-table-reference).

```mermaid
erDiagram
    User ||--o| Secretaria : "id_user"
    User ||--o| Professor : "id_user"
    User ||--o| Aluno : "id_user"
    Curso ||--o{ Materia : "id_curso"
    Curso ||--o{ Turma : "id_curso"
    Professor |o--o{ Materia : "id_prof"
    Turma |o--o{ Aluno : "id_turma"
    Professor ||--o{ ProfessorTurma : "id_professor"
    Turma ||--o{ ProfessorTurma : "id_turma"
    Professor ||--o{ Chamada : "id_professor"
    Turma ||--o{ Chamada : "id_turma"
    Chamada ||--o{ Presenca : "id_chamada"
    Aluno ||--o{ Presenca : "id_aluno"
    Professor ||--o{ Nota : "id_professor"
    Turma ||--o{ Nota : "id_turma"
    Materia ||--o{ Nota : "id_materia"
    Nota ||--o{ NotaAluno : "id_nota"
    Aluno ||--o{ NotaAluno : "id_aluno"

    User {
        string id_user PK
        int matricula "autoincrement"
        string nome
        string email UK
        string senha "bcrypt hash"
        datetime dt_nasc
        string telefone UK
        string cpf UK
        string ft_perfil
        int tipo "0 Google, 1 Sec, 2 Prof, 3 Aluno"
    }
    Secretaria {
        string id_secretaria PK
        string id_user FK "unique"
    }
    Professor {
        string id_professor PK
        string id_user FK "unique"
    }
    Aluno {
        string id_aluno PK
        string id_user FK "unique"
        string id_turma FK "nullable"
    }
    Curso {
        string id_curso PK
        int codigo UK "autoincrement"
        string nome
        string periodo
        string descricao
        string ch_total
        string freq_min
    }
    Materia {
        string id_materia PK
        int codigo UK "autoincrement"
        string nome
        string descricao
        string ch_total
        string freq_min
        string id_curso FK
        string id_prof FK "nullable"
    }
    Turma {
        string id_turma PK
        int codigo UK "autoincrement"
        string nome
        datetime dt_inicio
        string semestres
        string id_curso FK
    }
    ProfessorTurma {
        string id_prof_turma PK
        string id_professor FK
        string id_turma FK
    }
    Chamada {
        string id_chamada PK
        string id_professor FK
        string id_turma FK
        datetime data "default now()"
    }
    Presenca {
        string id_presenca PK
        string id_chamada FK
        string id_aluno FK
        boolean presente
    }
    Nota {
        string id_nota PK
        string id_professor FK
        string id_turma FK
        string id_materia FK
        string tipo_avaliacao "nullable"
        string bimestre "nullable"
        datetime data_lancamento "default now()"
    }
    NotaAluno {
        string id_nota_aluno PK
        string id_nota FK
        string id_aluno FK
        float valor
    }
```

---

## 3. Table reference

Conventions that apply to every table:

- Primary keys are **UUID strings** stored as `TEXT`, generated by Prisma (`@default(uuid())`), not
  by the database.
- Column names are Portuguese `snake_case`; foreign keys are named `id_<entity>`.
- Foreign keys use `ON UPDATE CASCADE` and `ON DELETE RESTRICT`, **except** `aluno.id_turma` and
  `materia.id_prof`, which use `ON DELETE SET NULL`.
- Prisma relation fields (the names you use in `include`) are shown in the last row of each table.

### `user` — model `User`

Every person who can log in.

| Column      | Type         | Constraints / notes                                                   |
| ----------- | ------------ | --------------------------------------------------------------------- |
| `id_user`   | TEXT         | PK (UUID)                                                             |
| `matricula` | SERIAL (int) | Autoincrement registration number. **Not** unique-constrained.        |
| `nome`      | TEXT         | Required                                                              |
| `email`     | TEXT         | **UNIQUE** — used as the login                                        |
| `senha`     | TEXT         | bcrypt hash; empty string for accounts created by Google sign-in      |
| `dt_nasc`   | TIMESTAMP(3) | Date of birth                                                         |
| `telefone`  | TEXT         | **UNIQUE**                                                            |
| `cpf`       | TEXT         | **UNIQUE**                                                            |
| `ft_perfil` | TEXT         | Required, may be an empty string. Image as a string (data URL or URL) |
| `tipo`      | INTEGER      | `0` Google auto-created · `1` Secretaria · `2` Professor · `3` Aluno  |
| _relations_ |              | `secretarias`, `professores`, `alunos` (declared as arrays)           |

### `secretaria` — model `Secretaria`

| Column          | Type | Constraints / notes                        |
| --------------- | ---- | ------------------------------------------ |
| `id_secretaria` | TEXT | PK                                         |
| `id_user`       | TEXT | **UNIQUE**, FK → `user.id_user` (RESTRICT) |
| _relations_     |      | `user`                                     |

### `professor` — model `Professor`

| Column         | Type | Constraints / notes                                       |
| -------------- | ---- | --------------------------------------------------------- |
| `id_professor` | TEXT | PK                                                        |
| `id_user`      | TEXT | **UNIQUE**, FK → `user.id_user` (RESTRICT)                |
| _relations_    |      | `user`, `turmasRelation`, `materias`, `notas`, `Chamadas` |

### `aluno` — model `Aluno`

| Column      | Type | Constraints / notes                                      |
| ----------- | ---- | -------------------------------------------------------- |
| `id_aluno`  | TEXT | PK                                                       |
| `id_user`   | TEXT | **UNIQUE**, FK → `user.id_user` (RESTRICT)               |
| `id_turma`  | TEXT | **Nullable**, FK → `turma.id_turma` (ON DELETE SET NULL) |
| _relations_ |      | `user`, `turma`, `notas` (→ `NotaAluno`), `presencas`    |

### `curso` — model `Curso`

| Column      | Type         | Constraints / notes                             |
| ----------- | ------------ | ----------------------------------------------- |
| `id_curso`  | TEXT         | PK                                              |
| `nome`      | TEXT         |                                                 |
| `codigo`    | SERIAL (int) | **UNIQUE**, autoincrement                       |
| `periodo`   | TEXT         | Free text                                       |
| `descricao` | TEXT         |                                                 |
| `ch_total`  | TEXT         | Total workload in hours, **stored as a string** |
| `freq_min`  | TEXT         | Minimum attendance, **stored as a string**      |
| _relations_ |              | `turmas`, `materias`                            |

### `materia` — model `Materia`

| Column       | Type         | Constraints / notes                                                      |
| ------------ | ------------ | ------------------------------------------------------------------------ |
| `id_materia` | TEXT         | PK                                                                       |
| `nome`       | TEXT         |                                                                          |
| `codigo`     | SERIAL (int) | **UNIQUE**, autoincrement. `/aluno/modulo/:modulo` filters by its prefix |
| `descricao`  | TEXT         |                                                                          |
| `ch_total`   | TEXT         | String                                                                   |
| `freq_min`   | TEXT         | String                                                                   |
| `id_curso`   | TEXT         | FK → `curso.id_curso` (RESTRICT)                                         |
| `id_prof`    | TEXT         | **Nullable**, FK → `professor.id_professor` (ON DELETE SET NULL)         |
| _relations_  |              | `curso`, `professor`, `notas`                                            |

### `turma` — model `Turma`

| Column      | Type         | Constraints / notes                                           |
| ----------- | ------------ | ------------------------------------------------------------- |
| `id_turma`  | TEXT         | PK                                                            |
| `codigo`    | SERIAL (int) | **UNIQUE**, autoincrement                                     |
| `nome`      | TEXT         |                                                               |
| `dt_inicio` | TIMESTAMP(3) | Start date                                                    |
| `semestres` | TEXT         | String                                                        |
| `id_curso`  | TEXT         | FK → `curso.id_curso` (RESTRICT)                              |
| _relations_ |              | `curso`, `alunos`, `professoresRelation`, `notas`, `Chamadas` |

### `professor_turma` — model `ProfessorTurma`

Many-to-many link between teachers and classes.

| Column          | Type | Constraints / notes                      |
| --------------- | ---- | ---------------------------------------- |
| `id_prof_turma` | TEXT | PK                                       |
| `id_professor`  | TEXT | FK → `professor.id_professor` (RESTRICT) |
| `id_turma`      | TEXT | FK → `turma.id_turma` (RESTRICT)         |
| _relations_     |      | `professor`, `turma`                     |

No unique constraint on `(id_professor, id_turma)` — duplicates are prevented only by application
code.

### `chamada` — model `Chamada`

One roll-call session.

| Column         | Type         | Constraints / notes                      |
| -------------- | ------------ | ---------------------------------------- |
| `id_chamada`   | TEXT         | PK                                       |
| `id_professor` | TEXT         | FK → `professor.id_professor` (RESTRICT) |
| `id_turma`     | TEXT         | FK → `turma.id_turma` (RESTRICT)         |
| `data`         | TIMESTAMP(3) | Default `now()`                          |
| _relations_    |              | `professor`, `turma`, `presencas`        |

### `presenca` — model `Presenca`

One student's attendance in one roll call.

| Column        | Type    | Constraints / notes                  |
| ------------- | ------- | ------------------------------------ |
| `id_presenca` | TEXT    | PK                                   |
| `id_chamada`  | TEXT    | FK → `chamada.id_chamada` (RESTRICT) |
| `id_aluno`    | TEXT    | FK → `aluno.id_aluno` (RESTRICT)     |
| `presente`    | BOOLEAN | `true` = present                     |
| _relations_   |         | `chamada`, `aluno`                   |

### `nota` — model `Nota`

Header of a grade entry: who graded, which class and subject, which assessment and term.

| Column            | Type         | Constraints / notes                                                 |
| ----------------- | ------------ | ------------------------------------------------------------------- |
| `id_nota`         | TEXT         | PK                                                                  |
| `id_professor`    | TEXT         | FK → `professor.id_professor` (RESTRICT)                            |
| `id_turma`        | TEXT         | FK → `turma.id_turma` (RESTRICT)                                    |
| `id_materia`      | TEXT         | FK → `materia.id_materia` (RESTRICT)                                |
| `tipo_avaliacao`  | TEXT         | **Nullable**. The front-end sends `"Prova"`                         |
| `bimestre`        | TEXT         | **Nullable**. The front-end sends `"1º Bimestre"` … `"4º Bimestre"` |
| `data_lancamento` | TIMESTAMP(3) | Default `now()`                                                     |
| _relations_       |              | `professor`, `turma`, `materia`, `notasAlunos`                      |

### `nota_aluno` — model `NotaAluno`

The grade value of one student.

| Column          | Type             | Constraints / notes                                 |
| --------------- | ---------------- | --------------------------------------------------- |
| `id_nota_aluno` | TEXT             | PK                                                  |
| `id_nota`       | TEXT             | FK → `nota.id_nota` (RESTRICT)                      |
| `id_aluno`      | TEXT             | FK → `aluno.id_aluno` (RESTRICT)                    |
| `valor`         | DOUBLE PRECISION | 0–10, enforced only in `ProfController.lancarNotas` |
| _relations_     |                  | `nota`, `aluno`                                     |

---

## 4. Modeling notes and caveats

Read these before writing queries or migrations. Open defects are tracked in
[known-issues.md](known-issues.md).

- **`tipo` is part of the data.** The codes `0`, `1`, `2`, `3` are persisted; renumbering them
  changes the role of existing users.
- **User ↔ profile is 1:1, but Prisma sees arrays.** `professor.id_user`, `aluno.id_user` and
  `secretaria.id_user` are unique, yet `User` declares `professores Professor[]`, `alunos Aluno[]`
  and `secretarias Secretaria[]`. `include: { alunos: true }` returns an array with at most one
  element. Nothing stops a user from having more than one profile type.
- **No cascading deletes.** Almost every foreign key is `RESTRICT`, so controllers delete children
  by hand, without transactions:
  - `SecController.excluirUsuario` deletes a student's `presenca` and `nota_aluno` rows (or a
    teacher's `professor_turma` rows) before the profile and the `user`. A teacher with `chamada` or
    `nota` rows cannot be deleted (`P2003`).
  - `SecController.delTurma` deletes the **`aluno` rows of the class** (the students lose their
    profile, and their `user` rows are left behind), then the `professor_turma` rows, then the
    class — even though `aluno.id_turma` is already `ON DELETE SET NULL`. See [D4] #25.
  - `SecController.removerAlunoTurma` also deletes the `aluno` row instead of setting
    `id_turma = NULL`.
- **`professor_turma` allows duplicates.** There is no unique constraint on
  `(id_professor, id_turma)`; the single-column unique indexes from the first migration were
  dropped and nothing replaced them.
- **One teacher per subject, for every class.** `materia.id_prof` is global to the subject, not per
  class. To make teachers reach the classes, `cadMateria`/`editarMateria` loop over every class of
  the course and create `professor_turma` rows, and `Back-end/sync_professores_turmas.js` repairs
  missing links. A per-class × subject model is part of the planned schema work ([D3] #24,
  [M0] #19).
- **Grades: writer and readers disagree.** `lancarNotas` creates **one `nota` per student** per
  submission (plus its `nota_aluno`), with `tipo_avaliacao = "Prova"` and
  `bimestre = "Nº Bimestre"`; posting again adds rows instead of updating. `GET /aluno/modulo/:modulo`
  looks for `tipo_avaliacao` equal to `B1`/`B2`, which the UI never writes. See [D7] #29.
- **No uniqueness on attendance.** `presenca` has no unique `(id_chamada, id_aluno)` and `chamada`
  has no unique `(id_professor, id_turma, data)`; the controller does find-or-create by exact
  timestamp ([D6] #28).
- **Numbers stored as text.** `ch_total`, `freq_min` and `semestres` are `TEXT`; convert before
  doing arithmetic or sorting.
- **Google placeholders.** Users created by `POST /login/google` get `senha = ''`,
  `dt_nasc = now()` and `telefone`/`cpf` = `google_<timestamp>` to satisfy the constraints
  ([S5] #18).
- **`matricula` is not unique** at the database level, even though it is displayed as an
  identifier.

---

## 5. Migration history

Folders under [`Back-end/prisma/migrations/`](../Back-end/prisma/migrations/), applied in order.

| #   | Migration                               | What it did                                                                                                                                                                                                                                                                                                                              |
| --- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `20250504143855_prof_e_turma`           | Initial schema: `user`, `professor`, `aluno` (`id_turma` required), `secretaria`, `curso`, `materia`, `turma`, `professor_turma`. Unique `email`/`telefone`/`cpf`, unique `codigo` on `curso` and `materia`, unique `id_user` on the profile tables, and single-column unique indexes on `professor_turma.id_professor` and `.id_turma`. |
| 2   | `20250506004317_ajuste_professor_turma` | Dropped the two unique indexes on `professor_turma`, turning it into a real many-to-many link (without a composite unique).                                                                                                                                                                                                              |
| 3   | `20250508225216_add_nota`               | Created `nota` as one row per student grade: `id_aluno`, `id_materia`, `id_professor`, `id_turma`, `valor`, `data`, `bimestre` (integer).                                                                                                                                                                                                |
| 4   | `20250509003318_add_chamada`            | Created `chamada` and `presenca`.                                                                                                                                                                                                                                                                                                        |
| 5   | `20250515005914_add_nota`               | **Destructive** reshape of grades: dropped `nota.bimestre`, `data`, `id_aluno`, `valor`; added `data_lancamento` and `tipo_avaliacao`; created `nota_aluno` (`id_nota`, `id_aluno`, `valor`).                                                                                                                                            |
| 6   | `20250606013519_add_id_prof_to_materia` | Made `aluno.id_turma` nullable with `ON DELETE SET NULL`; added `materia.id_prof` (nullable, `SET NULL`); added `turma.codigo` (serial, unique).                                                                                                                                                                                         |
| 7   | `20250615203113_add_bimestre_to_nota`   | Re-added `nota.bimestre`, now as nullable `TEXT`.                                                                                                                                                                                                                                                                                        |

Notes:

- Migrations 3 and 5 share the suffix `add_nota`. New migrations need a unique, descriptive name.
- `Back-end/baseline.sql` is a legacy SQL dump saved as UTF-16. Prisma does not use it; the
  migrations above are the source of truth.
- The backlog plans a new schema core generated as a single migration ([M0] #19), followed by
  rewiring the back-end ([M0b] #20).

---

## 6. Everyday commands and rules

Run from `Back-end/`, with the container up (`docker compose up -d`).

| Command                                       | What it does                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `npx prisma generate`                         | Regenerates the Prisma Client after a schema change (`migrate dev` also does it) |
| `npx prisma migrate dev --name <snake_case>`  | Creates a migration from your `schema.prisma` changes and applies it locally     |
| `npx prisma migrate deploy`                   | Applies pending migrations without creating new ones                             |
| `npx prisma migrate status`                   | Shows pending migrations and drift                                               |
| `npx prisma migrate reset`                    | Drops the local database and reapplies every migration — **deletes local data**  |
| `npx prisma studio`                           | Opens a visual editor at `http://localhost:5555`                                 |
| `docker compose exec db psql -U saga -d saga` | Opens `psql` inside the container                                                |

Rules:

1. **Never edit a migration that has already been applied** (merged or run by someone else). Create
   a new one.
2. **Name migrations in `snake_case`**, describing the change: `add_unique_professor_turma`, not
   `ajuste` or `fix`.
3. **Commit `schema.prisma` and the new migration folder together**, in the same PR.
4. **Destructive changes** (dropping or renaming columns, tightening `NULL`) must say so in the PR
   description, including how existing data is handled.
5. Update this document when the schema changes. The PR checklist is in
   [CONTRIBUTING.md](../CONTRIBUTING.md).
