# CLAUDE.md

🌐 **English** | [Português (Brasil)](docs/pt-BR/ai-agents.md)

Guidance for AI coding agents (Claude Code and similar) working in this repository. Claude Code
loads this file automatically. Its PT-BR translation for human readers is
[docs/pt-BR/ai-agents.md](docs/pt-BR/ai-agents.md) — deliberately not named `CLAUDE.md`, so Claude Code
doesn't load it as a second set of instructions. Keep both in sync.

## Project at a glance

SAGA is a school management web app (school office, teachers, students) built by a small team that
includes developers who are still learning — prefer clear, explicit code over clever abstractions.

| Part         | Tech                                                      | Runs at                                       |
| ------------ | --------------------------------------------------------- | --------------------------------------------- |
| `Front-End/` | Static HTML/CSS/vanilla JS, one folder per role, no build | `http://127.0.0.1:5500` (VS Code Live Server) |
| `Back-end/`  | Node.js 22, Express 4 (ES modules), Prisma 6              | `http://localhost:8081`                       |
| Database     | PostgreSQL 16 in Docker (container `saga-db`)             | `localhost:5432`                              |

Identifiers, UI text and most of the commit history are in **Portuguese**. Domain terms (`aluno`,
`turma`, `materia`, `chamada`, `nota`, `bimestre`…) are explained in
[docs/glossary.md](docs/glossary.md).

The codebase is under a planned refactoring tracked as GitHub issues with bracketed IDs (`[F1]`,
`[S2]`, `[D4]`…). One pull request = one issue.

## Commands

Repository root — lint and format tooling only:

```bash
npm install
npm run lint          # ESLint — keep it at 0 errors and 0 warnings
npm run lint:fix
npm run format:check  # Prettier on **/*.{js,json,md} — CI runs this
npm run format
```

`Back-end/`:

```bash
docker compose up -d                       # start PostgreSQL
npx prisma generate                        # regenerate the Prisma Client
npx prisma migrate dev                     # apply migrations
npx prisma migrate dev --name <snake_case> # create a migration after editing schema.prisma
npx prisma studio                          # database GUI on :5555
npm run dev                                # API with node --watch
curl http://localhost:8081/health          # {"status":"UP",...}
```

There is **no test runner yet**: `npm test` in `Back-end/` exits 1 on purpose until `[T1]` #31.
Verify backend changes by running the API and calling the affected routes (`Back-end/tests/*.http`
or `curl`).

## Architecture map

Request path: `server.js` → `src/Routes/routes{Geral,Aluno,Prof,Sec}.js` → `tokenAuthenticate`
(`src/middlewares/authenticate.js`) → controller class in `src/controller/` → Prisma
(`src/lib/prisma.js`) → PostgreSQL.

- There is no service or repository layer: controllers hold the business rules and call Prisma
  directly.
- `tokenAuthenticate` only verifies the JWT and sets `req.userId`. There is **no role-based
  authorization** — any signed-in user can call `/sec/*` (`[S2]` #15).
- `routesAluno.js` and `routesProf.js` wrap handlers in arrow functions; `routesGeral.js` and
  `routesSec.js` pass unbound methods (`secController.cadCurso`), so `this` is `undefined` inside
  `SecController`, `commonController` and `LoginController` methods.
- Front-end pages call `fetch('http://localhost:8081/...')` directly. The session lives in
  `localStorage` (`token`, `tipo`, `userId`, `nomeUsuario`, `emailUsuario`, `fotoPerfil`).

Details: [docs/architecture.md](docs/architecture.md), [docs/api-reference.md](docs/api-reference.md),
[docs/database.md](docs/database.md), [Front-End/README.md](Front-End/README.md).

## Rules

1. **Don't commit, push or stage** unless the user asks. Branching is **Git Flow**: `feature/` and
   `bugfix/` branches start from `develop` and go back through a pull request to `develop`; only
   `release/` and `hotfix/` target `main`. Never run `git flow … finish` — merges happen through
   pull requests.
2. **Treat the HTTP contract as frozen.** Front-end scripts hardcode paths, field names and status
   codes. Don't rename routes, request/response fields or status codes unless the backlog task says
   so. When a change is authorized, record the front-end impact and update `docs/api-reference.md`
   in both languages.
3. **Never renumber `User.tipo`**: `0` = created by Google sign-in, `1` = Secretaria,
   `2` = Professor, `3` = Aluno. The values are stored in the database and the login page redirects
   on them.
4. Never return `senha` (the password hash) in a response. Never commit `.env`, tokens or real
   passwords.
5. Change the schema only through Prisma migrations. Commit `schema.prisma` together with the new
   migration folder, and never edit a migration that has already been applied.
6. Use the Portuguese domain vocabulary for new identifiers (`listarTurmas`, `id_turma`) and don't
   translate existing names.
7. Match the existing style: ES module imports; Prettier (single quotes, semicolons, width 100, no
   trailing commas); ESLint `eqeqeq`, `require-await`, `no-return-await`, `no-console` except
   `console.error`/`console.warn` (CLI scripts are exempt). Run `npm run lint` and
   `npm run format:check` before finishing.
8. Commit messages follow Conventional Commits — `type(scope): description`. See
   [CONTRIBUTING.md](CONTRIBUTING.md).
9. **Documentation is bilingual.** English lives where GitHub and tools look for it (`README.md`,
   `CONTRIBUTING.md`, `CLAUDE.md`, the folder `README.md` files and `docs/<name>.md`). Every PT-BR
   translation lives in `docs/pt-BR/`: same file name for documents from `docs/`, `back-end.md` and
   `front-end.md` for the folder READMEs, `ai-agents.md` for this file. Each doc has a language
   switcher right under the H1. Update both languages in the same change and add new docs to the
   documentation tables in `README.md` and `docs/pt-BR/README.md`. The only single-file exception is
   `.github/pull_request_template.md`, which is bilingual inside. Full rules:
   [CONTRIBUTING.md § 6](CONTRIBUTING.md#6-documentation-rules).

## Gotchas

- **Port 8081.** The front-end hardcodes it, so `.env` must keep `PORT=8081`. CORS allows only
  `http://127.0.0.1:5500` — not `localhost:5500`, not `file://`.
- `/health` is defined twice; the one in `routesGeral.js` (`{"status":"UP"}`) wins because that
  router is mounted first.
- `GET /aluno/bimestre/:bimestre` and `GET /aluno/frequencia-geral` point to controller methods that
  don't exist, so they fail with 500 (`[D7]` #29).
- `DELETE /sec/Turma/deletar/:id` also deletes the class's student records (`[D4]` #25). Don't try it
  on data you care about.
- `POST /sec/cadSecretaria` is public on purpose so a fresh local database can be bootstrapped
  (`[C1]` #1 will close it).
- Error payloads are inconsistent (`erro` / `error` / `message`). Follow the surrounding handler's
  shape until `[F1]` #3 introduces a global error handler.
- Windows: `core.autocrlf=true` and no `.gitattributes`, so Prettier flags CRLF line endings locally.
  CI on Linux is authoritative; `npx prettier --check --end-of-line auto <files>` confirms that only
  line endings differ.
- Orphan files — `Back-end/cadMateria.js` (unused), `src/controller/profController_fixed.js` (empty),
  `Back-end/node_modules.rar` — don't import or extend them (`[F9]` #11).
- Full list: [docs/known-issues.md](docs/known-issues.md).

## Where to look

| Task                      | Files                                                                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Add or change an endpoint | `Back-end/src/Routes/routes*.js`, `Back-end/src/controller/*Controller.js`, `docs/api-reference.md` (+ `docs/pt-BR/`)                  |
| Authentication / JWT      | `src/controller/loginController.js`, `src/middlewares/authenticate.js`, `Front-End/Js/verificaToken.js`, `Front-End/Login/Js/login.js` |
| Database schema           | `Back-end/prisma/schema.prisma`, `Back-end/prisma/migrations/`, `docs/database.md` (+ `docs/pt-BR/`)                                   |
| A screen                  | `Front-End/<Role>/Page/*.html` + `Front-End/<Role>/Js/*.js` (map in `Front-End/README.md`)                                             |
| Shared front-end helpers  | `Front-End/Js/verificaToken.js`, `menu.js`, `mascaras.js`                                                                              |
| Environment and config    | `Back-end/.env.example`, `Back-end/docker-compose.yml`, `Back-end/server.js`                                                           |
| Lint, format, CI          | `eslint.config.js`, `.prettierrc`, `.github/workflows/`                                                                                |
| Contribution rules        | `CONTRIBUTING.md`, `.github/pull_request_template.md`                                                                                  |
