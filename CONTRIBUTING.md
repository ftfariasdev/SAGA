# Contributing to SAGA

🌐 **English** | [Português (Brasil)](docs/pt-BR/CONTRIBUTING.md)

This guide defines how we name branches, write commits and open pull requests in SAGA. A readable
git history is a diagnostic tool: when something breaks, `git log` and `git bisect` answer "when did
this change and why" — **only if** the messages say something. "updates" and "small fix" don't.

> 🗣️ **This is a team agreement, not a unilateral rule.** The convention was proposed in
> [[CI2] #36](https://github.com/ftfariasdev/SAGA/issues/36) and must be discussed with the team
> before it is merged. A convention nobody agreed to is a convention nobody follows. Record the
> agreement in the PR.

---

## 📑 Table of contents

1. [Branching model — Git Flow](#1-branching-model--git-flow)
2. [Commits — Conventional Commits](#2-commits--conventional-commits)
3. [Pull requests](#3-pull-requests)
4. [Before opening a PR](#4-before-opening-a-pr)
5. [Code style and naming conventions](#5-code-style-and-naming-conventions)
6. [Documentation rules](#6-documentation-rules)
7. [Security basics](#7-security-basics)
8. [Automation (what we chose not to install)](#8-automation-what-we-chose-not-to-install)
9. [Pitfalls](#9-pitfalls)

---

## 1. Branching model — Git Flow

SAGA uses **[Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)** with the
[git-flow AVH](https://github.com/petervanderdoes/gitflow-avh) command-line tool. The repository is
already set up for it: production branch `main`, development branch `develop` and the default
prefixes below.

> 🧰 **Installing the tool.** Git for Windows already includes it (check with `git flow version`).
> On Linux Mint: `sudo apt install git-flow`. On macOS, install it with your package manager — or
> skip the tool: every `git flow` command below has a plain Git equivalent.

### Long-lived branches

| Branch    | Role                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| `main`    | What has been released. Every merge into `main` is a version and gets a tag (`1.0.0`). Never commit to it. |
| `develop` | Integration branch — the next release. Feature and bugfix work lands here.                                 |

### Short-lived branches

| Prefix     | Starts from | Merges into              | Use it for                                                                          |
| ---------- | ----------- | ------------------------ | ----------------------------------------------------------------------------------- |
| `feature/` | `develop`   | `develop`                | Planned backlog work: new functionality, refactors, docs, tests, tooling, CI        |
| `bugfix/`  | `develop`   | `develop`                | Fixing a bug on `develop` that doesn't need an urgent release                       |
| `release/` | `develop`   | `main` **and** `develop` | Preparing a version (`release/1.1.0`): version bump and last fixes, no new features |
| `hotfix/`  | `main`      | `main` **and** `develop` | An urgent fix to the released version (`hotfix/1.0.1`)                              |

The `support/` prefix exists in the Git Flow configuration but isn't used.

> 💡 **The branch prefix is not the commit type.** The prefix says where the branch starts and where
> it goes; the kind of change (`feat`, `refactor`, `docs`…) goes in the commits and the PR title
> ([section 2](#2-commits--conventional-commits)). A refactor task is a `feature/` branch whose
> commits start with `refactor`.

### Naming

`<prefix>/<short-description>` — lowercase, words separated by hyphens (kebab-case). Release and
hotfix branches are named after the version.

Examples: `feature/error-handler-global`, `feature/documentation-standard-for-contributions`,
`bugfix/boletim-aluno`, `release/1.1.0`, `hotfix/1.0.1`.

### Day-to-day commands

```bash
# Once per clone. Answer: production branch "main", development branch "develop",
# default prefixes, and leave the version tag prefix EMPTY (the existing tag is "1.0.0").
git flow init

# Start from an up-to-date develop
git switch develop
git pull
git flow feature start error-handler-global     # creates feature/error-handler-global
git flow bugfix start boletim-aluno             # creates bugfix/boletim-aluno

# Share the branch, then open a pull request to develop
git flow feature publish error-handler-global   # same as: git push -u origin feature/error-handler-global
```

Without the git-flow tool, the equivalent is `git switch -c feature/error-handler-global develop`.

> ⚠️ **Don't run `git flow feature finish` or `git flow bugfix finish`.** They merge into `develop`
> on your machine and delete the branch, skipping review and CI. Features and bugfixes reach
> `develop` only through a pull request. Once the PR is merged, delete the branch and `git pull` on
> `develop`.

### Releases and hotfixes

Prepared by whoever the team assigns for the version:

1. Start the branch: `git flow release start 1.1.0` (from `develop`) or
   `git flow hotfix start 1.0.1` (from `main`).
2. Commit only release adjustments: version numbers, last fixes, docs.
3. Open a pull request to `main` and merge it with **Create a merge commit** (never squash).
4. Tag the merge commit with the version — no prefix, like the existing `1.0.0`:

   ```bash
   git switch main
   git pull
   git tag -a 1.1.0 -m "Release 1.1.0"
   git push origin 1.1.0
   ```

5. Bring the release back into `develop` with a pull request from `main` to `develop` (merge
   commit).

CI (ESLint + Prettier, see `.github/workflows/`) runs on every push and pull request to `main` and
`develop`, so release and hotfix pull requests are checked too.

---

## 2. Commits — Conventional Commits

```
<type>(<scope>): <description>

[optional body — the "why"]

[optional footers]
```

### Types

| Type       | When to use                                              |
| ---------- | -------------------------------------------------------- |
| `feat`     | New functionality                                        |
| `fix`      | Bug fix                                                  |
| `refactor` | Changes the code without changing behavior               |
| `test`     | Adds or fixes tests                                      |
| `docs`     | Documentation only                                       |
| `chore`    | Build, dependencies, configuration                       |
| `ci`       | CI workflows (`.github/workflows/`)                      |
| `style`    | Formatting only, no logic change (e.g. running Prettier) |

### Suggested scopes

The scope says **which part of the system** changed. Prefer one of these:

| Scope         | Area                                                 |
| ------------- | ---------------------------------------------------- |
| `auth`        | Login, Google login, JWT, `authenticate` middleware  |
| `usuarios`    | User registration, lookup and editing (all profiles) |
| `alunos`      | Student features                                     |
| `professores` | Teacher features                                     |
| `secretaria`  | School office (secretaria) features                  |
| `cursos`      | Courses                                              |
| `materias`    | Subjects                                             |
| `turmas`      | Classes                                              |
| `chamada`     | Roll call / attendance                               |
| `notas`       | Grades and report card (boletim)                     |
| `db`          | Prisma schema, migrations, `docker-compose.yml`      |
| `api`         | Cross-cutting API concerns (server, routes, CORS)    |
| `front`       | Front-end pages, scripts and styles                  |
| `docs`        | Documentation                                        |
| `ci`          | CI workflows                                         |
| `deps`        | Dependency updates                                   |

The domain vocabulary is Portuguese — see [docs/glossary.md](docs/glossary.md).

### Rules

- **Imperative mood**: "add", "fix", "remove" — not "added" or "adding".
- Start the description in **lowercase** and **don't** end it with a period.
- Keep the header line at **72 characters or less**.
- `type` and `scope` are the English keywords above. The **description** may be in Portuguese or
  English — but keep **one language per PR**.
- **Breaking change to the HTTP contract** (the front-end depends on it): add `!` after the
  type/scope and a `BREAKING CHANGE:` footer explaining what the front-end must change.
- Link issues in the footer: `Refs: #36` (related) or `Closes #36` (resolves it).

### Examples

```
refactor(erros): adiciona error handler global e asyncHandler
fix(notas): corrige boletim do aluno que nunca exibia nota
feat(auth): adiciona middleware de autorização por perfil
docs(contrib): document the contribution standard
ci: fix node-version input in lint workflow
```

Breaking change (illustrative example):

```
refactor(auth)!: put the user profile in the JWT payload

BREAKING CHANGE: /login no longer returns `emailDoBanco`; use `email`.
Refs: #14
```

### Bad → good (real commits from this repository)

| ❌ Before                  | ✅ After                                                 |
| -------------------------- | -------------------------------------------------------- |
| `updates`                  | `docs(readme): update installation steps`                |
| `small fix`                | `fix(turmas): keep selected course when editing a class` |
| `Adicionando mascaras`     | `feat(front): adiciona máscaras de CPF e telefone`       |
| `more modal implementaton` | `refactor(front): replace alert() with modal messages`   |

> The "after" column shows the **shape** of a good message; the exact wording depends on what the
> original commit actually changed.

---

## 3. Pull requests

- **One PR = one backlog task.** The backlog lives in the
  [GitHub issues](https://github.com/ftfariasdev/SAGA/issues) — each title starts with its ID, such
  as `[C1]`, `[F1]`, `[S2]`, `[D7]`, `[CI2]`.
- **The system must work at the end of every PR.** No "part 1 of 3" that leaves the API broken.
- **Title** = commit convention + task ID:
  - `refactor(erros): [F1] adiciona error handler global`
  - `docs(contrib): [CI2] document contribution standard`
- **Base branch:** `develop` for `feature/` and `bugfix/` branches; `main` for `release/` and
  `hotfix/` branches, which then go back into `develop` ([section 1](#releases-and-hotfixes)).
- **Description:** fill in the template (it loads automatically) and link the issue with
  `Closes #N`.
- **Review:** at least **one approving review** before merging.
- **Merge strategy (to be agreed by the team):**
  - `feature/` and `bugfix/` → `develop`: **Squash and merge**, using the PR title as the commit
    message. That keeps `develop` history conventional. For comparison, PR #43 landed as
    `Feature/config eslint and prettier (#43)` — exactly what this convention avoids.
  - `release/` and `hotfix/` → `main`, and `main` → `develop`: **Create a merge commit**, never
    squash. A squash creates commits on `main` that don't exist on `develop`, and the next release
    conflicts.

---

## 4. Before opening a PR

From the **repository root** (lint and format tools live there):

```bash
npm install            # once
npm run lint           # ESLint
npm run format:check   # Prettier
```

Fix automatically with:

```bash
npm run lint:fix
npm run format
```

> 🪟 **Windows and line endings.** With `core.autocrlf=true`, git checks files out with CRLF, but
> Prettier expects LF. `format:check` may flag files locally that pass in CI (Linux). To confirm
> it's only line endings:
>
> ```bash
> npx prettier --check --end-of-line auto .
> ```

> 🧪 `npm test` is **not configured yet** — the current script is a placeholder that exits with an
> error. Test infrastructure arrives with [[T1] #31](https://github.com/ftfariasdev/SAGA/issues/31).

Backend smoke test (inside `Back-end/`, setup in
[docs/local-environment.md](docs/local-environment.md)):

```bash
docker compose up -d
npm run dev
curl http://localhost:8081/health
```

---

## 5. Code style and naming conventions

These describe what the repository **already does**. Follow them for consistency.

### Formatting and lint

- **Prettier** (`.prettierrc`): semicolons, single quotes, `printWidth` 100, no trailing commas.
- **ESLint** (`eslint.config.js`), main rules:
  - `eqeqeq` — always `===` / `!==`.
  - `no-unused-vars` — unused arguments are allowed only when named `next` or prefixed with `_`.
  - `no-console` — only `console.error` and `console.warn`. CLI scripts (`server.js`,
    `fixMateria.js`, `sync_professores_turmas.js`) are exempt.
  - `require-await` and `no-return-await`.

### Back-end

- ES Modules (`"type": "module"` in `Back-end/package.json`) — use `import`/`export`.
- Controllers: `src/controller/<domain>Controller.js`, each exporting a class.
- Routers: `src/Routes/routes<Domain>.js`.
- Middlewares: `src/middlewares/`.

### Database

- Columns in `snake_case`; keys use the `id_` prefix (`id_user`, `id_turma`).
- Prisma models in `PascalCase`, mapped to `snake_case` tables with `@@map` (`ProfessorTurma` →
  `professor_turma`).

### Domain language

The domain vocabulary is **Portuguese** (`aluno`, `turma`, `materia`, `chamada`, `nota`…). Keep
using it for new identifiers and **don't translate existing names** — a half-translated codebase is
harder to search. See [docs/glossary.md](docs/glossary.md).

### Front-end

Organized per user role: `Front-End/<Role>/{Page,Js,Css}` (`Aluno`, `Professor`, `Secretaria`),
with shared scripts in `Front-End/Js/` and shared styles in `Front-End/Css Base/`.

---

## 6. Documentation rules

Every document exists in **EN-US and PT-BR**, and both are updated in the **same PR**.

### Where each language lives

- **EN-US** stays where GitHub and tools look for it: `README.md`, `CONTRIBUTING.md` and `CLAUDE.md`
  at the root, `Back-end/README.md`, `Front-End/README.md` and `docs/<name>.md`.
- **PT-BR** lives entirely in [`docs/pt-BR/`](docs/pt-BR/README.md), so no folder lists every
  document twice.

| EN-US                                       | PT-BR                                                |
| ------------------------------------------- | ---------------------------------------------------- |
| `docs/<name>.md`                            | `docs/pt-BR/<name>.md` (same name)                   |
| `README.md`, `CONTRIBUTING.md`              | `docs/pt-BR/README.md`, `docs/pt-BR/CONTRIBUTING.md` |
| `Back-end/README.md`, `Front-End/README.md` | `docs/pt-BR/back-end.md`, `docs/pt-BR/front-end.md`  |
| `CLAUDE.md`                                 | `docs/pt-BR/ai-agents.md`                            |

The translation of `CLAUDE.md` is deliberately **not** named `CLAUDE.md`: Claude Code automatically
loads any `CLAUDE.md` it finds in a subfolder and would read it as a second set of instructions.

### Writing rules

- **Casing:** GitHub-special files at the root are UPPERCASE; every other documentation file is
  lowercase kebab-case (`local-environment.md`).
- **Language switcher:** the line right after the H1 links to the other language, e.g.
  `🌐 **English** | [Português (Brasil)](docs/pt-BR/README.md)`.
- **New documents** are added to the documentation tables of [README.md](README.md#all-documents)
  and [docs/pt-BR/README.md](docs/pt-BR/README.md#todos-os-documentos).
- **Describe the code as it is today.** Mark anything planned as planned and link its issue. When
  you fix an item from [docs/known-issues.md](docs/known-issues.md), remove it from both languages.
- **API changes** update [docs/api-reference.md](docs/api-reference.md) (and `docs/openapi.yaml`
  once [[DOC1] #34](https://github.com/ftfariasdev/SAGA/issues/34) lands).
- **Formatting:** Prettier checks Markdown in CI (`npm run format`). Mermaid diagrams are welcome —
  GitHub renders them.
- The only exception to the two-file rule is `.github/pull_request_template.md`: GitHub loads a
  single default template, so it is bilingual in one file.

---

## 7. Security basics

- **Never commit** `.env`, real tokens or real passwords. `.env` is already in `.gitignore`; add new
  variables to `Back-end/.env.example` without secret values.
- ⚠️ The `Back-end/tests/*.http` files currently contain real JWTs — removing them and rotating the
  secret is tracked in [[C4] #2](https://github.com/ftfariasdev/SAGA/issues/2). Don't add more.
- **No API response may return `senha`** (password hash), not even hashed.

---

## 8. Automation (what we chose not to install)

`commitlint` + `husky` (validating messages on commit) are **intentionally not installed**. With
part of the team still learning, a hook that rejects commits builds frustration before it builds a
habit. We start with a written convention; if the team asks for automation later, we add it.

---

## 9. Pitfalls

- **Don't rewrite history** to "fix" old commits. High cost, zero value.
- **Keep checklists short.** A long checklist becomes boxes ticked without reading — six items is
  the practical limit.
- **A convention that wasn't agreed on is a convention that's ignored.** Discuss changes to this
  document with the team first.
