# API reference

🌐 **English** | [Português (Brasil)](pt-BR/api-reference.md)

> **Interim document.** This is a hand-written map of the HTTP API **as it behaves today**, checked
> against `Back-end/src` on 2026-09-10. It will be replaced by the OpenAPI spec from
> [[DOC1] #34](https://github.com/ftfariasdev/SAGA/issues/34).
>
> **The contract is frozen.** The front-end calls these routes with hardcoded URLs, so paths,
> parameters and response shapes — including the odd ones flagged below — must not change unless a
> backlog task explicitly authorizes it.

## Contents

1. [Conventions](#1-conventions)
2. [General routes](#2-general-routes)
3. [Student routes (`/aluno`)](#3-student-routes-aluno)
4. [Teacher routes (`/prof`, `/professor`)](#4-teacher-routes-prof-professor)
5. [School office routes (`/sec`)](#5-school-office-routes-sec)
   - [Courses](#51-courses-cursos) · [Subjects](#52-subjects-matérias) ·
     [Users](#53-users-usuários) · [Classes](#54-classes-turmas)
6. [Testing the API](#6-testing-the-api)

Legend: 🔒 requires a token · 🌐 public · ❌ route is broken today · ⚠️ read the note.
"Used by" paths are relative to `Front-End/`; "—" means no screen calls the route.

---

## 1. Conventions

### Base URL

`http://localhost:8081` — the port comes from `PORT` in `Back-end/.env`, and the front-end hardcodes
`8081`.

CORS only allows the origin `http://127.0.0.1:5500` (`Back-end/server.js:19`). Tools like curl or
REST Client aren't affected.

### Authentication

- Get a token from `POST /login` (or `POST /login/google`) and send it as
  `Authorization: Bearer <token>`.
- Tokens are JWTs signed with `JWT_SECRET`. The payload is only `{ userId }`, and they're valid for
  **10 hours**. There's no refresh or logout endpoint — the front-end just removes the token from
  `localStorage`.
- ⚠️ The `tokenAuthenticate` middleware only checks that the token is valid. **No route checks the
  user's role** — any logged-in student can call `/sec/*`. See
  [[S1] #14](https://github.com/ftfariasdev/SAGA/issues/14) and
  [[S2] #15](https://github.com/ftfariasdev/SAGA/issues/15).

Middleware errors are all `401` with the key `error`: missing header, header not in the
`Bearer <token>` form, or token invalid/expired (this one adds `detalhes`).

### User types (`user.tipo`)

| `tipo` | Meaning                                   |
| ------ | ----------------------------------------- |
| `0`    | Created automatically by the Google login |
| `1`    | Secretaria (school office)                |
| `2`    | Professor (teacher)                       |
| `3`    | Aluno (student)                           |

These values are already stored in the database — never renumber them.

### Requests

- JSON bodies (`Content-Type: application/json`) up to **50 MB** (`server.js:28`) — profile photos
  travel as base64 strings in `ft_perfil`.
- IDs (`id_user`, `id_turma`, …) are UUID strings. `codigo` and `matricula` are auto-increment
  integers.
- Dates in bodies are ISO 8601 strings (`2000-01-15T00:00:00.000Z`). The `data` query parameter uses
  `YYYY-MM-DD`.

### Responses and errors

There's no global error handler yet ([[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3)), so
each handler builds its own error body:

| Key                    | Where you'll see it                                   |
| ---------------------- | ----------------------------------------------------- |
| `erro` (+ `detalhes`)  | Student, teacher and most school office handlers      |
| `error` (+ `detalhes`) | Login, sign-up and subject handlers                   |
| `message` (+ `error`)  | `/info`, `/editarInfo`, course edit and user deletion |

`detalhes` and `error` usually carry the raw internal error message (Prisma errors included) — don't
show them to end users.

| Status | Meaning in this API                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------- |
| `200`  | Success. **Also used for some validation failures**: sign-up routes answer `200 { error: 'Email já cadastrado' }` |
| `201`  | Created — only `POST /sec/Turma/cadastrar` and `POST /sec/vicularProfessor`                                       |
| `204`  | Success on some PUT/DELETE routes. Express drops the JSON body the handler tries to send                          |
| `400`  | Missing/invalid input, or a unique-constraint violation (Prisma `P2002`)                                          |
| `401`  | Missing or invalid token, or wrong credentials                                                                    |
| `403`  | Teacher isn't linked to the class or subject                                                                      |
| `404`  | Record not found                                                                                                  |
| `500`  | Unexpected error. Routes whose handler is missing answer with Express's default **HTML** error page               |

⚠️ **Handlers without `try/catch`** are called out in the notes. A database error inside them
becomes an unhandled promise rejection, which on Node ≥ 15 **stops the API process**
([[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3)).

---

## 2. General routes

Defined in `Back-end/src/Routes/routesGeral.js`.

| Method | Path             | Auth  | Handler                       | Input                                                              | Success                                                                    | Used by                                                                                                                                                                         |
| ------ | ---------------- | ----- | ----------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/login`         | 🌐    | `LoginController.auth`        | body `{ email, senha }`                                            | `200 { token, tipo, id_user, nome, emailDoBanco, ft_perfil }`              | `Login/Js/login.js`                                                                                                                                                             |
| POST   | `/login/google`  | 🌐 ⚠️ | `LoginController.authGoogle`  | body `{ id_token }`                                                | `200`, same shape as `/login`                                              | `Login/Js/login.js`                                                                                                                                                             |
| GET    | `/token`         | 🔒    | inline                        | —                                                                  | `200 { message, userId, timestamp }`                                       | `Js/verificaToken.js`, `Secretaria/Js/editarInfo.js`                                                                                                                            |
| GET    | `/health`        | 🌐 ⚠️ | inline                        | —                                                                  | `200 { status: "UP", timestamp, version: "1.0.0" }`                        | `Login/Js/login.js`                                                                                                                                                             |
| GET    | `/info/:id_user` | 🔒 ⚠️ | `commonController.info`       | path `id_user`                                                     | `200 { id_user, matricula, cpf, nome, email, dt_nasc, telefone }`          | `Js/menu.js`, `Aluno/Js/homeAlu.js`, `Aluno/Js/infoAluno.js`, `Professor/Js/homeProf.js`, `Professor/Js/infoProf.js`, `Secretaria/Js/infoSec.js`, `Secretaria/Js/editarInfo.js` |
| PUT    | `/editarInfo`    | 🔒 ⚠️ | `commonController.editarInfo` | body `{ id_user, nome?, email?, dt_nasc?, telefone?, ft_perfil? }` | `200 { message, user: { id_user, nome, email, dt_nasc, telefone, tipo } }` | `Secretaria/Js/editarInfo.js`                                                                                                                                                   |

**Notes**

- **`POST /login`** — `401 { error }` when the email isn't registered ("Cadastro não existe…") or the
  password is wrong. The email comes back as **`emailDoBanco`**, not `email`. ⚠️ No `try/catch`: a
  database error stops the API.
- **`POST /login/google`** — verifies the Google ID token against `GOOGLE_CLIENT_ID`. `400` if
  `id_token` is missing, `401` if it's invalid. ⚠️ If no user has that email, **a new user with
  `tipo: 0` is created** (placeholder `cpf`/`telefone` `google_<timestamp>`) and gets a valid token
  ([[S5] #18](https://github.com/ftfariasdev/SAGA/issues/18)). The database lookup and creation after
  the token check have no `try/catch`.
- **`GET /health`** — `server.js:33` defines a second `/health` (`{ status: "OK", message }`), but it's
  never reached because `routerGeral` is registered first. The response in the table is the real one
  ([[F3] #5](https://github.com/ftfariasdev/SAGA/issues/5)).
- **`GET /info/:id_user`** — ⚠️ any logged-in user can read any other user's CPF, phone and birth date
  ([[S4] #17](https://github.com/ftfariasdev/SAGA/issues/17)). `404 { message }`. The handler also
  sends `turma: user.turma`, which is always `undefined`, so that key never shows up.
- **`PUT /editarInfo`** — ⚠️ the user being edited comes from the **body** (`id_user`), not from the
  token, so anyone logged in can edit anyone
  ([[S4] #17](https://github.com/ftfariasdev/SAGA/issues/17)). `400` when `id_user` is missing,
  `dt_nasc` is invalid, or the phone/email belongs to another user; `404` when the user doesn't
  exist. Outside production, the `500` response includes the error `stack`.

---

## 3. Student routes (`/aluno`)

Defined in `Back-end/src/Routes/routesAluno.js`. Every handler identifies the student through the
token (`req.userId`); none of them takes a user ID.

| Method | Path                        | Auth  | Handler                               | Input                   | Success                                                                                           | Used by               |
| ------ | --------------------------- | ----- | ------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- | --------------------- |
| GET    | `/aluno/listMateria`        | 🔒    | `AlunoController.listInfoCurso`       | —                       | `200 [{ materia, cargaHoraria, professor }]`                                                      | `Aluno/Js/curso.js`   |
| GET    | `/aluno/modulo/:modulo`     | 🔒 ⚠️ | `AlunoController.listModuloInfo`      | path `modulo`           | `200 { curso, turma, modulo, materias: [{ nome, codigo, descricao, ch_total, notaB1, notaB2 }] }` | —                     |
| GET    | `/aluno/bimestre/:bimestre` | 🔒 ❌ | `AlunoController.listBimestreInfo`    | path `bimestre`         | always `500` (handler doesn't exist)                                                              | `Aluno/Js/boletim.js` |
| GET    | `/aluno/frequencia`         | 🔒    | `AlunoController.getFrequenciaByData` | query `data=YYYY-MM-DD` | `200 { data, presente }`                                                                          | —                     |
| GET    | `/aluno/frequencia-geral`   | 🔒 ❌ | `AlunoController.getFrequenciaGeral`  | —                       | always `500` (handler doesn't exist)                                                              | —                     |
| GET    | `/aluno/presencas-dia`      | 🔒 ⚠️ | `AlunoController.getPresencasByDia`   | query `data=YYYY-MM-DD` | `200 [{ materia, professor, presente }]`                                                          | `Aluno/Js/freq2.js`   |

**Notes**

- ❌ **`listBimestreInfo` and `getFrequenciaGeral` don't exist** in `AlunoController`. The route
  wrapper throws a `TypeError` and Express answers `500` with its HTML error page. That's why the
  student report card (`boletim.html`) never shows grades
  ([[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)).
- **`/aluno/listMateria`** — subjects of the student's course. `professor` is the teacher's name or
  `"Não definido"`. `404 { erro }` when the student has no class or course.
- **`/aluno/modulo/:modulo`** — keeps only the subjects whose `codigo` **starts with** `modulo`
  (`1` matches `1`, `10`, `11`…). ⚠️ `notaB1`/`notaB2` look for grades whose `tipo_avaliacao` is
  `"B1"`/`"B2"`, but the teacher screen always saves `"Prova"`, so both come back as `"-"`. `404`
  when no subject matches.
- **`/aluno/frequencia`** — `400` when `data` is missing or invalid; `404` when the student has no
  class, there's no roll call that day, or there's no attendance record. The day is computed in the
  **server's local time zone** (`date-fns` `startOfDay`/`endOfDay`).
- **`/aluno/presencas-dia`** — one item per roll call on that day (UTC day). ⚠️ Roll calls don't store
  the subject, so `materia` is the teacher's **first** subject and may be wrong. `presente` is `false`
  when there's no record. `404` when there's no roll call
  ([[D6] #28](https://github.com/ftfariasdev/SAGA/issues/28)).

---

## 4. Teacher routes (`/prof`, `/professor`)

Defined in `Back-end/src/Routes/routesProf.js`. Every handler finds the teacher through the token
(`req.userId`) and answers `404 { erro: 'Professor não encontrado.' }` when the logged-in user isn't a
teacher. Class-scoped routes answer `403` when the teacher isn't linked to the class in
`professor_turma`.

| Method | Path                           | Auth  | Handler                                 | Input                                    | Success                                                                         | Used by                                                                                                      |
| ------ | ------------------------------ | ----- | --------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| GET    | `/prof/turmas/:id_professor`   | 🔒 ⚠️ | `ProfController.listarTurmasProf`       | path `id_professor` (ignored)            | `200` array of class records, each with `curso`                                 | `Professor/Js/Chamada.js`, `Professor/Js/lancamento.js`, `Professor/Js/turma.js`                             |
| GET    | `/prof/materias/:id_professor` | 🔒    | `ProfController.materiasProf`           | path `id_professor`                      | `200` array of subject records with `curso: { nome, codigo }`, sorted by `nome` | `Professor/Js/Chamada.js`, `Professor/Js/lancamento.js`                                                      |
| GET    | `/prof/alunos/:id_turma`       | 🔒 ⚠️ | `ProfController.listarAlunosTurma`      | path `id_turma`                          | `200 [{ id_aluno, ...user }]`                                                   | `Professor/Js/chamada2.js`                                                                                   |
| GET    | `/prof/alunos-turma/:id_turma` | 🔒 ⚠️ | `ProfController.listarAlunosTurma`      | path `id_turma`                          | same as above                                                                   | `Professor/Js/lancamento.js`                                                                                 |
| POST   | `/prof/chamada`                | 🔒 ⚠️ | `ProfController.realizarChamada`        | body, see notes                          | `200 { mensagem, resultados: [{ id_aluno, presente }] }`                        | `Professor/Js/chamada2.js`                                                                                   |
| GET    | `/prof/chamada/:id_turma`      | 🔒 ❌ | `ProfController.listarChamada`          | path `id_turma`                          | always `500`                                                                    | —                                                                                                            |
| GET    | `/prof/chamada/:id_turma/data` | 🔒 ⚠️ | `ProfController.buscarChamadaPorData`   | path `id_turma`, query `data=YYYY-MM-DD` | `200` roll-call record with `presencas[].aluno.user`                            | `Professor/Js/chamada2.js`                                                                                   |
| POST   | `/prof/lancarNotas`            | 🔒 ⚠️ | `ProfController.lancarNotas`            | body, see notes                          | `200 { mensagem, resultados: [{ id_aluno, valor }] }`                           | `Professor/Js/lancamento.js`                                                                                 |
| GET    | `/professor/user/:id_user`     | 🔒 ⚠️ | `ProfController.buscarProfessorPorUser` | path `id_user` (ignored)                 | `200 { id_professor, id_user }`                                                 | `Professor/Js/Chamada.js`, `Professor/Js/chamada2.js`, `Professor/Js/lancamento.js`, `Professor/Js/turma.js` |

**Notes**

- **Ignored path parameters.** `/prof/turmas/:id_professor` and `/professor/user/:id_user` always
  answer for the logged-in user; the value in the URL is never read. Keep sending it — it's part of
  the contract ([[M7] #21](https://github.com/ftfariasdev/SAGA/issues/21)).
- **`/prof/materias/:id_professor`** does read the parameter, and answers
  `403 { erro: 'Acesso negado a este professor.' }` when that teacher isn't the logged-in user.
- **`/prof/alunos/:id_turma`** and **`/prof/alunos-turma/:id_turma`** run the same handler. ⚠️ Each
  item spreads the whole `user` row, **including the `senha` hash**.
- **`POST /prof/chamada`** body:

  ```json
  {
    "id_turma": "uuid",
    "data": "2026-09-10",
    "presencas": [{ "id_aluno": "uuid", "presente": true }]
  }
  ```

  `400` when `id_turma`, `data` or the `presencas` array is missing, or when an item isn't
  `{ id_aluno: string, presente: boolean }`. The roll call is looked up by the **exact** timestamp
  `new Date(data)` and created if missing; each presence is then updated or created. ⚠️ Items are
  validated one at a time, so an invalid item in the middle leaves the earlier ones saved.

- ❌ **`GET /prof/chamada/:id_turma`** includes `aluno` and `materia` relations that `Chamada` doesn't
  have, so Prisma rejects the query every time. No screen uses it.
- **`GET /prof/chamada/:id_turma/data`** — searches the UTC day (`T00:00:00.000Z` to
  `T23:59:59.999Z`). `400` without `data`, `404` when there's no roll call. ⚠️
  `presencas[].aluno.user` is the full user row, **including `senha`**.
- **`POST /prof/lancarNotas`** body:

  ```json
  {
    "id_turma": "uuid",
    "id_materia": "uuid",
    "tipo_avaliacao": "Prova",
    "bimestre": "1º Bimestre",
    "notas": [{ "id_aluno": "uuid", "valor": 8.5 }]
  }
  ```

  `400` when a field is missing, an item isn't `{ id_aluno: string, valor: number }`, or `valor` is
  outside 0–10. `403` when the teacher isn't linked to the class or isn't the subject's `id_prof`.
  ⚠️ Every call **creates** one `nota` + one `nota_aluno` per student — nothing is updated, so
  submitting twice duplicates the grades (despite the "lançadas/atualizadas" message). Same partial-save
  behavior as the roll call ([[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)).

---

## 5. School office routes (`/sec`)

Defined in `Back-end/src/Routes/routesSec.js`. They're meant for the school office, but any valid
token is accepted ([[S2] #15](https://github.com/ftfariasdev/SAGA/issues/15)).

### 5.1 Courses (cursos)

| Method | Path                          | Auth  | Handler                      | Input                                                   | Success                                      | Used by                                                                                                                                                                                                                                     |
| ------ | ----------------------------- | ----- | ---------------------------- | ------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/sec/curso`                  | 🔒 ⚠️ | `SecController.cadCurso`     | body `{ nome, periodo, descricao, ch_total, freq_min }` | `200` course record                          | `Secretaria/Js/cadastroCurso.js`                                                                                                                                                                                                            |
| GET    | `/sec/listarCursos`           | 🔒 ⚠️ | `SecController.listarCursos` | —                                                       | `200` array of courses, each with `materias` | `Secretaria/Js/cadastrarTurma.js`, `Secretaria/Js/cadastroMateria.js`, `Secretaria/Js/editarCurso.js`, `Secretaria/Js/editarMateria.js`, `Secretaria/Js/editarTurma.js`, `Secretaria/Js/ListarCursos.js`, `Secretaria/Js/ListarMaterias.js` |
| PUT    | `/sec/editarCurso/:id_curso`  | 🔒 ⚠️ | `SecController.editarCurso`  | path `id_curso`, body as in create                      | `204` (no body)                              | `Secretaria/Js/editarCurso.js`                                                                                                                                                                                                              |
| DELETE | `/sec/excluirCurso/:id_curso` | 🔒 ⚠️ | `SecController.excluirCurso` | path `id_curso`                                         | `204`                                        | `Secretaria/Js/ListarCursos.js`                                                                                                                                                                                                             |

**Notes**

- ⚠️ None of the four handlers has `try/catch`. Editing a course that doesn't exist, or deleting one
  that still has subjects or classes, throws a Prisma error that **stops the API** instead of
  answering 404/409. The `404 { message: 'Curso não encontrado!' }` branch in `editarCurso` is
  unreachable.
- `ch_total` and `freq_min` are strings.

### 5.2 Subjects (matérias)

| Method | Path                              | Auth  | Handler                        | Input                                                                     | Success                                                                                      | Used by                                                             |
| ------ | --------------------------------- | ----- | ------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| POST   | `/sec/materia/:id_curso`          | 🔒 ⚠️ | `SecController.cadMateria`     | path `id_curso`, body `{ nome, descricao, ch_total, freq_min, id_prof? }` | `200` subject record                                                                         | `Secretaria/Js/cadastroMateria.js`                                  |
| GET    | `/sec/listarMaterias/:id_curso`   | 🔒    | `SecController.listarMaterias` | path `id_curso`                                                           | `200` array of subjects with `professor.user: { id_user, nome, email, ft_perfil, telefone }` | `Secretaria/Js/editarMateria.js`, `Secretaria/Js/ListarMaterias.js` |
| PUT    | `/sec/editarMateria/:id_materia`  | 🔒 ⚠️ | `SecController.editarMateria`  | path `id_materia`, body as in create                                      | `200` subject record                                                                         | `Secretaria/Js/editarMateria.js`                                    |
| DELETE | `/sec/excluirMateria/:id_materia` | 🔒 ⚠️ | `SecController.excluirMateria` | path `id_materia`                                                         | `204`                                                                                        | `Secretaria/Js/ListarMaterias.js`                                   |

**Notes**

- `id_prof` is an **`id_professor`**, not an `id_user`. When it's sent, the teacher is also linked
  (`professor_turma`) to **every class of the course**. Errors: `500 { error: 'Erro ao cadastrar
matéria. <message>' }`.
- ⚠️ **`editarMateria`: omitting `id_prof` removes the teacher** from the subject. If that teacher has
  no other subject left, their links to this course's classes are deleted too. `404 { message }`
  when the subject doesn't exist. All this syncing exists because a subject has a single, global
  teacher ([[D3] #24](https://github.com/ftfariasdev/SAGA/issues/24)).
- ⚠️ `excluirMateria` has no `try/catch`: deleting a subject that already has grades stops the API.

### 5.3 Users (usuários)

| Method | Path                                            | Auth  | Handler                                         | Input                                                                               | Success                                                                                               | Used by                                                              |
| ------ | ----------------------------------------------- | ----- | ----------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| POST   | `/sec/cad`                                      | 🔒 ⚠️ | `SecController.criarUsuario`                    | body `{ nome, email, senha, dt_nasc, telefone, cpf, ft_perfil, tipo }`              | `200 { message }`                                                                                     | —                                                                    |
| POST   | `/sec/cadAluno`                                 | 🔒 ⚠️ | `SecController.cadAluno`                        | body `{ nome, email, senha, dt_nasc, telefone, cpf, ft_perfil, id_turma }`          | `200 { message }`                                                                                     | `Secretaria/Js/cadastro.js`                                          |
| POST   | `/sec/cadProfessor`                             | 🔒 ⚠️ | `SecController.cadProfessor`                    | body `{ nome, email, senha, dt_nasc, telefone, cpf, ft_perfil }`                    | `200 { message }`                                                                                     | `Secretaria/Js/cadastro.js`                                          |
| POST   | `/sec/cadSecretaria`                            | 🌐 ⚠️ | `SecController.cadSecretaria`                   | body as in `cadProfessor`                                                           | `200 { message }`                                                                                     | `Secretaria/Js/cadastro.js`                                          |
| GET    | `/sec/listarUsuarios`                           | 🔒    | `SecController.listarUsuarios`                  | —                                                                                   | `200 [{ id_user, matricula, nome, email, dt_nasc, telefone, cpf, ft_perfil, tipo }]`                  | `Secretaria/Js/ListarUsuarios.js`                                    |
| PUT    | `/sec/editarUsuario/:id_user`                   | 🔒 ⚠️ | `SecController.editarUsuario`                   | path `id_user`, body `{ nome, email, dt_nasc, telefone, senha?, cpf?, ft_perfil? }` | `200` full user record                                                                                | `Secretaria/Js/editarCad.js`                                         |
| DELETE | `/sec/excluirUsuario/:id_user`                  | 🔒 ⚠️ | `SecController.excluirUsuario`                  | path `id_user`                                                                      | `200 { message }`                                                                                     | `Secretaria/Js/ListarUsuarios.js`                                    |
| GET    | `/sec/consultarUsuario/:id_user`                | 🔒    | `SecController.consultarUsuario`                | path: an `id_user`, `id_professor`, `id_aluno` or `id_secretaria`                   | `200 { nome, email, dt_nasc, telefone, cpf, ft_perfil, tipo, id_professor, id_aluno, id_secretaria }` | `Secretaria/Js/editarCad.js`                                         |
| GET    | `/sec/consultarAluno/:id_user`                  | 🔒    | `SecController.consultarAluno`                  | path `id_user`                                                                      | `200` student record with `turma`                                                                     | `Secretaria/Js/editarCad.js`                                         |
| GET    | `/sec/consultarProfessor/:id_user`              | 🔒    | `SecController.consultarProfessor`              | path `id_user`                                                                      | `200 { id_professor, id_user }`                                                                       | `Secretaria/Js/editarCad.js`                                         |
| GET    | `/sec/consultarSecretaria/:id_user`             | 🔒    | `SecController.consultarSecretaria`             | path `id_user`                                                                      | `200 { id_secretaria, id_user }`                                                                      | `Secretaria/Js/editarCad.js`                                         |
| PUT    | `/sec/atualizarTurmaAluno/:id_user`             | 🔒    | `SecController.atualizarTurmaAluno`             | path `id_user`, body `{ id_turma }`                                                 | `200` student record                                                                                  | `Secretaria/Js/editarCad.js`                                         |
| PUT    | `/sec/atualizarEspecialidadeProfessor/:id_user` | 🔒 ❌ | `SecController.atualizarEspecialidadeProfessor` | path `id_user`, body `{ especialidade }`                                            | always `500` once the teacher is found                                                                | `Secretaria/Js/editarCad.js`                                         |
| PUT    | `/sec/atualizarSetorSecretaria/:id_user`        | 🔒 ❌ | `SecController.atualizarSetorSecretaria`        | path `id_user`, body `{ setor }`                                                    | always `500` once the school office user is found                                                     | `Secretaria/Js/editarCad.js`                                         |
| GET    | `/sec/listarTurmasProfessor/:id_user`           | 🔒    | `SecController.listarTurmasProfessor`           | path `id_user`                                                                      | `200` array of class records with `curso`                                                             | —                                                                    |
| PUT    | `/sec/atualizarTurmasProfessor/:id_user`        | 🔒 ⚠️ | `SecController.atualizarTurmasProfessor`        | path `id_user`, body `{ turmas: [id_turma, …] }`                                    | `200 { mensagem }`                                                                                    | `Secretaria/Js/editarCad.js`                                         |
| GET    | `/sec/listarProfessores`                        | 🔒    | `SecController.listarProfessores`               | —                                                                                   | `200 [{ id_professor, nome, email }]`                                                                 | `Secretaria/Js/cadastroMateria.js`, `Secretaria/Js/editarMateria.js` |

**Notes**

- ⚠️ **`POST /sec/cadSecretaria` is public.** It's how the first user is created on an empty database
  (see [local environment](local-environment.md)) — and also a way for anyone to create a school
  office account ([[C1] #1](https://github.com/ftfariasdev/SAGA/issues/1)).
- **Sign-up routes (`cadAluno`, `cadProfessor`, `cadSecretaria`)** create the `user` row (`tipo` 3, 2
  or 1) and then the profile row, **without a transaction**
  ([[D5a] #26](https://github.com/ftfariasdev/SAGA/issues/26)). ⚠️ A duplicate email, phone or CPF
  answers **HTTP 200** with `{ error: 'Email já cadastrado' }` (or `Telefone`/`CPF`) — check the
  body, not just the status. A unique-constraint race answers `400 { error }`; other failures
  `500 { error, detalhes }`. The duplicate checks and password hashing run outside `try/catch`.
- **`POST /sec/cad`** creates only a `user` row with whatever `tipo` is sent, with no student, teacher
  or school office profile. Duplicate email → `200 { error }`. No `try/catch`. Not used by the
  front-end.
- **`PUT /sec/editarUsuario/:id_user`** — `nome`, `email`, `telefone` and `dt_nasc` are always
  written; omitting `dt_nasc` produces an invalid date and a `500`. `senha` is re-hashed when sent.
  ⚠️ The response is the whole user record, **including the `senha` hash**. `404 { erro }`.
- **`DELETE /sec/excluirUsuario/:id_user`** — for a student, first deletes all their attendance and
  grades; for a teacher, their class links; then the profile row and the user. ⚠️ Not transactional
  and not reversible. `404 { message }`. If a foreign key still blocks the deletion — a teacher who
  ever took a roll call or posted grades, since `chamada` and `nota` reference the teacher with
  `ON DELETE RESTRICT` — it answers `500 { message, constraint, error }` after the earlier deletions
  already happened.
- **`consultarUsuario`** tries the ID as `id_user`, then `id_professor`, `id_aluno` and
  `id_secretaria` ([[M7] #21](https://github.com/ftfariasdev/SAGA/issues/21)). `404 { erro }`.
- ❌ **`atualizarEspecialidadeProfessor` and `atualizarSetorSecretaria`** write columns (`especialidade`,
  `setor`) that don't exist in `schema.prisma`, so they always fail with `500` once the profile is
  found (`404` otherwise).
- ⚠️ **`atualizarTurmasProfessor`** deletes all the teacher's class links and then recreates them from
  `turmas`, without a transaction — if the second step fails, the teacher is left with no classes.

### 5.4 Classes (turmas)

| Method | Path                                                  | Auth  | Handler                                | Input                                                                      | Success                                                                                                                             | Used by                                                                                                                    |
| ------ | ----------------------------------------------------- | ----- | -------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/sec/Turma/cadastrar`                                | 🔒    | `SecController.cadTurma`               | body `{ nome, dt_inicio, semestres, id_curso, id_professor? }`             | `201` class record                                                                                                                  | `Secretaria/Js/cadastrarTurma.js`                                                                                          |
| GET    | `/sec/Turma/listar`                                   | 🔒    | `SecController.listarTurmas`           | —                                                                          | `200` array of classes with `curso`, `alunos` (student rows) and `professoresRelation[].professor.user: { nome, email, ft_perfil }` | `Secretaria/Js/cadastro.js`, `Secretaria/Js/editarCad.js`, `Secretaria/Js/editarTurma.js`, `Secretaria/Js/ListarTurmas.js` |
| PUT    | `/sec/Turma/editar/:id`                               | 🔒    | `SecController.editarTurma`            | path `id` (an `id_turma`), body `{ nome, dt_inicio, semestres, id_curso }` | `200` class record                                                                                                                  | `Secretaria/Js/editarTurma.js`                                                                                             |
| DELETE | `/sec/Turma/deletar/:id`                              | 🔒 ⚠️ | `SecController.delTurma`               | path `id` (an `id_turma`)                                                  | `204`                                                                                                                               | `Secretaria/Js/ListarTurmas.js`                                                                                            |
| GET    | `/sec/Turma/consultar/:id_turma`                      | 🔒    | `SecController.consultarTurma`         | path `id_turma`                                                            | `200`, see notes                                                                                                                    | `Secretaria/Js/ConsultarTurma.js`                                                                                          |
| DELETE | `/sec/Turma/removerAluno/:id_aluno`                   | 🔒 ⚠️ | `SecController.removerAlunoTurma`      | path `id_aluno`                                                            | `200 { mensagem, id_user, nome }`                                                                                                   | `Secretaria/Js/ConsultarTurma.js`                                                                                          |
| DELETE | `/sec/Turma/removerProfessor/:id_professor/:id_turma` | 🔒    | `SecController.removerProfessorTurma`  | path `id_professor`, `id_turma`                                            | `200 { mensagem, id_professor, id_turma }`                                                                                          | `Secretaria/Js/ConsultarTurma.js`                                                                                          |
| POST   | `/sec/vicularProfessor`                               | 🔒 ⚠️ | `SecController.vincularProfessorTurma` | body `{ id_professor, id_turma }`                                          | `201` link record                                                                                                                   | —                                                                                                                          |

**Notes**

- **`GET /sec/Turma/consultar/:id_turma`** reshapes the data for the front-end. `404 { erro }` when the
  class doesn't exist.

  ```text
  {
    id_turma, codigo, nome, dt_inicio, semestres,
    curso: { id_curso, nome, codigo, periodo, descricao, ch_total, freq_min },
    professores: [{ id_professor, id_user, nome, email, telefone, foto }],
    alunos: [{ id_aluno, id_user, matricula, nome, email, telefone, data_nascimento, foto }],
    total_alunos, total_professores
  }
  ```

- ⚠️ **`DELETE /sec/Turma/deletar/:id`** deletes the **`aluno` rows of every student in the class**
  (and the class's teacher links) before deleting the class, without a transaction. The database
  doesn't require it — `aluno.id_turma` is `ON DELETE SET NULL`. If any student already has grades or
  attendance, the `RESTRICT` foreign keys make it fail and nothing is deleted. On failure it answers
  `400 { error: <Prisma error object> }` ([[D4] #25](https://github.com/ftfariasdev/SAGA/issues/25)).
- ⚠️ **`DELETE /sec/Turma/removerAluno/:id_aluno`** deletes the student's `aluno` row instead of just
  unlinking the class; the `user` is left without a student profile
  ([[D4] #25](https://github.com/ftfariasdev/SAGA/issues/25)). A student with grades or attendance
  can't be removed (`500`, `ON DELETE RESTRICT`). `404 { erro }` when the student doesn't exist.
- **`removerProfessorTurma`** — `404 { erro }` when the link doesn't exist.
- **`cadTurma`** with `id_professor` also creates the teacher–class link. **`editarTurma`** answers
  `404 { erro }` when the class doesn't exist; `id_curso` is required.
- ⚠️ **`POST /sec/vicularProfessor`** — the typo in the path ("vicular") is part of the contract; don't
  fix it without a task. There's no unique constraint on `professor_turma`, so posting the same pair
  twice creates a duplicate link.

---

## 6. Testing the API

### REST Client files

`Back-end/tests/routesAluno.http`, `routesProf.http` and `routesSec.http` hold ready-made requests.
Open them in VS Code with the **REST Client** extension and click **Send Request** above each block.

> ⚠️ These files contain hardcoded JWTs and plaintext passwords from earlier development
> ([[C4] #2](https://github.com/ftfariasdev/SAGA/issues/2)). Don't add new ones: log in, paste the
> token locally and don't commit it. Tokens expire after 10 hours and only work with the secret that
> signed them.

### curl (macOS, Linux, Git Bash)

Uses the bootstrap user from the [local environment guide](local-environment.md):

```bash
TOKEN=$(curl -s -X POST http://localhost:8081/login \
  -H "Content-Type: application/json" \
  -d '{"email":"secretaria@saga.local","senha":"senha123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0, "utf8")).token')

curl http://localhost:8081/sec/listarCursos -H "Authorization: Bearer $TOKEN"
```

### PowerShell (Windows)

```powershell
$login = Invoke-RestMethod -Uri http://localhost:8081/login -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"secretaria@saga.local","senha":"senha123"}'

Invoke-RestMethod -Uri http://localhost:8081/sec/listarCursos `
  -Headers @{ Authorization = "Bearer $($login.token)" }
```

---

**See also:** [Architecture](architecture.md) · [Database](database.md) ·
[Known issues](known-issues.md) · [Glossary](glossary.md) · [Documentation index](../README.md#documentation)
