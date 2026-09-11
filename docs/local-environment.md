# 🐳 SAGA local environment — from zero to a running API

🌐 **English** | [Português (Brasil)](pt-BR/local-environment.md)

This guide takes anyone on the team from a clean machine to the system running
**100% locally**, with no dependency on Supabase or an internet connection.

The database runs in a **Docker container with PostgreSQL 16**. This guarantees
that everyone — macOS, Linux Mint and Windows — uses exactly the same Postgres
version, with the same user, the same password and the same schema.

**Estimated time:** 20–30 min the first time (mostly downloads).

---

## 📑 Table of contents

1. [Overview](#1-overview)
2. [Common prerequisites](#2-common-prerequisites)
3. [Installing Docker](#3-installing-docker)
   - [🍎 macOS](#-macos)
   - [🐧 Linux Mint](#-linux-mint)
   - [🪟 Windows](#-windows-10-and-11)
4. [Setting up the project](#4-setting-up-the-project)
5. [Starting the database](#5-starting-the-database)
6. [Creating the tables with Prisma](#6-creating-the-tables-with-prisma)
7. [Creating the first user](#7-creating-the-first-user)
8. [Running the API and the front-end](#8-running-the-api-and-the-front-end)
9. [Day-to-day commands](#9-day-to-day-commands)
   - [Quality tooling (lint and format)](#quality-tooling-lint-and-format)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Overview

```
┌──────────────────┐      ┌──────────────────┐      ┌────────────────────────┐
│    Front-End     │ HTTP │       API        │ SQL  │  PostgreSQL container  │
│  (Live Server)   │─────▶│  Node + Express  │─────▶│      saga-db :5432     │
│  127.0.0.1:5500  │      │  localhost:8081  │      │   (volume saga-pgdata) │
└──────────────────┘      └──────────────────┘      └────────────────────────┘
                                 Prisma ORM
```

What you will install:

| Tool                 | What for                    | Where    |
| -------------------- | --------------------------- | -------- |
| **Git**              | Clone the repository        | Everyone |
| **Node.js 22 LTS**   | Run the API                 | Everyone |
| **Docker + Compose** | Run Postgres in a container | Everyone |

> ℹ️ **You don't need to install PostgreSQL on your machine.** It ships inside
> the container. If you already have Postgres installed, see
> [section 10](#port-5432-is-already-in-use).

---

## 2. Common prerequisites

### Git

| System     | Command                                                        |
| ---------- | -------------------------------------------------------------- |
| macOS      | `brew install git` (or it comes with Xcode Command Line Tools) |
| Linux Mint | `sudo apt install git`                                         |
| Windows    | Download from [git-scm.com](https://git-scm.com/download/win)  |

### Node.js 22 LTS

| System     | Command                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------- |
| macOS      | `brew install node@22`                                                                             |
| Linux Mint | `curl -fsSL https://deb.nodesource.com/setup_22.x \| sudo -E bash - && sudo apt install -y nodejs` |
| Windows    | Download the LTS installer from [nodejs.org](https://nodejs.org)                                   |

Check at the end:

```bash
git --version
node -v     # should print v22.x
npm -v
```

---

## 3. Installing Docker

Pick the section for your operating system. **Once installed, the rest of the
guide is identical for everyone** — the `docker compose` commands are the same
on all three systems.

---

### 🍎 macOS

There are two paths, and which one you take depends on your macOS version. Find
out with:

```bash
sw_vers -productVersion
```

#### macOS 14 (Sonoma) or newer → OrbStack

[OrbStack](https://orbstack.dev) is much lighter and faster than Docker Desktop
on the Mac, and uses exactly the same commands.

```bash
brew install --cask orbstack
```

Open **OrbStack** from Launchpad once. It will ask for your administrator
password to install its networking component — this is normal and only happens
on the first run. Let it start with the system so you don't have to open it
every time.

#### macOS 13 (Ventura) or older → Colima

OrbStack and Docker Desktop **require macOS 14+**. On Ventura, use
[Colima](https://colima.run): same CLI, no graphical interface.

```bash
brew install colima docker docker-compose
```

> ⏳ **This takes a while on Intel Macs.** There is no prebuilt `lima` package
> (Colima's foundation) for macOS 13 on Intel, so Homebrew compiles it from
> source — 10 to 30 minutes. It's normal for the terminal to look stuck; let it
> run. On Apple Silicon Macs it's a direct download and takes ~2 min.

Start the virtual machine that runs the containers (~1 min the first time):

```bash
colima start --cpu 2 --memory 4
```

> ⚠️ **Important:** Colima does not start on its own when you turn on the
> computer. Every time you restart the Mac, run `colima start` before working.
> To make it automatic: `brew services start colima`.

When installed through Homebrew, Compose **is not found automatically** by
Docker — you'll see `docker: unknown command: docker compose`. That's expected,
and it's fixed by pointing Docker at Homebrew's plugin folder.

If `~/.docker/config.json` **does not exist yet**:

```bash
mkdir -p ~/.docker
echo "{\"cliPluginsExtraDirs\":[\"$(brew --prefix)/lib/docker/cli-plugins\"]}" > ~/.docker/config.json
```

If it **already exists** (don't overwrite it — you'd lose settings you already
have, such as credentials and contexts), add the key to the JSON with an editor:

```json
{
  "cliPluginsExtraDirs": ["/usr/local/lib/docker/cli-plugins"]
}
```

> 💡 Use `/opt/homebrew/lib/docker/cli-plugins` on Apple Silicon Macs and
> `/usr/local/lib/docker/cli-plugins` on Intel Macs. If in doubt, run
> `brew --prefix` to find out which one is yours.

Check with `docker compose version`.

#### Checking

```bash
docker run --rm hello-world
```

If you see _"Hello from Docker!"_, you're ready.

---

### 🐧 Linux Mint

Don't use `docker.io` from the Mint repository — it's usually outdated and comes
without the `compose` v2 plugin. Install from Docker's official repository.

#### 1. Remove old versions (if any)

```bash
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

#### 2. Add the official repository

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$UBUNTU_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
```

> 💡 `$UBUNTU_CODENAME` is essential on Mint. Mint has its own codenames
> (`vanessa`, `xia`…) and Docker doesn't publish packages under those names —
> this variable translates to the matching Ubuntu codename (`jammy`, `noble`…).
> If the command above returns empty, run `cat /etc/os-release` and use the
> `UBUNTU_CODENAME` value manually.

#### 3. Install

```bash
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

#### 4. Run Docker without `sudo`

```bash
sudo groupadd -f docker
sudo usermod -aG docker $USER
```

> ⚠️ **Log out and log back in** (or reboot) for the group to take effect.
> Without it you'll get `permission denied` on every `docker` command.

#### Checking

```bash
docker run --rm hello-world
docker compose version
```

---

### 🪟 Windows 10 and 11

Docker Desktop on Windows runs on top of **WSL2** (the Windows Subsystem for
Linux). You need both.

#### 1. Install WSL2

Open **PowerShell as administrator** (right-click the Start menu →
_Terminal (Admin)_) and run:

```powershell
wsl --install
```

**Restart the computer.** When it comes back, an Ubuntu window will open asking
for a username and password — create them (they're only for the internal Linux
and can differ from your Windows ones).

Check:

```powershell
wsl -l -v
```

The `VERSION` column must show **2**. If it shows 1, run
`wsl --set-version Ubuntu 2`.

#### 2. Install Docker Desktop

Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
and install it keeping **"Use WSL 2 instead of Hyper-V"** checked.

Open Docker Desktop and wait for the whale icon in the bottom-left corner to
turn **green** (_Engine running_). In _Settings → General_, make sure
**"Start Docker Desktop when you sign in"** is on.

> ⚠️ Docker Desktop must be **open** for the commands to work. If you get
> `error during connect`, that's almost always the reason.

#### Checking

In PowerShell (no admin needed):

```powershell
docker run --rm hello-world
docker compose version
```

---

## 4. Setting up the project

From here on the commands are the same on all three systems.

### 1. Clone the repository

```bash
git clone https://github.com/ftfariasdev/SAGA.git
cd SAGA/Back-end
```

### 2. Install the API dependencies

```bash
npm install
```

### 3. Create the `.env` file

The repository ships a ready-made template at `Back-end/.env.example`:

```bash
cp .env.example .env      # macOS and Linux
```

```powershell
copy .env.example .env    # Windows
```

Open `.env` and generate a `JWT_SECRET` of your own:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste the result on the `JWT_SECRET=` line. The database values (`saga`/`saga`)
are ready to use and don't need to change — they're local development
credentials, and the database isn't exposed outside your machine.

> ⚠️ **Keep `PORT=8081`.** The front-end calls `http://localhost:8081`, hardcoded
> in every script. With any other port the API starts, but the pages can't reach
> it.

> 🔒 `.env` is in `.gitignore` and must **never** be committed. `.env.example` is
> what goes into Git — if you add a new variable, register it there too (without
> the secret value).

---

## 5. Starting the database

Still inside `SAGA/Back-end`:

```bash
docker compose up -d
```

The first time it downloads the Postgres image (~80 MB). `-d` keeps it running
in the background.

Check that it really started:

```bash
docker compose ps
```

You should see `saga-db` with status **`Up (healthy)`**. If it shows
`Up (health: starting)`, wait about 10 seconds and run it again — Compose runs
an automatic connection test before considering the database ready.

---

## 6. Creating the tables with Prisma

The database started empty. The tables are created by the _migrations_ already
versioned in `Back-end/prisma/migrations/`:

```bash
npx prisma generate       # generates the typed Prisma client
npx prisma migrate dev    # creates every table in the local database
```

To confirm it worked, open the database's visual interface:

```bash
npx prisma studio
```

It opens at `http://localhost:5555` and lists the tables (`user`, `aluno`,
`professor`, `turma`, `nota`…). Use it to inspect and check data — the first
user is created through the API in the [next section](#7-creating-the-first-user),
because the password must be stored hashed.

> 💡 **`migrate dev` vs `migrate deploy`:** use `migrate dev` day to day — it
> applies whatever is missing and warns you if you changed `schema.prisma`.
> `migrate deploy` only applies existing migrations, without creating new ones.

---

## 7. Creating the first user

The new database is **empty** — no user exists yet. Since every page requires
login, and creating users requires being logged in, you need to create the first
**secretaria** (school office user) directly through the API.

The `POST /sec/cadSecretaria` route is the only one that doesn't require
authentication, precisely to solve this. With the API running (`npm run dev`),
in another terminal:

```bash
curl -X POST http://localhost:8081/sec/cadSecretaria \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Secretaria Teste",
    "email": "secretaria@saga.local",
    "senha": "senha123",
    "dt_nasc": "2000-01-15T00:00:00.000Z",
    "telefone": "11999990000",
    "cpf": "00000000191",
    "ft_perfil": ""
  }'
```

On Windows, use PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:8081/sec/cadSecretaria -Method Post `
  -ContentType "application/json" `
  -Body '{"nome":"Secretaria Teste","email":"secretaria@saga.local","senha":"senha123","dt_nasc":"2000-01-15T00:00:00.000Z","telefone":"11999990000","cpf":"00000000191","ft_perfil":""}'
```

Expected response: `{"message":"Cadastro de secretaria concluído com sucesso"}`.

Done — now log in to the front-end with `secretaria@saga.local` / `senha123` and
create students, teachers, courses and classes through the interface.

> ℹ️ `telefone` and `cpf` are unique in the database. If you create a second test
> user, change those two values or you'll get a duplicate error.

> ⚠️ **Local environment only.** This route is open without authentication,
> meaning anyone could create a secretaria account. On your machine that's not a
> problem, but it **must be addressed before the system is published anywhere**.

> 🔜 Closing this public route is planned in
> [[C1] #1](https://github.com/ftfariasdev/SAGA/issues/1). Once that task ships,
> this bootstrap step will change — check the issue before following it.

---

## 8. Running the API and the front-end

### API

```bash
npm run dev
```

You should see `Servidor rodando na porta 8081!`. Test it from another terminal:

```bash
curl http://localhost:8081/health
# {"status":"UP","timestamp":"2026-09-10T13:00:00.000Z","version":"1.0.0"}
```

### Front-end

The front-end is plain HTML/CSS/JS and must be served at
`http://127.0.0.1:5500` — that address is hardcoded in the CORS configuration in
`Back-end/server.js`.

In **VS Code**, install the **Live Server** extension, open the `Front-End`
folder, right-click `index.html` → **Open with Live Server**.

> ⚠️ Double-clicking `index.html` (`file://`) **does not work** — the browser
> blocks calls to the API because of CORS. `http://localhost:5500` doesn't work
> either: CORS accepts exactly `127.0.0.1`.

---

## 9. Day-to-day commands

All run from inside `SAGA/Back-end`:

| What                                  | Command                                       |
| ------------------------------------- | --------------------------------------------- |
| Start the database                    | `docker compose up -d`                        |
| Stop the database (keeps the data)    | `docker compose stop`                         |
| Remove the container (keeps the data) | `docker compose down`                         |
| **Delete everything, including data** | `docker compose down -v`                      |
| Check whether it's running            | `docker compose ps`                           |
| Follow the Postgres logs              | `docker compose logs -f db`                   |
| Open `psql` inside the container      | `docker compose exec db psql -U saga -d saga` |
| Visual database interface             | `npx prisma studio`                           |
| Apply new migrations                  | `npx prisma migrate dev`                      |
| Wipe the database and recreate it     | `npx prisma migrate reset`                    |
| Run the API                           | `npm run dev`                                 |

**Normal work routine:** `docker compose up -d` → `npm run dev`. That's it.

On **macOS with Colima**, remember to run `colima start` first, after every
computer restart.

### Quality tooling (lint and format)

ESLint and Prettier live at the **repository root** (the `SAGA/` folder), not in
`Back-end`. Install them once:

```bash
cd ..          # from SAGA/Back-end to SAGA/
npm install
```

| What                            | Command                |
| ------------------------------- | ---------------------- |
| Look for code errors            | `npm run lint`         |
| Auto-fix what can be fixed      | `npm run lint:fix`     |
| Check formatting (JS, JSON, MD) | `npm run format:check` |
| Format                          | `npm run format`       |

The same checks run on GitHub Actions for every push and pull request to `main`
and `develop` — run them before opening a PR.

> 🪟 **Windows:** with `core.autocrlf=true` (Git for Windows' default), files
> arrive on your machine with CRLF line endings and `format:check` flags files
> that are actually fine. To confirm the only difference is line endings, run
> `npx prettier --check --end-of-line auto .`. CI runs on Linux and is the source
> of truth. Prefer formatting only the files you changed
> (`npx prettier --write path/to/file`).

---

## 10. Troubleshooting

### Port 5432 is already in use

Error: `Bind for 0.0.0.0:5432 failed: port is already allocated`.

It means you already have PostgreSQL installed on the machine. Instead of
uninstalling it, change the container's port. In `.env`:

```env
POSTGRES_PORT=5433
DATABASE_URL="postgresql://saga:saga@localhost:5433/saga?schema=public"
```

Then: `docker compose up -d`.

### The Colima VM won't start (Intel Mac)

Colima warns that `vmType vz` requires macOS 15.5+ on Intel Macs. In practice it
usually works anyway (it did on macOS 13.7 while this environment was being set
up), but if the VM hangs on startup, recreate it with the older driver:

```bash
colima delete
colima start --vm-type qemu --cpu 2 --memory 4
```

### `Cannot connect to the Docker daemon`

Docker isn't running.

- **macOS + Colima:** `colima start`
- **macOS + OrbStack:** open the OrbStack app
- **Windows:** open Docker Desktop and wait for the icon to turn green
- **Linux:** `sudo systemctl start docker`

### `permission denied` from Docker (Linux)

You're not in the `docker` group, or you joined it but didn't log in again:

```bash
sudo usermod -aG docker $USER
```

Then **log out and log back in**. To test without logging out:
`newgrp docker`.

### `Can't reach database server at localhost:5432` (Prisma)

In this order:

1. `docker compose ps` — is `saga-db` `Up (healthy)`?
2. If it's `health: starting`, wait 10s.
3. Check that the port and credentials in `DATABASE_URL` match the `POSTGRES_*`
   variables in the same `.env`.
4. `docker compose logs db` to see what Postgres complained about.

### The front-end says it can't connect to the server

In this order:

1. Is the API running? `curl http://localhost:8081/health` must answer.
2. Does `.env` have `PORT=8081`? The front-end doesn't know any other port.
3. Is the front-end open at `http://127.0.0.1:5500` (not `localhost:5500` or
   `file://`)? The browser console (F12) shows a CORS error when it isn't.

### Migrations are out of sync

If Prisma reports _drift_ or pending migrations and you **don't mind losing your
local data** (which is test data anyway):

```bash
npx prisma migrate reset
```

This wipes everything, reapplies all migrations from scratch and leaves the
database clean.

### I want to start from absolute zero

```bash
docker compose down -v    # deletes the container AND the data volume
docker compose up -d
npx prisma migrate dev
```

### Windows: `npm run dev` can't find `node`

Close and reopen PowerShell after installing Node — `PATH` is only updated in
new terminals.

---

## 📎 Related files

| File                            | What it is                                              |
| ------------------------------- | ------------------------------------------------------- |
| `Back-end/docker-compose.yml`   | Postgres container definition                           |
| `Back-end/.env.example`         | Environment variable template (goes into Git)           |
| `Back-end/.env`                 | Your real variables (does **not** go into Git)          |
| `Back-end/prisma/schema.prisma` | Table model                                             |
| `Back-end/prisma/migrations/`   | Versioned schema history                                |
| `package.json` (root)           | `lint`, `lint:fix`, `format` and `format:check` scripts |
| `eslint.config.js` (root)       | ESLint rules for back-end and front-end                 |
| `.prettierrc` (root)            | Prettier formatting rules                               |
| `.github/workflows/`            | Lint and format checks on GitHub Actions                |

Next steps: [Back-end README](../Back-end/README.md) ·
[Front-End README](../Front-End/README.md) ·
[How to contribute](../CONTRIBUTING.md)
