# 🎨 SAGA — Front-End

🌐 **English** | [Português (Brasil)](../docs/pt-BR/front-end.md)

The SAGA front-end is a **static multi-page application** written in plain
HTML, CSS and JavaScript (ES6+). There is **no build step, no bundler and no
`package.json`** in this folder: every page is an `.html` file that loads its
scripts with `<script src>` and talks to the API at `http://localhost:8081`.

---

## 🧾 Contents

- [Running](#-running)
- [Folder structure](#-folder-structure)
- [Shared scripts](#-shared-scripts)
- [Session data in localStorage](#-session-data-in-localstorage)
- [Login and redirect by user type](#-login-and-redirect-by-user-type)
- [Page map](#-page-map)
- [Conventions and caveats](#-conventions-and-caveats)
- [Further reading](#-further-reading)

---

## 🚀 Running

1. Start the API first ([Back-end README](../Back-end/README.md)). It must be
   listening on **`http://localhost:8081`** — that address is hardcoded in every
   script.
2. In **VS Code**, install the **Live Server** extension, open the `Front-End`
   folder, right-click `index.html` → **Open with Live Server**.
3. The page must be served at **`http://127.0.0.1:5500`**. The API's CORS allows
   exactly that origin, so `http://localhost:5500` and `file://` (double-click)
   both fail.

`index.html` shows a welcome screen and redirects to `Login/Login.html` after
2 seconds.

---

## 📁 Folder structure

```
Front-End/
├── index.html           # Welcome screen → redirects to Login/Login.html
├── Login/               # Login.html, RecSenha.html, ConfirRecSenha.html + Css/ and Js/login.js
├── Aluno/               # Student area
│   ├── Page/            #   HTML pages
│   ├── Js/              #   one script per page (mostly)
│   └── Css/             #   page styles
├── Professor/           # Teacher area — same Page/ Js/ Css/ layout
├── Secretaria/          # School office area — Page/ Js/ css/ (lowercase "css")
├── Js/                  # Shared scripts: verificaToken.js, menu.js, mascaras.js
├── Css Base/            # Shared styles: base, home, modal, tabela, botoesTabela, barraPesquisa
└── Img/                 # Images (login and roll-call screenshots)
```

---

## 🧩 Shared scripts

| File                  | What it does                                                                                                                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Js/verificaToken.js` | On `DOMContentLoaded`, calls `GET /token` with the stored JWT. No token or a `401` → removes the token, shows a modal and redirects to the login page. Also defines `mostrarModal(message)`, the shared modal.                |
| `Js/menu.js`          | Header profile dropdown: fills name, e-mail and photo from `localStorage`, refreshes them with `GET /info/:userId`, and the **Sair** (log out) button runs `localStorage.clear()` and goes back to login.                     |
| `Js/mascaras.js`      | Input masks for CPF (`000.000.000-00`) and phone (`XX XXXXX-XXXX`) on `#cpf`/`input[name="cpf"]` and `#telefone`/`input[name="telefone"]`. Exposes `window.aplicarMascarasAposDados()` to re-apply them after data is loaded. |

---

## 💾 Session data in localStorage

There are no cookies or server sessions: everything the pages share lives in
`localStorage`.

| Key                                                                     | Set by                                                           | Read by                                                                                                                                       | Content                                                                                                                                                            |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `token`                                                                 | `login.js`                                                       | Almost every script; `verificaToken.js` removes it on `401`                                                                                   | JWT sent as `Authorization: Bearer <token>`                                                                                                                        |
| `tipo`                                                                  | `login.js`                                                       | No script currently reads it                                                                                                                  | User type code (see next section)                                                                                                                                  |
| `userId`                                                                | `login.js`; `verificaToken.js` (copied from `id_user`)           | `menu.js`, `homeAlu.js`, `infoAluno.js`, `homeProf.js`, `infoProf.js`, `Chamada.js`, `chamada2.js`, `lancamento.js`, `turma.js`, `infoSec.js` | The user's `id_user`                                                                                                                                               |
| `id_user`                                                               | No current script (legacy name)                                  | `verificaToken.js` (aliases it to `userId`), `Secretaria/Js/editarInfo.js`                                                                    | Legacy alias of `userId`                                                                                                                                           |
| `nomeUsuario`                                                           | `login.js`, `menu.js`, `homeAlu.js`, `homeProf.js`               | `menu.js`, `homeAlu.js`, `homeProf.js`                                                                                                        | Full name                                                                                                                                                          |
| `emailUsuario`                                                          | `login.js`, `menu.js`, `homeAlu.js`, `homeProf.js`               | `menu.js`, `homeAlu.js`, `homeProf.js`                                                                                                        | E-mail — after a password login `login.js` reads `data.email`, but `/login` returns `emailDoBanco`, so it's only filled once `menu.js` or a home page refreshes it |
| `fotoPerfil`                                                            | `login.js`, `menu.js`, `homeAlu.js`, `homeProf.js`, `infoSec.js` | `menu.js`, `homeAlu.js`, `homeProf.js`, `infoSec.js`                                                                                          | Profile photo (URL or data URI)                                                                                                                                    |
| `professorId`                                                           | `Professor/Js/turma.js`                                          | `Professor/Js/turma.js`                                                                                                                       | Cached `id_professor`                                                                                                                                              |
| `selectedTurmaId`, `selectedCursoNome`                                  | `Professor/Js/turma.js`                                          | No `.js` file reads them                                                                                                                      | Class selected on the Turma page                                                                                                                                   |
| `id_turma_selecionada`, `id_materia_selecionada`, `selectedMateriaNome` | `Professor/Js/Chamada.js`                                        | `Professor/Js/chamada2.js`                                                                                                                    | Class and subject chosen for the roll call                                                                                                                         |
| `selectedTurmaNome`                                                     | `Professor/Js/Chamada.js`, `Professor/Js/turma.js`               | `Professor/Js/chamada2.js`                                                                                                                    | Name of the selected class                                                                                                                                         |

---

## 🔑 Login and redirect by user type

`Login/Js/login.js` posts to `POST /login` (or `POST /login/google`), stores the
session keys above and redirects according to `tipo`:

| `tipo` | User type                                   | Redirects to                                                                                      |
| ------ | ------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `1`    | Secretaria                                  | `Secretaria/Page/HomeSecretaria.html`                                                             |
| `2`    | Professor                                   | `Professor/Page/HomeProfessor.html`                                                               |
| `3`    | Aluno                                       | `Aluno/Page/HomeAluno.html`                                                                       |
| other  | e.g. `0`, created by the first Google login | Password login: error "Tipo de usuário não reconhecido". Google login: back to `Login/Login.html` |

> ⚠️ The files are actually named `HomeProfessor.Html` and `HomeAluno.Html`
> (capital **H** in the extension). The redirect works on Windows and macOS,
> whose file systems ignore case, but **breaks on a case-sensitive server such as
> Linux**.

---

## 🧭 Page map

"Scripts" lists the local scripts each page loads, in order. Endpoints are
relative to `http://localhost:8081`. Details of every route are in
[docs/api-reference.md](../docs/api-reference.md).

### Login

| Page                  | Scripts                                                                                     | API endpoints                                      |
| --------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `Login.html`          | CDN: jQuery 3.5.1, Popper 1.16.1, Bootstrap 4.5.2, Google Identity Services · `Js/login.js` | `GET /health`, `POST /login`, `POST /login/google` |
| `RecSenha.html`       | `Js/script.js` — **file doesn't exist**                                                     | — (password recovery not implemented)              |
| `ConfirRecSenha.html` | `Js/script.js` — **file doesn't exist**                                                     | — (password recovery not implemented)              |

### Aluno (student)

| Page             | Scripts                                                                                                        | API endpoints                                                                                                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HomeAluno.Html` | `homeAlu.js`, `verificaToken.js`                                                                               | `GET /info/:userId`                                                                                                                                                                                        |
| `Curso.html`     | `verificaToken.js`, `menu.js`, `curso.js`                                                                      | `GET /aluno/listMateria`                                                                                                                                                                                   |
| `boletim.html`   | `verificaToken.js`, `menu.js`, `boletim.js`                                                                    | `GET /aluno/bimestre/:bimestre` — the controller method doesn't exist, so the report card never loads ([known issues](../docs/known-issues.md))                                                            |
| `Freq1.html`     | CDN: Chart.js, chartjs-plugin-datalabels 2.2.0, FullCalendar 6.1.8 · `verificaToken.js`, `menu.js`, `freq1.js` | None that work: the pie chart is a fixed 50/50 placeholder and the `fetch('/aluno/listMateria')` is relative, so it hits Live Server instead of the API. Clicking a day opens `freq2.html?data=YYYY-MM-DD` |
| `Freq2.html`     | CDN: FullCalendar 6.1.8 · `verificaToken.js`, `freq2.js`                                                       | `GET /aluno/presencas-dia?data=YYYY-MM-DD`                                                                                                                                                                 |
| `info.html`      | `verificaToken.js`, `infoAluno.js`, `menu.js`, `mascaras.js`, `curso.js`                                       | `GET /info/:id_user`, `GET /aluno/listMateria` (via `curso.js`)                                                                                                                                            |
| `Ajuda.html`     | `verificaToken.js`, `menu.js`, `curso.js`                                                                      | `GET /aluno/listMateria` (via `curso.js`)                                                                                                                                                                  |

Unused scripts in `Aluno/Js/`: `dia.js` (shows the `dia` and `status` query-string
values; no page loads it) and `script.js` (empty).

### Professor (teacher)

| Page                 | Scripts                                                                 | API endpoints                                                                                                                                                      |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HomeProfessor.Html` | `homeProf.js`, `verificaToken.js`                                       | `GET /info/:userId`                                                                                                                                                |
| `Turma.html`         | `verificaToken.js`, `menu.js`, `turma.js`                               | `GET /professor/user/:id_user`, `GET /prof/turmas/:id_professor`                                                                                                   |
| `Chamada.html`       | `verificaToken.js`, `menu.js`, `Chamada.js`                             | `GET /professor/user/:id_user`, `GET /prof/turmas/:id_professor`, `GET /prof/materias/:id_professor` — saves the selection read by `Chamada2`                      |
| `Chamada2.html`      | `verificaToken.js`, `menu.js`, `chamada2.js`                            | `GET /professor/user/:id_user`, `GET /prof/alunos/:id_turma`, `GET /prof/chamada/:id_turma/data?data=`, `POST /prof/chamada`                                       |
| `Lancamento.html`    | `verificaToken.js`, `menu.js`, `lancamento.js`                          | `GET /professor/user/:id_user`, `GET /prof/turmas/:id_professor`, `GET /prof/materias/:id_professor`, `GET /prof/alunos-turma/:id_turma`, `POST /prof/lancarNotas` |
| `info.html`          | `verificaToken.js`, `menu.js`, `mascaras.js`, `curso.js`, `infoProf.js` | `GET /info/:id_user` (`curso.js` only renders a hardcoded sample table)                                                                                            |
| `Ajuda.html`         | `verificaToken.js`, `menu.js`                                           | —                                                                                                                                                                  |

Unused or placeholder scripts in `Professor/Js/`: `boletim.js` (hardcoded sample
report card; no page loads it), `curso.js` (hardcoded sample course table) and
`script.js` (empty).

### Secretaria (school office)

| Page                   | Scripts                                                                                                                                  | API endpoints                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HomeSecretaria.html`  | `menu.js`, `verificaToken.js`                                                                                                            | — (only `menu.js` → `GET /info/:userId`)                                                                                                                                                                                                                                                                                                                                          |
| `Cadastro.html`        | `menu.js`, `cadastro.js`, `mascaras.js` ⚠️ no `verificaToken.js`                                                                         | `GET /sec/Turma/listar`, `POST /sec/cadAluno`, `POST /sec/cadProfessor`, `POST /sec/cadSecretaria`                                                                                                                                                                                                                                                                                |
| `ListarUsuarios.html`  | `menu.js`, `verificaToken.js`, `ListarUsuarios.js`                                                                                       | `GET /sec/listarUsuarios`, `DELETE /sec/excluirUsuario/:id_user`                                                                                                                                                                                                                                                                                                                  |
| `editarUsuario.html`   | `menu.js`, `mascaras.js`, `editarCad.js` ⚠️ no `verificaToken.js`                                                                        | `GET /sec/consultarUsuario/:id`, `GET /sec/consultarAluno/:id_user`, `GET /sec/consultarProfessor/:id_user`, `GET /sec/consultarSecretaria/:id_user`, `GET /sec/Turma/listar`, `PUT /sec/editarUsuario/:id`, `PUT /sec/atualizarTurmaAluno/:id`, `PUT /sec/atualizarEspecialidadeProfessor/:id`, `PUT /sec/atualizarSetorSecretaria/:id`, `PUT /sec/atualizarTurmasProfessor/:id` |
| `cadastroCurso.html`   | `verificaToken.js`, `menu.js`, `cadastroCurso.js`                                                                                        | `POST /sec/curso`                                                                                                                                                                                                                                                                                                                                                                 |
| `ListarCursos.html`    | `menu.js`, `ListarCursos.js` ⚠️ no `verificaToken.js`                                                                                    | `GET /sec/listarCursos`, `DELETE /sec/excluirCurso/:id_curso`                                                                                                                                                                                                                                                                                                                     |
| `editarCurso.html`     | `verificaToken.js`, `menu.js`, `editarCurso.js`                                                                                          | `GET /sec/listarCursos`, `PUT /sec/editarCurso/:id_curso`                                                                                                                                                                                                                                                                                                                         |
| `cadastroMateria.html` | `cadastroMateria.js`, `menu.js` ⚠️ no `verificaToken.js`                                                                                 | `GET /sec/listarCursos`, `GET /sec/listarProfessores`, `POST /sec/materia/:id_curso`                                                                                                                                                                                                                                                                                              |
| `ListarMaterias.html`  | `menu.js`, `verificaToken.js`, `ListarMaterias.js`                                                                                       | `GET /sec/listarCursos`, `GET /sec/listarMaterias/:id_curso`, `DELETE /sec/excluirMateria/:id_materia`                                                                                                                                                                                                                                                                            |
| `editarMateria.html`   | `editarMateria.js`, `menu.js` ⚠️ no `verificaToken.js`                                                                                   | `GET /sec/listarCursos`, `GET /sec/listarMaterias/:id_curso`, `GET /sec/listarProfessores`, `PUT /sec/editarMateria/:id_materia`                                                                                                                                                                                                                                                  |
| `CadastrarTurma.html`  | `menu.js`, `verificaToken.js`, `cadastrarTurma.js`                                                                                       | `GET /sec/listarCursos`, `POST /sec/Turma/cadastrar`                                                                                                                                                                                                                                                                                                                              |
| `ListarTurmas.html`    | `menu.js`, `verificaToken.js`, `ListarTurmas.js` (**loaded twice**)                                                                      | `GET /sec/Turma/listar`, `DELETE /sec/Turma/deletar/:id`                                                                                                                                                                                                                                                                                                                          |
| `consultarTurma.html`  | `menu.js`, `verificaToken.js`, `ConsultarTurma.js`                                                                                       | `GET /sec/Turma/consultar/:id_turma`, `DELETE /sec/Turma/removerAluno/:id_aluno`, `DELETE /sec/Turma/removerProfessor/:id_professor/:id_turma`                                                                                                                                                                                                                                    |
| `editarTurma.html`     | `menu.js`, `verificaToken.js`, `editarTurma.js`                                                                                          | `GET /sec/listarCursos`, `GET /sec/Turma/listar`, `PUT /sec/Turma/editar/:id`                                                                                                                                                                                                                                                                                                     |
| `editarInfo.html`      | `menu.js`, `mascaras.js`, `verificaToken.js`, `editarInfo.js`                                                                            | `GET /token`, `GET /info/:userId`, `PUT /editarInfo`                                                                                                                                                                                                                                                                                                                              |
| `info.html`            | `menu.js`, `mascaras.js`, `../Js/verificaToken.js` (**wrong path** — resolves to `Secretaria/Js/`, which has no such file), `infoSec.js` | `GET /info/:id_user`                                                                                                                                                                                                                                                                                                                                                              |
| `Ajuda.html`           | `verificaToken.js`, `menu.js`                                                                                                            | —                                                                                                                                                                                                                                                                                                                                                                                 |

---

## 🚧 Conventions and caveats

- **Hardcoded API URL.** Every script writes `http://localhost:8081/...` by
  hand. A central HTTP client is planned in
  [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37), followed by the
  screen refactors [[FE2] #38](https://github.com/ftfariasdev/SAGA/issues/38)
  through [[FE6] #42](https://github.com/ftfariasdev/SAGA/issues/42). Until
  then, a new script must follow the same pattern.
- **Inconsistent casing.** `Css/` vs `css/`, `.Html` vs `.html`, `Chamada.js`
  vs `chamada2.js`. Don't rename files or folders without updating every
  `href`/`src` that points to them — Windows and macOS hide the mistake, a Linux
  server doesn't.
- **Pages without `verificaToken.js`** (`Cadastro`, `ListarCursos`,
  `cadastroMateria`, `editarMateria`, `editarUsuario`) open without a session
  check; the API still rejects their requests without a valid token.
- **Messages to the user:** prefer the shared modal (`mostrarModal` from
  `verificaToken.js`, styled by `Css Base/modal.css`) over `alert()`, which is
  still used in `Aluno/Js/curso.js`, `Login/Js/login.js` and
  `Professor/Js/turma.js`.
- **Lint.** `eslint.config.js` at the repository root applies browser globals to
  `Front-End/**/*.js` and declares the CDN globals `Chart`, `ChartDataLabels`,
  `FullCalendar` (frequency pages) and `google` (login). If you add a CDN
  library, declare its global there. Run `npm run lint` from the root.
- **No role check in the UI.** Any logged-in user can open any area's pages by
  URL. See [docs/known-issues.md](../docs/known-issues.md) for this and other
  known defects.

---

## 📚 Further reading

- [Architecture](../docs/architecture.md)
- [API reference](../docs/api-reference.md)
- [Known issues](../docs/known-issues.md)
- [How to contribute](../CONTRIBUTING.md)
