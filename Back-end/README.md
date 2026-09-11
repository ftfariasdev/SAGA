# 🔌 SAGA — Back-end (REST API)

🌐 **English** | [Português (Brasil)](../docs/pt-BR/back-end.md)

The SAGA REST API: **Node.js + Express 4** (ES modules), **Prisma 6** as the ORM
and **PostgreSQL 16** running in Docker. It serves the three user areas of the
system — _secretaria_ (school office), _professor_ (teacher) and _aluno_
(student) — to the static front-end in [`../Front-End`](../Front-End/README.md).

> 📘 First time here? The step-by-step setup for macOS, Linux Mint and Windows is
> in [docs/local-environment.md](../docs/local-environment.md).

---

## 🧾 Contents

- [Stack](#-stack)
- [Folder structure](#-folder-structure)
- [Quick start](#-quick-start)
- [Scripts](#-scripts)
- [Environment variables](#-environment-variables)
- [How a request flows](#-how-a-request-flows)
- [Adding an endpoint](#-adding-an-endpoint)
- [Maintenance scripts and manual testing](#-maintenance-scripts-and-manual-testing)
- [Further reading](#-further-reading)

---

## 🧱 Stack

| Package / tool              | Version (`package.json`) | Role in the project                                                              |
| --------------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| Node.js                     | 22 LTS                   | Runtime — the package uses `"type": "module"` (`import`/`export`)                |
| `express`                   | ^4.21.2                  | HTTP server and routing                                                          |
| `@prisma/client` / `prisma` | ^6.5.0 / ^6.6.0          | ORM client and migration CLI                                                     |
| PostgreSQL                  | 16 (Docker image)        | Database (`docker-compose.yml`)                                                  |
| `jsonwebtoken`              | ^9.0.2                   | Issues and verifies JWTs (valid for 10 h)                                        |
| `bcrypt`                    | ^5.1.1                   | Hashes passwords when the secretaria creates or edits users (`secController.js`) |
| `bcryptjs`                  | ^3.0.2                   | Compares passwords at login (`loginController.js`)                               |
| `google-auth-library`       | ^9.15.1                  | Validates Google ID tokens for `POST /login/google`                              |
| `cors`                      | ^2.8.5                   | Allows only the front-end origin `http://127.0.0.1:5500`                         |
| `dotenv`                    | ^16.4.7                  | Loads `.env`                                                                     |
| `date-fns`                  | ^4.1.0                   | Start/end of day in attendance queries (`alunoController.js`)                    |

> ⚠️ Two bcrypt libraries are in use for the same job (they produce compatible
> hashes), `sqlite3` is listed but never imported, and the `package.json`
> metadata (`"name": "dev"`, repository `HugoSants/AuthenticateNode`) is
> leftover from a template. Cleaning this up is tracked in
> [[F10] #12](https://github.com/ftfariasdev/SAGA/issues/12).

---

## 📁 Folder structure

```
Back-end/
├── server.js                    # Entry point: loads .env, CORS, JSON body (50 MB limit), mounts routers, listens on PORT
├── src/
│   ├── Routes/                  # One router per area: URL + middleware → controller method
│   │   ├── routesGeral.js       # /login, /login/google, /token, /health, /info/:id_user, /editarInfo
│   │   ├── routesAluno.js       # /aluno/*                        (student)
│   │   ├── routesProf.js        # /prof/*, /professor/user/:id_user (teacher)
│   │   └── routesSec.js         # /sec/*  courses, subjects, users, classes (school office)
│   ├── controller/              # Validation + business rules + Prisma queries + HTTP response, all together
│   │   ├── loginController.js   # Password and Google login, issues the JWT
│   │   ├── commonController.js  # Profile data shared by every user type
│   │   ├── alunoController.js   # Student: subjects, grades by module, attendance
│   │   ├── profController.js    # Teacher: classes, subjects, roll call, grade entry
│   │   ├── secController.js     # Secretaria: full CRUD (~1,300 lines, the largest file)
│   │   └── profController_fixed.js  # Empty file (orphan)
│   ├── middlewares/
│   │   └── authenticate.js      # tokenAuthenticate: checks "Bearer <JWT>" and sets req.userId
│   └── util/
│       └── prisma.js            # Shared PrismaClient instance
├── prisma/
│   ├── schema.prisma            # Data model (12 models) — see docs/database.md
│   └── migrations/              # Versioned SQL history — never edit a migration that was already applied
├── tests/                       # *.http files for manual requests (VS Code REST Client) — not automated tests
├── docker-compose.yml           # PostgreSQL 16 container: saga-db, volume saga-pgdata, pt-BR ICU collation
├── .env.example                 # Environment template (committed) — copy to .env
├── sync_professores_turmas.js   # Maintenance script (see below)
├── fixMateria.js                # Legacy maintenance script (see below)
├── cadMateria.js                # Orphan: old copy of secController.cadMateria, imported nowhere
├── baseline.sql                 # UTF-16 SQL dump of an early schema, not used by Prisma
└── node_modules.rar             # ~78 MB archive committed by mistake
```

Orphan and legacy files are listed in [docs/known-issues.md](../docs/known-issues.md)
and their removal is tracked in [[F9] #11](https://github.com/ftfariasdev/SAGA/issues/11).

---

## 🚀 Quick start

Requires Node.js 22 and Docker. Full guide:
[docs/local-environment.md](../docs/local-environment.md).

```bash
cd SAGA/Back-end
npm install
cp .env.example .env        # Windows: copy .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # paste into JWT_SECRET
docker compose up -d        # PostgreSQL 16
npx prisma migrate dev      # create the tables
npm run dev                 # "Servidor rodando na porta 8081!"
```

```bash
curl http://localhost:8081/health
# {"status":"UP","timestamp":"2026-09-10T13:00:00.000Z","version":"1.0.0"}
```

The database starts empty — create the first secretaria as described in
[section 7 of the setup guide](../docs/local-environment.md#7-creating-the-first-user).

---

## 📜 Scripts

| Command       | What it does                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev` | `node --watch server.js` — starts the API and restarts it when a file changes                                                                   |
| `npm test`    | Placeholder that prints an error and exits with code 1 — the test suite is planned in [[T1] #31](https://github.com/ftfariasdev/SAGA/issues/31) |

Lint and formatting are **not** in this folder: they live in the
[root `package.json`](../package.json) (`npm run lint`, `npm run format:check`)
and cover both back-end and front-end.

---

## 🔐 Environment variables

Defined in `.env` (copied from [`.env.example`](.env.example)).

| Variable            | Required | Value in `.env.example`                                    | Purpose                                                                                |
| ------------------- | -------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `POSTGRES_USER`     | Yes      | `saga`                                                     | Database user created by the container                                                 |
| `POSTGRES_PASSWORD` | Yes      | `saga`                                                     | Password for that user                                                                 |
| `POSTGRES_DB`       | Yes      | `saga`                                                     | Database name                                                                          |
| `POSTGRES_PORT`     | No       | `5432`                                                     | Port exposed on your machine — use `5433` if 5432 is taken (and update `DATABASE_URL`) |
| `DATABASE_URL`      | Yes      | `postgresql://saga:saga@localhost:5432/saga?schema=public` | Prisma connection string — must match the `POSTGRES_*` values                          |
| `PORT`              | Yes      | `8081`                                                     | API port. **Keep 8081**: the front-end has `http://localhost:8081` hardcoded           |
| `JWT_SECRET`        | Yes      | placeholder                                                | Signs the JWTs — generate your own random value                                        |
| `GOOGLE_CLIENT_ID`  | No       | _(empty)_                                                  | Enables `POST /login/google`; password login works without it                          |

> ⚠️ If `JWT_SECRET` is missing, `authenticate.js` silently falls back to a
> default string while `loginController.js` has no fallback, so tokens can't be
> issued. Centralized, validated configuration is planned in
> [[F2] #4](https://github.com/ftfariasdev/SAGA/issues/4).

---

## 🔄 How a request flows

1. **`server.js`** applies CORS and JSON parsing, then passes the request through
   the routers in order: `routesGeral` → `routesAluno` → `routesProf` →
   `routesSec`.
2. **The router** matches the URL. Protected routes run
   **`tokenAuthenticate`** first: it expects `Authorization: Bearer <token>`,
   verifies it with `JWT_SECRET` and stores the user's `id_user` in
   `req.userId`. It only checks **authentication** — there is no role check yet,
   so any logged-in user can call `/sec/*` routes
   ([[S2] #15](https://github.com/ftfariasdev/SAGA/issues/15)).
3. **The controller method** reads `req.params`, `req.query`, `req.body` and
   `req.userId`, applies the business rules and queries the database through the
   shared client in `src/util/prisma.js`.
4. **The controller responds** with JSON. Most methods have their own
   `try/catch`, but some don't (the course CRUD in `secController.js` and the
   login handlers), and an error there crashes the API process. The error key
   varies between controllers (`erro`, `error` or `message`). A global error
   handler is planned in
   [[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3).

The complete route list is in [docs/api-reference.md](../docs/api-reference.md).

---

## ➕ Adding an endpoint

1. **Choose the router** for the area (`routesGeral`, `routesAluno`, `routesProf`
   or `routesSec`) and declare the route with `tokenAuthenticate`, unless it is
   intentionally public. Prefer wrapping the call —
   `(req, res) => controller.method(req, res)` — so `this` keeps working if the
   method ever uses it.
2. **Write the controller method** and wrap its body in `try/catch`. Express 4
   does not catch rejected promises: an unhandled error becomes an unhandled
   rejection and Node.js terminates the whole API process.
3. **Keep the conventions** of the area you're touching (status codes and the
   error key that controller already uses) and **never return the `senha`
   field**.
4. **If the schema changes**, edit `prisma/schema.prisma`, run
   `npx prisma migrate dev --name <short_description>` and commit the generated
   migration folder. Update [docs/database.md](../docs/database.md) and its
   PT-BR version, [docs/pt-BR/database.md](../docs/pt-BR/database.md).
5. **Document the route** in [docs/api-reference.md](../docs/api-reference.md)
   **and** [docs/pt-BR/api-reference.md](../docs/pt-BR/api-reference.md).
6. **Record the front-end impact** in the pull request (the template asks for it)
   and add a request example to `tests/*.http` — without real tokens or
   passwords.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for branch, commit and PR conventions.

---

## 🧰 Maintenance scripts and manual testing

Run from inside `Back-end/`, with the database up. Both scripts create their own
`PrismaClient` and print their progress to the console.

| Script                            | What it does                                                                                                                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `node sync_professores_turmas.js` | For every subject (`materia`) with a teacher assigned, links that teacher to every class (`turma`) of the subject's course by creating the missing `professor_turma` rows. Safe to re-run. |
| `node fixMateria.js`              | Legacy check that the `id_prof` column exists on `materia`: it creates and then deletes a `TEST_MATERIA` using a **hardcoded course id**. Don't run it against real data.                  |

**Manual API testing:** the files in `tests/` (`routesAluno.http`,
`routesProf.http`, `routesSec.http`) can be run with the VS Code **REST Client**
extension. Log in first and replace the `Authorization` header with your own
token.

> 🔒 These files contain **real tokens and passwords committed in the past**.
> Don't add new ones — removal and secret rotation are tracked in
> [[C4] #2](https://github.com/ftfariasdev/SAGA/issues/2).

---

## 📚 Further reading

- [Architecture](../docs/architecture.md) — how front-end, API and database fit together
- [API reference](../docs/api-reference.md) — every route, its inputs and who calls it
- [Database](../docs/database.md) — models, relationships and migrations
- [Known issues](../docs/known-issues.md) — defects and technical debt, linked to the backlog
- [How to contribute](../CONTRIBUTING.md)
- [Project README](../README.md)
