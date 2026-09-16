# SAGA Glossary

🌐 **English** | [Português (Brasil)](pt-BR/glossary.md)

SAGA's code, routes, tables and UI use **Portuguese** domain words. This glossary maps each term
to the identifiers you will find in the code and to its meaning in English, so you can read a
route like `PUT /sec/atualizarTurmaAluno/:id_user` without guessing.

> Keep domain names in Portuguese when you write new code — consistency beats translation. Add new
> terms here (and in the PT-BR version) when you introduce them.

## Contents

1. [Domain terms](#1-domain-terms)
2. [Verbs used in routes and methods](#2-verbs-used-in-routes-and-methods)
3. [Abbreviations](#3-abbreviations)
4. [Page names](#4-page-names)
5. [Technical terms](#5-technical-terms)

---

## 1. Domain terms

### People and roles

| Portuguese term  | Identifiers in code                                             | English meaning                 | Notes                                                                                                |
| ---------------- | --------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| usuário          | `User`, table `user`, `id_user`, `userId` (JWT, `localStorage`) | user account                    | Base record shared by every role. See [database.md](database.md#user--model-user).                   |
| aluno            | `Aluno`, `aluno`, `id_aluno`, `routerAluno`, `/aluno/*`         | student                         | `tipo = 3`. Belongs to at most one `turma`.                                                          |
| professor (prof) | `Professor`, `professor`, `id_professor`, `id_prof`, `/prof/*`  | teacher                         | `tipo = 2`. `id_prof` is the teacher column on `materia`.                                            |
| secretaria (sec) | `Secretaria`, `secretaria`, `id_secretaria`, `/sec/*`           | school office / registrar staff | `tipo = 1`. Administers courses, classes and users. Not "secretary" in the personal-assistant sense. |
| tipo             | `User.tipo`, `localStorage.tipo`                                | user type (role code)           | `0` Google auto-created, `1` secretaria, `2` professor, `3` aluno. Never renumber.                   |

### Academic structure

| Portuguese term    | Identifiers in code                                           | English meaning                  | Notes                                                                                      |
| ------------------ | ------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| curso              | `Curso`, `curso`, `id_curso`                                  | course / degree program          | Top of the hierarchy: has `materias` and `turmas`.                                         |
| matéria            | `Materia`, `materia`, `id_materia`, `materias`                | subject / discipline             | A unit taught inside a `curso`. One teacher per subject (`id_prof`).                       |
| turma              | `Turma`, `turma`, `id_turma`, `Turma/*` routes                | class / cohort                   | A group of students of one `curso` starting on `dt_inicio`.                                |
| módulo             | `modulo`, `/aluno/modulo/:modulo`                             | module (stage of the course)     | No column exists: the API selects subjects whose `codigo` starts with the given value.     |
| semestres          | `Turma.semestres`                                             | number of semesters              | Numeric input in the UI, stored as text.                                                   |
| período            | `Curso.periodo`                                               | period / shift                   | Free text.                                                                                 |
| carga horária      | `ch_total`                                                    | workload (total hours)           | Stored as text on `curso` and `materia`.                                                   |
| código             | `codigo`                                                      | code                             | Sequential, human-readable number on `curso`, `materia` and `turma` (not the primary key). |
| matrícula          | `User.matricula`                                              | registration / enrollment number | Autoincrement number shown as the user's ID in the UI. Not unique in the database.         |
| vínculo / vincular | `professor_turma`, `ProfessorTurma`, `vincularProfessorTurma` | link / to assign                 | Mostly teacher ↔ class. The route is spelled `/sec/vicularProfessor` (sic).                |

### Attendance

| Portuguese term | Identifiers in code                                 | English meaning             | Notes                                                    |
| --------------- | --------------------------------------------------- | --------------------------- | -------------------------------------------------------- |
| chamada         | `Chamada`, `chamada`, `id_chamada`, `/prof/chamada` | roll call (session)         | One per teacher × class × date.                          |
| presença        | `Presenca`, `presenca`, `presencas`, `presente`     | attendance record / present | One per student per `chamada`; `presente` is a boolean.  |
| frequência      | `/aluno/frequencia*`, `Freq1.html`, `Freq2.html`    | attendance (rate)           | Derived from `presenca`; there is no `frequencia` table. |
| freq_min        | `freq_min`                                          | minimum required attendance | Stored as text on `curso` and `materia`.                 |

### Grades

| Portuguese term   | Identifiers in code                                   | English meaning          | Notes                                                                                              |
| ----------------- | ----------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| nota              | `Nota`, `nota`, `id_nota`, `notas`                    | grade entry (header)     | Teacher + class + subject + assessment + term. In the request body, `notas` is the list of values. |
| nota do aluno     | `NotaAluno`, `nota_aluno`, `notasAlunos`, `valor`     | a student's grade value  | `valor` from 0 to 10.                                                                              |
| lançar notas      | `lancarNotas`, `/prof/lancarNotas`, `Lancamento.html` | to post / enter grades   | "Lançamento" = the act of posting.                                                                 |
| tipo de avaliação | `tipo_avaliacao`                                      | assessment type          | e.g. `Prova` (exam), `Trabalho` (assignment). The UI sends `Prova`.                                |
| bimestre          | `bimestre`, `/aluno/bimestre/:bimestre`               | two-month term (quarter) | A school year has four. Stored as text such as `1º Bimestre`.                                      |
| B1 / B2           | `'B1'`, `'B2'` in `alunoController.listModuloInfo`    | 1st / 2nd term grade     | Values the module view looks for in `tipo_avaliacao`; the UI does not write them.                  |
| boletim           | `Aluno/Page/boletim.html`, `boletim.js`               | report card              | Student grade view.                                                                                |

### Personal data

| Portuguese term    | Identifiers in code                                | English meaning                  | Notes                                                                 |
| ------------------ | -------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------- |
| nome               | `nome`, `nomeUsuario`                              | name                             |                                                                       |
| senha              | `senha`                                            | password                         | Stored as a bcrypt hash. Must never appear in a response.             |
| data de nascimento | `dt_nasc`                                          | date of birth                    |                                                                       |
| data de início     | `dt_inicio`                                        | start date                       | On `turma`.                                                           |
| foto de perfil     | `ft_perfil`, `fotoPerfil`, `foto`                  | profile photo                    | Image as a string (a resized JPEG data URL, or a Google picture URL). |
| CPF                | `cpf`                                              | Brazilian individual taxpayer ID | 11 digits, unique. Masked as `000.000.000-00` by `mascaras.js`.       |
| telefone           | `telefone`                                         | phone number                     | Unique. Masked as `XX XXXXX-XXXX`.                                    |
| especialidade      | `especialidade`, `atualizarEspecialidadeProfessor` | (teacher's) specialty            | Sent by the UI, but the column does not exist — the update fails.     |
| setor              | `setor`, `atualizarSetorSecretaria`                | department                       | Same situation as `especialidade`.                                    |

---

## 2. Verbs used in routes and methods

| Portuguese              | English                        | Example                                                                             |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------------------------- |
| cadastrar / cad         | create, register               | `POST /sec/cadAluno`, `POST /sec/Turma/cadastrar` (`cadTurma`)                      |
| listar / list           | list                           | `GET /sec/listarCursos`, `GET /aluno/listMateria`                                   |
| consultar               | get the details of one item    | `GET /sec/consultarUsuario/:id_user`, `GET /sec/Turma/consultar/:id_turma`          |
| buscar                  | look up, fetch                 | `GET /professor/user/:id_user` (`buscarProfessorPorUser`)                           |
| editar                  | edit (update the whole record) | `PUT /sec/editarCurso/:id_curso`, `PUT /editarInfo`                                 |
| atualizar               | update (a specific part)       | `PUT /sec/atualizarTurmaAluno/:id_user`                                             |
| excluir / deletar / del | delete                         | `DELETE /sec/excluirUsuario/:id_user`, `DELETE /sec/Turma/deletar/:id` (`delTurma`) |
| remover                 | remove (unlink, not delete)    | `DELETE /sec/Turma/removerProfessor/:id_professor/:id_turma`                        |
| vincular                | link, assign                   | `POST /sec/vicularProfessor` (`vincularProfessorTurma`)                             |
| realizar                | carry out, perform             | `POST /prof/chamada` (`realizarChamada`)                                            |
| lançar                  | post, record                   | `POST /prof/lancarNotas`                                                            |
| verificar               | check, verify                  | `Front-End/Js/verificaToken.js`                                                     |
| sincronizar             | synchronize                    | `Back-end/sync_professores_turmas.js`                                               |
| recuperar               | recover                        | `Login/RecSenha.html` (recuperar senha = password recovery)                         |

> ⚠️ `remover` in the UI suggests unlinking, but `DELETE /sec/Turma/removerAluno/:id_aluno` deletes
> the student's profile row. See [known-issues.md](known-issues.md).

---

## 3. Abbreviations

| Abbreviation | Stands for         | English               | Where you see it                             |
| ------------ | ------------------ | --------------------- | -------------------------------------------- |
| `sec`        | secretaria         | school office         | `/sec/*`, `secController.js`, `routesSec.js` |
| `prof`       | professor          | teacher               | `/prof/*`, `profController.js`, `id_prof`    |
| `alu`        | aluno              | student               | `homeAlu.js`                                 |
| `cad`        | cadastro/cadastrar | registration / create | `cadAluno`, `cadCurso`, `Cadastro.html`      |
| `dt`         | data               | date                  | `dt_nasc`, `dt_inicio`                       |
| `ft`         | foto               | photo                 | `ft_perfil`                                  |
| `ch`         | carga horária      | workload (hours)      | `ch_total`                                   |
| `freq`       | frequência         | attendance            | `freq_min`, `Freq1.html`, `freq2.js`         |
| `id_*`       | identificador      | identifier (UUID)     | `id_user`, `id_turma`, …                     |
| `Rec`        | recuperar          | recover               | `RecSenha.html`                              |
| `Confir`     | confirmar          | confirm               | `ConfirRecSenha.html`                        |
| `Info`       | informações        | information / profile | `info.html`, `/info/:id_user`, `editarInfo`  |

---

## 4. Page names

| Page / file                       | Meaning                                   |
| --------------------------------- | ----------------------------------------- |
| `Home*.html`                      | Role home page                            |
| `info.html`                       | "My profile" page                         |
| `Ajuda.html`                      | Help                                      |
| `Cadastro.html`, `cadastro*.html` | Registration / create form                |
| `Listar*.html`                    | Listing page                              |
| `editar*.html`                    | Edit form                                 |
| `consultarTurma.html`             | Class details                             |
| `Curso.html` (student)            | My course and its subjects                |
| `boletim.html`                    | Report card                               |
| `Freq1.html` / `Freq2.html`       | Attendance overview / attendance calendar |
| `Chamada.html` / `Chamada2.html`  | Choose class and subject / take roll call |
| `Lancamento.html`                 | Grade posting                             |
| `Turma.html` (teacher)            | Teacher's classes                         |

---

## 5. Technical terms

Common in commit messages, code comments and team conversations.

| Portuguese              | English             |
| ----------------------- | ------------------- |
| rota                    | route               |
| requisição / resposta   | request / response  |
| banco de dados / banco  | database            |
| tabela / coluna         | table / column      |
| chave estrangeira       | foreign key         |
| migração / migration    | migration           |
| vínculo                 | link / relationship |
| cadastro                | registration record |
| perfil                  | role / profile      |
| sessão                  | session             |
| chave secreta / segredo | secret key          |
| ambiente                | environment         |
| homologação             | staging             |
| produção                | production          |
