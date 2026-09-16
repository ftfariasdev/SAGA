# 🏫 SAGA — Academic Administration and Management System

🌐 **English** | [Português (Brasil)](docs/pt-BR/README.md)

<img src="Front-End/Img/login_img.PNG" alt="SAGA login screen" />

**SAGA** (_Sistema de Administração e Gestão Acadêmica_) is a web application for small and
medium-sized schools. The school office registers courses, subjects, classes and users; teachers
take roll call and post grades; students follow their subjects, grades and attendance.

> 🚧 **Status:** the system runs locally and is going through a planned refactoring of the backend,
> database, security and front-end. The work is tracked as
> [GitHub issues](https://github.com/ftfariasdev/SAGA/issues) — see [Project status](#project-status).
> Known defects are listed in [docs/known-issues.md](docs/known-issues.md).

---

## Table of contents

- [About the project](#about-the-project)
- [Features by role](#features-by-role)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Repository structure](#repository-structure)
- [Quick start](#quick-start)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Project status](#project-status)
- [Developers](#developers)
- [License](#license)

---

## About the project

SAGA replaces spreadsheets and paper records with a single web system shared by the school office,
teachers and students. Each profile signs in and lands on its own area of the site, with the
screens and actions that belong to that role.

It is split into three parts:

| Part         | What it is                                                      | Runs at                 |
| ------------ | --------------------------------------------------------------- | ----------------------- |
| `Front-End/` | Static pages (HTML, CSS, vanilla JavaScript), one area per role | `http://127.0.0.1:5500` |
| `Back-end/`  | REST API in Node.js + Express + Prisma                          | `http://localhost:8081` |
| Database     | PostgreSQL 16 in a Docker container                             | `localhost:5432`        |

How the pieces talk to each other is described in [docs/architecture.md](docs/architecture.md).

---

## Features by role

| Role                             | What they can do                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **School office** (`secretaria`) | Register, edit and remove courses, subjects, classes and users (students, teachers, office staff); link teachers to classes; move students between classes |
| **Teacher** (`professor`)        | See their classes and subjects; take roll call per class and date; post grades per subject, assessment type and term (_bimestre_)                          |
| **Student** (`aluno`)            | See the subjects of their course, grades by module and daily attendance                                                                                    |

Every role signs in with email and password (or Google) and can view its own profile.

> ⚠️ The student report card by term is currently broken — see
> [docs/known-issues.md](docs/known-issues.md).

---

## Screenshots

### Roll call (teacher)

<img src="Front-End/Img/chamada_img.PNG" alt="Teacher roll call screen" />

---

## Tech stack

**Backend**

- [Node.js 22 LTS](https://nodejs.org) with ES modules
- [Express 4](https://expressjs.com) — HTTP server and routing
- [Prisma 6](https://www.prisma.io) — ORM and migrations
- [PostgreSQL 16](https://www.postgresql.org) on [Docker Compose](https://docs.docker.com/compose/)
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) + [bcryptjs](https://www.npmjs.com/package/bcryptjs)
  — authentication
- [google-auth-library](https://www.npmjs.com/package/google-auth-library) — "Sign in with Google"

**Frontend**

- HTML5, CSS3 and vanilla JavaScript (ES6+), no build step
- Bootstrap 4.5 (login page), Chart.js and FullCalendar (student attendance pages), loaded from CDNs

**Tooling**

- ESLint 10 and Prettier 3, configured at the repository root
- GitHub Actions running lint and format checks on `main` and `develop`

---

## Repository structure

```text
SAGA/
├── Back-end/              # REST API — see Back-end/README.md
│   ├── server.js          # entry point: CORS, JSON parsing, routers
│   ├── src/Routes/        # routers: geral, aluno, prof, sec
│   ├── src/controller/    # request handlers (call Prisma directly)
│   ├── src/middlewares/   # JWT authentication
│   ├── prisma/            # schema.prisma + migrations
│   ├── tests/             # manual requests (.http files)
│   └── docker-compose.yml # PostgreSQL 16 container
├── Front-End/             # static pages — see Front-End/README.md
│   ├── Login/ Aluno/ Professor/ Secretaria/
│   └── Js/ "Css Base"/ Img/
├── docs/                  # documentation (EN-US); every PT-BR translation is in docs/pt-BR/
├── .github/               # CI workflows and pull request template
├── CLAUDE.md              # guide for AI coding agents
├── CONTRIBUTING.md        # branches, commits and pull requests
└── eslint.config.js, .prettierrc, package.json   # lint and format tooling
```

---

## Quick start

For those who already have **Node.js 22** and **Docker** installed. Setting up a machine from scratch
(macOS, Linux Mint or Windows)? Follow **[docs/local-environment.md](docs/local-environment.md)**.

### 1. API and database

```bash
git clone https://github.com/ftfariasdev/SAGA.git
cd SAGA/Back-end
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Generate a secret and paste it into `JWT_SECRET` in `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
docker compose up -d        # starts PostgreSQL 16 in a container
npx prisma migrate dev      # creates the tables
npm run dev                 # API on http://localhost:8081
```

Check it: `curl http://localhost:8081/health` should return `{"status":"UP",...}`.

> ⚠️ Keep `PORT=8081` in `.env`: the front-end scripts call `http://localhost:8081` directly.

### 2. First user

The database starts empty and every screen requires login. Create the first school office account
through the only public route, meant for this bootstrap:

```bash
curl -X POST http://localhost:8081/sec/cadSecretaria \
  -H "Content-Type: application/json" \
  -d '{"nome":"Secretaria Teste","email":"secretaria@saga.local","senha":"senha123","dt_nasc":"2000-01-15T00:00:00.000Z","telefone":"11999990000","cpf":"00000000191","ft_perfil":""}'
```

Then sign in with `secretaria@saga.local` / `senha123`.

### 3. Front-end

Open the `Front-End` folder in VS Code and start `index.html` with the
[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension.

> ⚠️ The front-end must be served at exactly `http://127.0.0.1:5500` — it is the only origin allowed
> by the backend's CORS configuration. Opening the file directly (`file://`) does not work.

### 4. Lint and format (repository root)

```bash
npm install
npm run lint
npm run format:check
```

---

## Documentation

Every document exists in English (US) and in Brazilian Portuguese. English files live next to what
they describe; **all Portuguese translations are in [docs/pt-BR/](docs/pt-BR/README.md)**, with the
same file names.

### Where to start

| You are…                  | Read, in this order                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| New to the project        | This README → [Local environment](docs/local-environment.md) → [Architecture](docs/architecture.md) → [Glossary](docs/glossary.md) → [Known issues](docs/known-issues.md) |
| Working on the backend    | [Architecture](docs/architecture.md) → [API reference](docs/api-reference.md) → [Database](docs/database.md) → [Back-end README](Back-end/README.md)                      |
| Working on the front-end  | [Front-End README](Front-End/README.md) → [API reference](docs/api-reference.md) → [Architecture](docs/architecture.md) (authentication flow)                             |
| Opening or reviewing a PR | [Contributing](CONTRIBUTING.md) → [pull request template](.github/pull_request_template.md)                                                                               |
| An AI coding agent        | [CLAUDE.md](CLAUDE.md)                                                                                                                                                    |

### All documents

| Document                                                  | What you'll find                                                  | PT-BR                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| [Local environment](docs/local-environment.md)            | Installing Docker and running everything locally, troubleshooting | [Ambiente local](docs/pt-BR/local-environment.md)  |
| [Architecture](docs/architecture.md)                      | How front-end, API and database fit together; authentication flow | [Arquitetura](docs/pt-BR/architecture.md)          |
| [API reference](docs/api-reference.md)                    | Every HTTP route, its inputs and which screen uses it             | [Referência da API](docs/pt-BR/api-reference.md)   |
| [Database](docs/database.md)                              | Data model, ER diagram and migration history                      | [Banco de dados](docs/pt-BR/database.md)           |
| [Glossary](docs/glossary.md)                              | The Portuguese domain terms used in the code, explained           | [Glossário](docs/pt-BR/glossary.md)                |
| [Known issues](docs/known-issues.md)                      | Known defects and technical debt, linked to the backlog           | [Problemas conhecidos](docs/pt-BR/known-issues.md) |
| [Back-end README](Back-end/README.md)                     | API structure, scripts and environment variables                  | [README do Back-end](docs/pt-BR/back-end.md)       |
| [Front-End README](Front-End/README.md)                   | Page map, shared scripts and session storage                      | [README do Front-End](docs/pt-BR/front-end.md)     |
| [Contributing](CONTRIBUTING.md)                           | Branches, Conventional Commits and pull requests                  | [Como contribuir](docs/pt-BR/CONTRIBUTING.md)      |
| [Pull request template](.github/pull_request_template.md) | Pre-filled PR description and checklist                           | — (a single bilingual file)                        |
| [CLAUDE.md](CLAUDE.md)                                    | Rules and map of the codebase for AI coding agents                | [Guia para agentes de IA](docs/pt-BR/ai-agents.md) |

How documentation is organized and named: [CONTRIBUTING.md § 6](CONTRIBUTING.md#6-documentation-rules).

---

## Contributing

Contributions follow the standard in **[CONTRIBUTING.md](CONTRIBUTING.md)**:

1. Pick an issue from the [backlog](https://github.com/ftfariasdev/SAGA/issues).
2. Start a [Git Flow](CONTRIBUTING.md#1-branching-model--git-flow) branch from `develop` — e.g.
   `git flow bugfix start boletim-aluno`, which creates `bugfix/boletim-aluno`.
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/) — e.g.
   `fix(notas): corrige boletim do aluno`.
4. Publish the branch and open a pull request to `develop` — one PR per task. Don't `finish` the
   branch locally: it merges without review or CI.

---

## Project status

The refactoring backlog is organized by ID prefix. Each issue describes the problem, the target
state, how to test it and its dependencies.

| Prefix | Focus                                                                                                    | Issues    |
| ------ | -------------------------------------------------------------------------------------------------------- | --------- |
| `C`    | Urgent security fixes (public office sign-up, secrets committed to the repository)                       | #1, #2    |
| `F`    | Foundation: error handling, configuration, Prisma, validation, logging, cleanup, tooling                 | #3 – #12  |
| `P`    | Pagination, sorting and filtering                                                                        | #13       |
| `S`    | Security: JWT hardening, role authorization, headers and rate limiting, IDOR, Google sign-up             | #14 – #18 |
| `M`    | New database schema core and migration                                                                   | #19 – #21 |
| `D`    | Backend migration domain by domain (auth, courses, subjects, classes, users, roll call, grades, results) | #22 – #30 |
| `T`    | Automated tests                                                                                          | #31 – #33 |
| `DOC`  | OpenAPI documentation                                                                                    | #34       |
| `CI`   | Continuous integration and contribution standard                                                         | #35, #36  |
| `FE`   | Front-end: central HTTP client and screen updates                                                        | #37 – #42 |

---

## Developers

Developed by [Felipe Farias](https://github.com/Felipe-dev01), Brenno Mello, Jéssica Oliveira and
Hugo Rocha.

---

## License

The previous version of this README declared the MIT license, but the repository has no `LICENSE`
file yet and `Back-end/package.json` declares ISC. Until the team adds a `LICENSE` file, the terms
are undefined — see [docs/known-issues.md](docs/known-issues.md).
