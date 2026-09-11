# Known issues

🌐 **English** | [Português (Brasil)](pt-BR/known-issues.md)

An honest list of the defects and technical debt found by reading the code — so newcomers aren't
surprised by them and don't build on top of them.

> Checked against the code on 2026-09-10. Line numbers drift as the code changes: if one doesn't
> match, search for the quoted code. Most items already have a task in the
> [backlog](https://github.com/ftfariasdev/SAGA/issues).

## Contents

- [🔴 Security](#-security)
- [🟠 Data integrity](#-data-integrity)
- [🟡 Bugs](#-bugs)
- [🔧 Tooling, CI and DX](#-tooling-ci-and-dx)
- [🧹 Technical debt and cleanup](#-technical-debt-and-cleanup)
- [🎨 Front-end](#-front-end)
- [How to use this list](#how-to-use-this-list)

---

## 🔴 Security

### Public school office sign-up

- **What happens:** `POST /sec/cadSecretaria` is registered without `tokenAuthenticate`
  (`Back-end/src/Routes/routesSec.js:32`).
- **Impact:** anyone who can reach the API can create a school office account — and, since roles
  aren't checked, use every route.
- **Task:** [[C1] #1](https://github.com/ftfariasdev/SAGA/issues/1)

### Tokens and passwords committed in test files

- **What happens:** `Back-end/tests/*.http` contain hardcoded JWTs (3, 6 and 16 `Bearer` lines in
  `routesAluno`, `routesProf` and `routesSec`) and plaintext passwords.
- **Impact:** anyone with access to the repository can read them; tokens signed with a secret that's
  still in use stay valid until they expire.
- **Task:** [[C4] #2](https://github.com/ftfariasdev/SAGA/issues/2)

### No role-based authorization

- **What happens:** `tokenAuthenticate` only verifies the signature, and the JWT payload is only
  `{ userId }` (`Back-end/src/controller/loginController.js:26` and `:72`). No route checks
  `user.tipo`.
- **Impact:** any logged-in user — a student, or a `tipo: 0` user created by the Google login — can
  create, edit and delete users, courses, subjects and classes.
- **Task:** [[S1] #14](https://github.com/ftfariasdev/SAGA/issues/14),
  [[S2] #15](https://github.com/ftfariasdev/SAGA/issues/15)

### Fallback JWT secret

- **What happens:** `Back-end/src/middlewares/authenticate.js:8` verifies tokens with
  `process.env.JWT_SECRET || 'sua_chave_secreta_padrao'`, while `LoginController` signs them with the
  `JWT_SECRET` exported by `server.js`, which has no fallback.
- **Impact:** if `JWT_SECRET` is missing, login fails, but the API accepts tokens forged with a string
  that's public in the repository.
- **Task:** [[F2] #4](https://github.com/ftfariasdev/SAGA/issues/4)

### IDOR on the profile routes

- **What happens:** `GET /info/:id_user` returns any user's data, and `PUT /editarInfo` takes the
  `id_user` to edit from the request body (`Back-end/src/controller/commonController.js:5` and `:36`).
- **Impact:** any logged-in user can read another user's CPF, phone and birth date, and change their
  name, email, phone and photo.
- **Task:** [[S4] #17](https://github.com/ftfariasdev/SAGA/issues/17)

### Google login creates accounts

- **What happens:** when the Google email isn't registered, `LoginController.authGoogle` creates a
  user with `tipo: 0` and placeholder `cpf`/`telefone` `google_<timestamp>`, then returns a valid
  token (`Back-end/src/controller/loginController.js:56-68`).
- **Impact:** any Google account gets a token. The front-end sends `tipo: 0` back to the login page,
  but the token works on every 🔒 route (see "No role-based authorization").
- **Task:** [[S5] #18](https://github.com/ftfariasdev/SAGA/issues/18)

### Password hashes in API responses

- **What happens:** the `senha` bcrypt hash is returned by `PUT /sec/editarUsuario/:id_user` (the full
  record, `secController.js:481`), by `GET /prof/alunos/:id_turma` and `/prof/alunos-turma/:id_turma`
  (`...aluno.user`, `profController.js:102`) and by `GET /prof/chamada/:id_turma/data`
  (`aluno.user`, `profController.js:457-459`).
- **Impact:** hashes can be brute-forced offline, especially weak passwords like the ones in the test
  files.
- **Task:** no task yet (related: [[D5b] #27](https://github.com/ftfariasdev/SAGA/issues/27))

### Internal error details sent to clients

- **What happens:** most `500` responses include `error.message` in `detalhes`/`error`, and
  `commonController.editarInfo` also sends the `stack` whenever `NODE_ENV` isn't `production`.
- **Impact:** exposes table names, constraints and file paths to whoever calls the API.
- **Task:** [[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3)

### No hardening middleware

- **What happens:** no `helmet`, no rate limiting, and JSON/urlencoded bodies are accepted up to
  50 MB (`Back-end/server.js:28-29`).
- **Impact:** `/login` can be brute-forced; large payloads can exhaust memory.
- **Task:** [[S3] #16](https://github.com/ftfariasdev/SAGA/issues/16)

---

## 🟠 Data integrity

### Deleting a class deletes its students

- **What happens:** `SecController.delTurma` runs `prisma.aluno.deleteMany({ where: { id_turma } })`
  and deletes the class's teacher links before deleting the class, without a transaction
  (`secController.js:1057`). The student deletion isn't even required: `aluno.id_turma` is
  `ON DELETE SET NULL` (migration `20250606013519_add_id_prof_to_materia`), so the database would just
  unlink the students.
- **Impact:** when no student of the class has grades or attendance yet, all of them lose their
  student profile and their `user` rows are left without one. Otherwise the `RESTRICT` foreign keys
  make the call fail with `400`.
- **Task:** [[D4] #25](https://github.com/ftfariasdev/SAGA/issues/25)

### Removing a student from a class deletes the student profile

- **What happens:** `SecController.removerAlunoTurma` deletes the `aluno` row instead of unlinking the
  class (`secController.js:1234`).
- **Impact:** a student with grades or attendance can't be removed (`nota_aluno` and `presenca` are
  `ON DELETE RESTRICT`, so the call answers `500`); a student without them loses the profile, and
  the `user` has to be registered as a student again.
- **Task:** [[D4] #25](https://github.com/ftfariasdev/SAGA/issues/25)

### Deleting a user erases academic history

- **What happens:** `SecController.excluirUsuario` (`secController.js:491`) deletes all attendance
  and grades of a student before deleting them, in separate non-transactional steps. For a teacher it
  removes the class links first; `chamada.id_professor` and `nota.id_professor` are
  `ON DELETE RESTRICT`, so a teacher who ever took a roll call or posted grades then fails with a
  `P2003` `500`.
- **Impact:** a student's history is lost for good; a teacher with history can't be deleted, and the
  failed attempt leaves them without classes.
- **Task:** no task yet (related: [[D5b] #27](https://github.com/ftfariasdev/SAGA/issues/27))

### Sign-up isn't transactional

- **What happens:** `cadAluno`, `cadProfessor` and `cadSecretaria` create the `user` and then the
  profile in two separate queries (`secController.js:269-288` for students).
- **Impact:** if the second insert fails (e.g. an invalid `id_turma`), a user without a profile
  remains, and their email, CPF and phone count as taken.
- **Task:** [[D5a] #26](https://github.com/ftfariasdev/SAGA/issues/26)

### Replacing a teacher's classes can wipe them

- **What happens:** `SecController.atualizarTurmasProfessor` runs `deleteMany` and then
  `createMany` without a transaction (`secController.js:928-941`).
- **Impact:** if the second step fails (e.g. an invalid class ID), the teacher ends up with no
  classes.
- **Task:** no task yet

### A subject has a single, global teacher

- **What happens:** `materia.id_prof` stores one teacher for the subject in every class.
  `cadMateria` and `editarMateria` loop over all classes of the course to create or delete
  `professor_turma` links, and `Back-end/sync_professores_turmas.js` exists to repair those links.
- **Impact:** different teachers can't teach the same subject in different classes; links drift, and
  removing a teacher from a subject can delete links that were created by hand.
- **Task:** [[D3] #24](https://github.com/ftfariasdev/SAGA/issues/24)

### Duplicate teacher–class links

- **What happens:** the unique indexes on `professor_turma` were dropped in the migration
  `20250506004317_ajuste_professor_turma`, and there's no composite unique key on
  `(id_professor, id_turma)`. `POST /sec/vicularProfessor` and `cadTurma` don't check for an existing
  link.
- **Impact:** the same teacher can be linked to the same class several times.
- **Task:** no task yet

### Grades are duplicated on every submission

- **What happens:** `ProfController.lancarNotas` always creates a new `nota` + `nota_aluno` per
  student and never updates (`profController.js:380`).
- **Impact:** submitting the grades screen twice stores the grades twice.
- **Task:** [[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)

### Partial saves in roll call and grades

- **What happens:** `realizarChamada` and `lancarNotas` validate each array item inside the loop,
  after the previous items were already written (`profController.js:228-261` and `:368-398`).
- **Impact:** a bad item in the middle returns `400`, but the earlier items stay saved.
- **Task:** [[D6] #28](https://github.com/ftfariasdev/SAGA/issues/28),
  [[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)

---

## 🟡 Bugs

### The student report card never loads

- **What happens:** `routesAluno.js:19` and `:28` call `listBimestreInfo` and `getFrequenciaGeral`,
  which don't exist in `AlunoController`. Express answers `500` with an HTML page.
  `Front-End/Aluno/Js/boletim.js` calls the first one.
- **Impact:** students never see their grades by term.
- **Task:** [[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)

### Module grades are always "-"

- **What happens:** `alunoController.js:117-118` looks for grades with `tipo_avaliacao` `"B1"`/`"B2"`,
  but the grades screen (`Front-End/Professor/Js/lancamento.js:171-172`) always sends
  `tipo_avaliacao: "Prova"` and puts the term in `bimestre` (`"1º Bimestre"` … `"4º Bimestre"`).
  Nothing ever writes `"B1"`/`"B2"`.
- **Impact:** `GET /aluno/modulo/:modulo` never shows a grade.
- **Task:** [[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)

### The roll-call list route always fails

- **What happens:** `ProfController.listarChamada` includes `aluno` and `materia`, which aren't
  relations of `Chamada`, and orders by a missing `id_aluno` (`profController.js:301-312`).
- **Impact:** `GET /prof/chamada/:id_turma` always answers `500`. No screen uses it today.
- **Task:** [[D6] #28](https://github.com/ftfariasdev/SAGA/issues/28)

### Attendance dates are handled in three different ways

- **What happens:** `realizarChamada` matches the exact timestamp (`profController.js:210-216`);
  `buscarChamadaPorData` and `getPresencasByDia` use the UTC day (`profController.js:443-444`,
  `alunoController.js:279-280`); `getFrequenciaByData` uses the server's local day
  (`alunoController.js:189-190`).
- **Impact:** a roll call can show up in one route and be missing from another, and the same day can
  end up with more than one roll call.
- **Task:** [[D6] #28](https://github.com/ftfariasdev/SAGA/issues/28)

### Daily attendance shows the wrong subject

- **What happens:** roll calls don't store a subject, so `getPresencasByDia` reports
  `chamada.professor.materias[0]` (`alunoController.js:299`).
- **Impact:** for teachers with more than one subject, students see the wrong subject name.
- **Task:** [[D6] #28](https://github.com/ftfariasdev/SAGA/issues/28)

### Teacher specialty and school office sector updates always fail

- **What happens:** `atualizarEspecialidadeProfessor` and `atualizarSetorSecretaria` write the columns
  `especialidade` and `setor` (`secController.js:829` and `:860`), which don't exist in
  `schema.prisma`.
- **Impact:** those `PUT` calls from `Front-End/Secretaria/Js/editarCad.js` always answer `500`.
- **Task:** [[D5b] #27](https://github.com/ftfariasdev/SAGA/issues/27)

### Editing a user without a birth date fails

- **What happens:** `editarUsuario` always sends `dt_nasc: new Date(dt_nasc)` to Prisma
  (`secController.js:458`); without `dt_nasc` that's an invalid date.
- **Impact:** `PUT /sec/editarUsuario/:id_user` answers `500` unless `dt_nasc` is sent.
- **Task:** [[D5b] #27](https://github.com/ftfariasdev/SAGA/issues/27)

### Handlers without `try/catch` crash the API process

- **What happens:** `cadCurso`, `listarCursos`, `editarCurso`, `excluirCurso`, `excluirMateria` and
  `criarUsuario` (`secController.js:7-47` and `:211-242`), the duplicate checks of the sign-up
  handlers, `LoginController.auth` and the database part of `LoginController.authGoogle` (after
  `verifyIdToken`, `loginController.js:55-68`) have no `try/catch`. Express 4 doesn't catch rejected
  promises. `editarCurso` also checks `if (!curso)` after `prisma.curso.update`, which throws `P2025`
  instead of returning `null`, so its `404` branch is dead code.
- **Impact:** a database error — editing a course that doesn't exist, or deleting one that still has
  subjects — becomes an unhandled promise rejection, and on Node ≥ 15 it **crashes the API process**,
  not just that request. With `npm run dev` (`node --watch`), the API only comes back after a file
  changes.
- **Task:** [[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3)

### Duplicate sign-ups answer HTTP 200

- **What happens:** when the email, phone or CPF already exists, the sign-up handlers
  `return res.json({ error: '… já cadastrado' })` without setting a status
  (`secController.js:250-264` for students).
- **Impact:** clients that only check `response.ok` treat the failure as success.
- **Task:** [[D5a] #26](https://github.com/ftfariasdev/SAGA/issues/26)

### Duplicate `/health` route

- **What happens:** `Back-end/server.js:33` defines `/health`, but `routesGeral.js:21` registers it
  first and answers instead.
- **Impact:** dead code, and two different response shapes in the source.
- **Task:** [[F3] #5](https://github.com/ftfariasdev/SAGA/issues/5)

### The email isn't stored after a password login

- **What happens:** `Front-End/Login/Js/login.js:83-84` reads `data.email`, but `POST /login` returns
  `emailDoBanco` (`loginController.js:32`).
- **Impact:** `emailUsuario` stays empty in `localStorage` until `Js/menu.js` refetches `/info`.
- **Task:** [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37)

### `/info` never returns the class

- **What happens:** `commonController.js:25` sends `turma: user.turma`, but `User` has no `turma`
  field.
- **Impact:** the key is always `undefined` and disappears from the JSON.
- **Task:** no task yet

---

## 🔧 Tooling, CI and DX

### API port mismatch (fixed)

- **What happens:** `Back-end/.env.example` used to say `PORT=3000`, while the front-end (74
  hardcoded URLs) and the `.http` files call port `8081`.
- **Impact:** following the setup guide, the screens couldn't reach the API.
- **Status:** fixed in the documentation change that introduced this file — the example now uses
  `8081`. Local `.env` files created earlier still need `PORT=8081`.

### CI ignores the Node version

- **What happens:** `.github/workflows/lint.yml:23` and `prettier.yml:23` use `node-node: '20'`
  (typo for `node-version`). `actions/setup-node` ignores the unknown input.
- **Impact:** CI runs on the runner's default Node, not on a pinned version.
- **Task:** [[CI1] #35](https://github.com/ftfariasdev/SAGA/issues/35)

### CI doesn't run tests

- **What happens:** CI only runs `npm run lint` and `npm run format:check`. There's no test suite,
  and `npm test` in `Back-end/` is a placeholder that exits with code 1.
- **Impact:** regressions are only caught by hand.
- **Task:** [[T1] #31](https://github.com/ftfariasdev/SAGA/issues/31),
  [[CI1] #35](https://github.com/ftfariasdev/SAGA/issues/35)

### Prettier check fails locally on Windows

- **What happens:** Git for Windows usually sets `core.autocrlf=true`, which checks files out with
  CRLF. Prettier expects LF, and the repository has no `.gitattributes`.
- **Impact:** `npm run format:check` fails on Windows even when CI (Linux) passes.
- **Suggested fix (not applied):** a `.gitattributes` with `* text=auto eol=lf`.
- **Task:** no task yet

### Root `package.json` setup

- **What happens:** ESLint and Prettier are listed under `dependencies` instead of `devDependencies`,
  and there's no `"type": "module"` although `eslint.config.js` uses `import`.
- **Impact:** Node prints a `MODULE_TYPELESS_PACKAGE_JSON` warning on every `npm run lint`.
- **Task:** no task yet

### Inherited `Back-end/package.json` metadata

- **What happens:** `name` is `"dev"`, `description` is an HTML `<img>` tag, `main` points to a
  missing `index.js`, and `repository`/`bugs`/`homepage` point to `HugoSants/AuthenticateNode`. Two bcrypt
  libraries are used — `bcrypt` (native) hashes passwords in `secController.js` and `bcryptjs`
  compares them in `loginController.js` — and `sqlite3` is installed but never imported (the
  datasource is PostgreSQL).
- **Impact:** confusing metadata, and one password-hashing library too many.
- **Task:** [[F10] #12](https://github.com/ftfariasdev/SAGA/issues/12)

### License not defined

- **What happens:** the README used to claim MIT, but there's no `LICENSE` file, and
  `Back-end/package.json` says `ISC`.
- **Impact:** legally, the code has no license at all.
- **Task:** no task yet (team decision)

### Google client ID in two places

- **What happens:** `Front-End/Login/Js/login.js:218` hardcodes the Google OAuth `client_id`, while
  the back-end verifies tokens against `GOOGLE_CLIENT_ID` from `.env` (empty in `.env.example`).
- **Impact:** Google login only works if both values match. Client IDs aren't secrets, but the
  configuration drifts.
- **Task:** no task yet (related: [[F2] #4](https://github.com/ftfariasdev/SAGA/issues/4),
  [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37))

---

## 🧹 Technical debt and cleanup

### Ad-hoc logging

- **What happens:** controllers log with `console.error`, without levels or request context.
- **Impact:** hard to trace a failing request.
- **Task:** [[F8] #10](https://github.com/ftfariasdev/SAGA/issues/10)

### No input validation

- **What happens:** request bodies are destructured and passed straight to Prisma.
- **Impact:** a missing or mistyped field surfaces as a Prisma error and a `500` instead of a `400`.
- **Task:** [[F6] #8](https://github.com/ftfariasdev/SAGA/issues/8)

### No pagination

- **What happens:** `listarUsuarios`, `listarTurmas`, `listarCursos` and the other list routes return
  every row.
- **Impact:** responses grow with the school.
- **Task:** [[P2] #13](https://github.com/ftfariasdev/SAGA/issues/13)

### Inconsistent error shapes

- **What happens:** error bodies use `erro`, `error` or `message`; some `204` responses try to send a
  body; `delTurma` answers `400` with the raw Prisma error object.
- **Impact:** the front-end has to guess where the message is.
- **Task:** [[F5] #7](https://github.com/ftfariasdev/SAGA/issues/7),
  [[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3)

### `server.js` does too much

- **What happens:** configuration, CORS, routes and `listen` live in one file, and `loginController.js`
  imports `JWT_SECRET` from `server.js` (a circular import). There's no graceful shutdown.
- **Impact:** the app can't be imported by tests without starting the server.
- **Task:** [[F3] #5](https://github.com/ftfariasdev/SAGA/issues/5),
  [[F2] #4](https://github.com/ftfariasdev/SAGA/issues/4)

### Maintenance scripts create their own Prisma client

- **What happens:** `Back-end/fixMateria.js:6` and `Back-end/sync_professores_turmas.js:6` call
  `new PrismaClient()`; the API itself uses the shared `src/util/prisma.js`.
- **Impact:** low — but the pattern is easy to copy into the API by mistake.
- **Task:** [[F4] #6](https://github.com/ftfariasdev/SAGA/issues/6)

### Orphan and legacy files

- **What happens:**
  - `Back-end/cadMateria.js` — an old copy of `cadMateria`, not imported anywhere.
  - `Back-end/src/controller/profController_fixed.js` — empty file.
  - `Back-end/fixMateria.js` — one-off check with a hardcoded course ID (line 19) that inserts and
    deletes a test subject.
  - `Back-end/node_modules.rar` — about 78 MB tracked in Git.
  - `Back-end/baseline.sql` — UTF-16 dump of an early schema, not a Prisma migration.
- **Impact:** noise for newcomers; the archive makes every clone much heavier.
- **Task:** [[F9] #11](https://github.com/ftfariasdev/SAGA/issues/11)

### Migration history with a lossy rewrite

- **What happens:** two migrations share the name `add_nota` (`20250508225216_add_nota` and
  `20250515005914_add_nota`). The second one drops the `valor`, `bimestre`, `data` and `id_aluno`
  columns of `nota` to move grades into `nota_aluno`, without copying the data. `bimestre` came back
  later as text (`20250615203113_add_bimestre_to_nota`).
- **Impact:** any database migrated through it lost the grades it held, and the history is hard to
  follow.
- **Task:** no task yet (related: [[M0] #19](https://github.com/ftfariasdev/SAGA/issues/19))

### The API exposes internal profile IDs

- **What happens:** some URLs take `id_professor` or `id_aluno` instead of `id_user`, some ignore
  their path parameter (`/prof/turmas/:id_professor`, `/professor/user/:id_user`), and
  `consultarUsuario` accepts four different kinds of ID.
- **Impact:** the front-end has to juggle several IDs for the same person.
- **Task:** [[M7] #21](https://github.com/ftfariasdev/SAGA/issues/21)

---

## 🎨 Front-end

### API URL hardcoded everywhere

- **What happens:** `http://localhost:8081` appears 74 times in 29 JavaScript files.
- **Impact:** changing the port or deploying anywhere else means editing every file.
- **Task:** [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37)

### Pages that skip the token check

- **What happens:** `Secretaria/Page/Cadastro.html`, `cadastroMateria.html`, `editarMateria.html`,
  `editarUsuario.html` and `ListarCursos.html` don't load `Js/verificaToken.js`.
- **Impact:** these pages open without redirecting to the login; their API calls then fail with
  `401`.
- **Task:** no task yet (related: [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37))

### Broken script includes

- **What happens:** `Secretaria/Page/info.html:109` loads `../Js/verificaToken.js`, which doesn't
  exist (the file is in `Front-End/Js/`). `Login/RecSenha.html:21` and `Login/ConfirRecSenha.html:20`
  load `Js/script.js`, which doesn't exist either.
- **Impact:** the school office profile page never checks the token, and the password recovery
  screens have no logic — there's no back-end route for it.
- **Task:** no task yet

### Google-created users are sent back to the login page

- **What happens:** `handleGoogleCredentialResponse` in `Front-End/Login/Js/login.js` has no case for
  `tipo: 0`, so the `default` branch (lines 191-192) redirects to `Login.html` without any message —
  after the token was already stored.
- **Impact:** someone whose Google account isn't registered seems to "log in" and lands on the login
  page again, with a valid token in `localStorage`.
- **Task:** related: [[S5] #18](https://github.com/ftfariasdev/SAGA/issues/18)

### `id_user` is read but never written

- **What happens:** `Secretaria/Js/editarInfo.js:237` and `:315` read
  `localStorage.getItem('id_user')`, but no script ever stores that key — the login stores `userId`.
- **Impact:** the school office "edit my info" screen gets `null` instead of the logged-in user's ID.
- **Task:** related: [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37)

### The student attendance chart is static

- **What happens:** `Aluno/Js/freq1.js` draws a chart with the fixed data `[50, 50]` (line 10), and
  its only `fetch` uses the relative URL `/aluno/listMateria` (line 53), which goes to Live Server
  (`127.0.0.1:5500`) instead of the API.
- **Impact:** the attendance page (`Aluno/Page/Freq1.html`) always shows 50/50, whatever the real
  attendance is.
- **Task:** [[FE5] #41](https://github.com/ftfariasdev/SAGA/issues/41)

### Orphan front-end scripts

- **What happens:** `Aluno/Js/dia.js`, `Aluno/Js/script.js`, `Professor/Js/boletim.js` and
  `Professor/Js/script.js` aren't loaded by any page.
- **Impact:** dead code that looks important — editing it changes nothing.
- **Task:** no task yet (related: [[F9] #11](https://github.com/ftfariasdev/SAGA/issues/11), which
  covers the back-end)

### Script loaded twice

- **What happens:** `Secretaria/Page/ListarTurmas.html` includes `../Js/ListarTurmas.js` on lines 17
  and 98.
- **Impact:** the script runs twice on the class list page.
- **Task:** no task yet

### Inconsistent file and folder casing

- **What happens:** `Aluno/Css` and `Professor/Css` vs `Secretaria/css`; `HomeAluno.Html` and
  `HomeProfessor.Html`, while `Login/Js/login.js:97` and `:105` redirect to `.html`; a folder named
  `Css Base` (with a space).
- **Impact:** works on Windows and macOS, but gives `404` on case-sensitive file systems and most web
  servers.
- **Task:** no task yet

### CORS allows a single origin

- **What happens:** `Back-end/server.js:19` only allows `http://127.0.0.1:5500`.
- **Impact:** opening the front-end as `http://localhost:5500` (or any other port) blocks every API
  call.
- **Task:** no task yet (related: [[F2] #4](https://github.com/ftfariasdev/SAGA/issues/4))

---

## How to use this list

- **Fixed something?** Remove the item from **both** `docs/known-issues.md` and
  `docs/pt-BR/known-issues.md` in the same pull request.
- **Found something?** Add it to both files, in the right group, with the file and line, the impact
  and the backlog task (or "no task yet").
- **Don't fix items here in passing.** Each fix changes behavior someone may rely on — open or pick
  up the task, and follow [CONTRIBUTING.md](../CONTRIBUTING.md).

**See also:** [API reference](api-reference.md) · [Architecture](architecture.md) ·
[Database](database.md) · [Documentation index](../README.md#documentation)
