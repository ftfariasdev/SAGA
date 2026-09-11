# 🎨 SAGA — Front-End

🌐 [English](../../Front-End/README.md) | **Português (Brasil)**

O front-end do SAGA é uma **aplicação estática com várias páginas**, escrita em
HTML, CSS e JavaScript puros (ES6+). **Não há etapa de build, bundler nem
`package.json`** nesta pasta: cada página é um arquivo `.html` que carrega os
scripts com `<script src>` e conversa com a API em `http://localhost:8081`.

---

## 🧾 Índice

- [Rodando](#-rodando)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Scripts compartilhados](#-scripts-compartilhados)
- [Dados de sessão no localStorage](#-dados-de-sessão-no-localstorage)
- [Login e redirecionamento por tipo de usuário](#-login-e-redirecionamento-por-tipo-de-usuário)
- [Mapa de páginas](#-mapa-de-páginas)
- [Convenções e cuidados](#-convenções-e-cuidados)
- [Para saber mais](#-para-saber-mais)

---

## 🚀 Rodando

1. Suba a API antes ([README do Back-end](back-end.md)). Ela
   precisa estar em **`http://localhost:8081`** — esse endereço está fixo em
   todos os scripts.
2. No **VS Code**, instale a extensão **Live Server**, abra a pasta `Front-End`,
   clique com o botão direito em `index.html` → **Open with Live Server**.
3. A página precisa ser servida em **`http://127.0.0.1:5500`**. O CORS da API
   libera exatamente essa origem, então `http://localhost:5500` e `file://`
   (dois cliques) não funcionam.

O `index.html` mostra uma tela de boas-vindas e redireciona para
`Login/Login.html` depois de 2 segundos.

---

## 📁 Estrutura de pastas

```
Front-End/
├── index.html           # Tela de boas-vindas → redireciona para Login/Login.html
├── Login/               # Login.html, RecSenha.html, ConfirRecSenha.html + Css/ e Js/login.js
├── Aluno/               # Área do aluno
│   ├── Page/            #   páginas HTML
│   ├── Js/              #   um script por página (na maioria dos casos)
│   └── Css/             #   estilos das páginas
├── Professor/           # Área do professor — mesmo layout Page/ Js/ Css/
├── Secretaria/          # Área da secretaria — Page/ Js/ css/ ("css" minúsculo)
├── Js/                  # Scripts compartilhados: verificaToken.js, menu.js, mascaras.js
├── Css Base/            # Estilos compartilhados: base, home, modal, tabela, botoesTabela, barraPesquisa
└── Img/                 # Imagens (capturas da tela de login e da chamada)
```

---

## 🧩 Scripts compartilhados

| Arquivo               | O que faz                                                                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Js/verificaToken.js` | No `DOMContentLoaded`, chama `GET /token` com o JWT salvo. Sem token ou com `401` → remove o token, mostra um modal e redireciona para o login. Também define `mostrarModal(mensagem)`, o modal compartilhado.           |
| `Js/menu.js`          | Menu suspenso do perfil no cabeçalho: preenche nome, e-mail e foto a partir do `localStorage`, atualiza com `GET /info/:userId`, e o botão **Sair** faz `localStorage.clear()` e volta para o login.                     |
| `Js/mascaras.js`      | Máscaras de CPF (`000.000.000-00`) e telefone (`XX XXXXX-XXXX`) em `#cpf`/`input[name="cpf"]` e `#telefone`/`input[name="telefone"]`. Expõe `window.aplicarMascarasAposDados()` para reaplicar depois de carregar dados. |

---

## 💾 Dados de sessão no localStorage

Não há cookies nem sessão no servidor: tudo o que as páginas compartilham fica
no `localStorage`.

| Chave                                                                   | Quem grava                                                       | Quem lê                                                                                                                                       | Conteúdo                                                                                                                                                           |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `token`                                                                 | `login.js`                                                       | Quase todos os scripts; `verificaToken.js` remove no `401`                                                                                    | JWT enviado como `Authorization: Bearer <token>`                                                                                                                   |
| `tipo`                                                                  | `login.js`                                                       | Nenhum script lê hoje                                                                                                                         | Código do tipo de usuário (veja a próxima seção)                                                                                                                   |
| `userId`                                                                | `login.js`; `verificaToken.js` (copia de `id_user`)              | `menu.js`, `homeAlu.js`, `infoAluno.js`, `homeProf.js`, `infoProf.js`, `Chamada.js`, `chamada2.js`, `lancamento.js`, `turma.js`, `infoSec.js` | O `id_user` do usuário                                                                                                                                             |
| `id_user`                                                               | Nenhum script atual (nome legado)                                | `verificaToken.js` (copia para `userId`), `Secretaria/Js/editarInfo.js`                                                                       | Apelido legado de `userId`                                                                                                                                         |
| `nomeUsuario`                                                           | `login.js`, `menu.js`, `homeAlu.js`, `homeProf.js`               | `menu.js`, `homeAlu.js`, `homeProf.js`                                                                                                        | Nome completo                                                                                                                                                      |
| `emailUsuario`                                                          | `login.js`, `menu.js`, `homeAlu.js`, `homeProf.js`               | `menu.js`, `homeAlu.js`, `homeProf.js`                                                                                                        | E-mail — no login por senha o `login.js` lê `data.email`, mas o `/login` devolve `emailDoBanco`, então ele só é preenchido quando o `menu.js` ou uma home atualiza |
| `fotoPerfil`                                                            | `login.js`, `menu.js`, `homeAlu.js`, `homeProf.js`, `infoSec.js` | `menu.js`, `homeAlu.js`, `homeProf.js`, `infoSec.js`                                                                                          | Foto de perfil (URL ou data URI)                                                                                                                                   |
| `professorId`                                                           | `Professor/Js/turma.js`                                          | `Professor/Js/turma.js`                                                                                                                       | `id_professor` em cache                                                                                                                                            |
| `selectedTurmaId`, `selectedCursoNome`                                  | `Professor/Js/turma.js`                                          | Nenhum arquivo `.js` lê                                                                                                                       | Turma selecionada na página Turma                                                                                                                                  |
| `id_turma_selecionada`, `id_materia_selecionada`, `selectedMateriaNome` | `Professor/Js/Chamada.js`                                        | `Professor/Js/chamada2.js`                                                                                                                    | Turma e matéria escolhidas para a chamada                                                                                                                          |
| `selectedTurmaNome`                                                     | `Professor/Js/Chamada.js`, `Professor/Js/turma.js`               | `Professor/Js/chamada2.js`                                                                                                                    | Nome da turma selecionada                                                                                                                                          |

---

## 🔑 Login e redirecionamento por tipo de usuário

O `Login/Js/login.js` envia `POST /login` (ou `POST /login/google`), grava as
chaves de sessão acima e redireciona conforme o `tipo`:

| `tipo` | Tipo de usuário                               | Redireciona para                                                                                         |
| ------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `1`    | Secretaria                                    | `Secretaria/Page/HomeSecretaria.html`                                                                    |
| `2`    | Professor                                     | `Professor/Page/HomeProfessor.html`                                                                      |
| `3`    | Aluno                                         | `Aluno/Page/HomeAluno.html`                                                                              |
| outro  | ex.: `0`, criado no primeiro login com Google | Login por senha: erro "Tipo de usuário não reconhecido". Login com Google: volta para `Login/Login.html` |

> ⚠️ Os arquivos se chamam, na verdade, `HomeProfessor.Html` e `HomeAluno.Html`
> (**H** maiúsculo na extensão). O redirecionamento funciona no Windows e no
> macOS, cujos sistemas de arquivos ignoram maiúsculas, mas **quebra num servidor
> que diferencia maiúsculas, como o Linux**.

---

## 🧭 Mapa de páginas

"Scripts" lista os scripts locais que cada página carrega, na ordem. Os
endpoints são relativos a `http://localhost:8081`. Os detalhes de cada rota
estão em [docs/pt-BR/api-reference.md](api-reference.md).

### Login

| Página                | Scripts                                                                                     | Endpoints da API                                   |
| --------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `Login.html`          | CDN: jQuery 3.5.1, Popper 1.16.1, Bootstrap 4.5.2, Google Identity Services · `Js/login.js` | `GET /health`, `POST /login`, `POST /login/google` |
| `RecSenha.html`       | `Js/script.js` — **o arquivo não existe**                                                   | — (recuperação de senha não implementada)          |
| `ConfirRecSenha.html` | `Js/script.js` — **o arquivo não existe**                                                   | — (recuperação de senha não implementada)          |

### Aluno

| Página           | Scripts                                                                                                        | Endpoints da API                                                                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HomeAluno.Html` | `homeAlu.js`, `verificaToken.js`                                                                               | `GET /info/:userId`                                                                                                                                                                                                  |
| `Curso.html`     | `verificaToken.js`, `menu.js`, `curso.js`                                                                      | `GET /aluno/listMateria`                                                                                                                                                                                             |
| `boletim.html`   | `verificaToken.js`, `menu.js`, `boletim.js`                                                                    | `GET /aluno/bimestre/:bimestre` — o método do controller não existe, então o boletim nunca carrega ([problemas conhecidos](known-issues.md))                                                                         |
| `Freq1.html`     | CDN: Chart.js, chartjs-plugin-datalabels 2.2.0, FullCalendar 6.1.8 · `verificaToken.js`, `menu.js`, `freq1.js` | Nenhum que funcione: o gráfico de pizza é um placeholder fixo de 50/50 e o `fetch('/aluno/listMateria')` é relativo, então vai para o Live Server e não para a API. Clicar num dia abre `freq2.html?data=AAAA-MM-DD` |
| `Freq2.html`     | CDN: FullCalendar 6.1.8 · `verificaToken.js`, `freq2.js`                                                       | `GET /aluno/presencas-dia?data=AAAA-MM-DD`                                                                                                                                                                           |
| `info.html`      | `verificaToken.js`, `infoAluno.js`, `menu.js`, `mascaras.js`, `curso.js`                                       | `GET /info/:id_user`, `GET /aluno/listMateria` (via `curso.js`)                                                                                                                                                      |
| `Ajuda.html`     | `verificaToken.js`, `menu.js`, `curso.js`                                                                      | `GET /aluno/listMateria` (via `curso.js`)                                                                                                                                                                            |

Scripts sem uso em `Aluno/Js/`: `dia.js` (mostra os valores `dia` e `status` da
query string; nenhuma página carrega) e `script.js` (vazio).

### Professor

| Página               | Scripts                                                                 | Endpoints da API                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HomeProfessor.Html` | `homeProf.js`, `verificaToken.js`                                       | `GET /info/:userId`                                                                                                                                                |
| `Turma.html`         | `verificaToken.js`, `menu.js`, `turma.js`                               | `GET /professor/user/:id_user`, `GET /prof/turmas/:id_professor`                                                                                                   |
| `Chamada.html`       | `verificaToken.js`, `menu.js`, `Chamada.js`                             | `GET /professor/user/:id_user`, `GET /prof/turmas/:id_professor`, `GET /prof/materias/:id_professor` — salva a seleção lida pela `Chamada2`                        |
| `Chamada2.html`      | `verificaToken.js`, `menu.js`, `chamada2.js`                            | `GET /professor/user/:id_user`, `GET /prof/alunos/:id_turma`, `GET /prof/chamada/:id_turma/data?data=`, `POST /prof/chamada`                                       |
| `Lancamento.html`    | `verificaToken.js`, `menu.js`, `lancamento.js`                          | `GET /professor/user/:id_user`, `GET /prof/turmas/:id_professor`, `GET /prof/materias/:id_professor`, `GET /prof/alunos-turma/:id_turma`, `POST /prof/lancarNotas` |
| `info.html`          | `verificaToken.js`, `menu.js`, `mascaras.js`, `curso.js`, `infoProf.js` | `GET /info/:id_user` (o `curso.js` só desenha uma tabela de exemplo fixa)                                                                                          |
| `Ajuda.html`         | `verificaToken.js`, `menu.js`                                           | —                                                                                                                                                                  |

Scripts sem uso ou de exemplo em `Professor/Js/`: `boletim.js` (boletim de
exemplo fixo; nenhuma página carrega), `curso.js` (tabela de curso de exemplo
fixa) e `script.js` (vazio).

### Secretaria

| Página                 | Scripts                                                                                                                                         | Endpoints da API                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HomeSecretaria.html`  | `menu.js`, `verificaToken.js`                                                                                                                   | — (só o `menu.js` → `GET /info/:userId`)                                                                                                                                                                                                                                                                                                                                          |
| `Cadastro.html`        | `menu.js`, `cadastro.js`, `mascaras.js` ⚠️ sem `verificaToken.js`                                                                               | `GET /sec/Turma/listar`, `POST /sec/cadAluno`, `POST /sec/cadProfessor`, `POST /sec/cadSecretaria`                                                                                                                                                                                                                                                                                |
| `ListarUsuarios.html`  | `menu.js`, `verificaToken.js`, `ListarUsuarios.js`                                                                                              | `GET /sec/listarUsuarios`, `DELETE /sec/excluirUsuario/:id_user`                                                                                                                                                                                                                                                                                                                  |
| `editarUsuario.html`   | `menu.js`, `mascaras.js`, `editarCad.js` ⚠️ sem `verificaToken.js`                                                                              | `GET /sec/consultarUsuario/:id`, `GET /sec/consultarAluno/:id_user`, `GET /sec/consultarProfessor/:id_user`, `GET /sec/consultarSecretaria/:id_user`, `GET /sec/Turma/listar`, `PUT /sec/editarUsuario/:id`, `PUT /sec/atualizarTurmaAluno/:id`, `PUT /sec/atualizarEspecialidadeProfessor/:id`, `PUT /sec/atualizarSetorSecretaria/:id`, `PUT /sec/atualizarTurmasProfessor/:id` |
| `cadastroCurso.html`   | `verificaToken.js`, `menu.js`, `cadastroCurso.js`                                                                                               | `POST /sec/curso`                                                                                                                                                                                                                                                                                                                                                                 |
| `ListarCursos.html`    | `menu.js`, `ListarCursos.js` ⚠️ sem `verificaToken.js`                                                                                          | `GET /sec/listarCursos`, `DELETE /sec/excluirCurso/:id_curso`                                                                                                                                                                                                                                                                                                                     |
| `editarCurso.html`     | `verificaToken.js`, `menu.js`, `editarCurso.js`                                                                                                 | `GET /sec/listarCursos`, `PUT /sec/editarCurso/:id_curso`                                                                                                                                                                                                                                                                                                                         |
| `cadastroMateria.html` | `cadastroMateria.js`, `menu.js` ⚠️ sem `verificaToken.js`                                                                                       | `GET /sec/listarCursos`, `GET /sec/listarProfessores`, `POST /sec/materia/:id_curso`                                                                                                                                                                                                                                                                                              |
| `ListarMaterias.html`  | `menu.js`, `verificaToken.js`, `ListarMaterias.js`                                                                                              | `GET /sec/listarCursos`, `GET /sec/listarMaterias/:id_curso`, `DELETE /sec/excluirMateria/:id_materia`                                                                                                                                                                                                                                                                            |
| `editarMateria.html`   | `editarMateria.js`, `menu.js` ⚠️ sem `verificaToken.js`                                                                                         | `GET /sec/listarCursos`, `GET /sec/listarMaterias/:id_curso`, `GET /sec/listarProfessores`, `PUT /sec/editarMateria/:id_materia`                                                                                                                                                                                                                                                  |
| `CadastrarTurma.html`  | `menu.js`, `verificaToken.js`, `cadastrarTurma.js`                                                                                              | `GET /sec/listarCursos`, `POST /sec/Turma/cadastrar`                                                                                                                                                                                                                                                                                                                              |
| `ListarTurmas.html`    | `menu.js`, `verificaToken.js`, `ListarTurmas.js` (**carregado duas vezes**)                                                                     | `GET /sec/Turma/listar`, `DELETE /sec/Turma/deletar/:id`                                                                                                                                                                                                                                                                                                                          |
| `consultarTurma.html`  | `menu.js`, `verificaToken.js`, `ConsultarTurma.js`                                                                                              | `GET /sec/Turma/consultar/:id_turma`, `DELETE /sec/Turma/removerAluno/:id_aluno`, `DELETE /sec/Turma/removerProfessor/:id_professor/:id_turma`                                                                                                                                                                                                                                    |
| `editarTurma.html`     | `menu.js`, `verificaToken.js`, `editarTurma.js`                                                                                                 | `GET /sec/listarCursos`, `GET /sec/Turma/listar`, `PUT /sec/Turma/editar/:id`                                                                                                                                                                                                                                                                                                     |
| `editarInfo.html`      | `menu.js`, `mascaras.js`, `verificaToken.js`, `editarInfo.js`                                                                                   | `GET /token`, `GET /info/:userId`, `PUT /editarInfo`                                                                                                                                                                                                                                                                                                                              |
| `info.html`            | `menu.js`, `mascaras.js`, `../Js/verificaToken.js` (**caminho errado** — aponta para `Secretaria/Js/`, onde o arquivo não existe), `infoSec.js` | `GET /info/:id_user`                                                                                                                                                                                                                                                                                                                                                              |
| `Ajuda.html`           | `verificaToken.js`, `menu.js`                                                                                                                   | —                                                                                                                                                                                                                                                                                                                                                                                 |

---

## 🚧 Convenções e cuidados

- **URL da API fixa no código.** Todo script escreve `http://localhost:8081/...`
  à mão. Um cliente HTTP central está planejado na
  [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37), seguido das
  refatorações de tela [[FE2] #38](https://github.com/ftfariasdev/SAGA/issues/38)
  a [[FE6] #42](https://github.com/ftfariasdev/SAGA/issues/42). Até lá, um script
  novo deve seguir o mesmo padrão.
- **Maiúsculas e minúsculas inconsistentes.** `Css/` vs `css/`, `.Html` vs
  `.html`, `Chamada.js` vs `chamada2.js`. Não renomeie arquivos ou pastas sem
  atualizar todo `href`/`src` que aponta para eles — Windows e macOS escondem o
  erro, um servidor Linux não.
- **Páginas sem `verificaToken.js`** (`Cadastro`, `ListarCursos`,
  `cadastroMateria`, `editarMateria`, `editarUsuario`) abrem sem checar a
  sessão; a API continua recusando as requisições sem token válido.
- **Mensagens ao usuário:** prefira o modal compartilhado (`mostrarModal`, de
  `verificaToken.js`, com estilo em `Css Base/modal.css`) ao `alert()`, que
  ainda aparece em `Aluno/Js/curso.js`, `Login/Js/login.js` e
  `Professor/Js/turma.js`.
- **Lint.** O `eslint.config.js` da raiz aplica os globais de navegador em
  `Front-End/**/*.js` e declara os globais de CDN `Chart`, `ChartDataLabels`,
  `FullCalendar` (páginas de frequência) e `google` (login). Se adicionar uma
  biblioteca por CDN, declare o global dela lá. Rode `npm run lint` na raiz.
- **Sem checagem de perfil na interface.** Qualquer usuário logado abre as
  páginas de qualquer área pela URL. Veja
  [docs/pt-BR/known-issues.md](known-issues.md) para este e outros
  defeitos conhecidos.

---

## 📚 Para saber mais

- [Arquitetura](architecture.md)
- [Referência da API](api-reference.md)
- [Problemas conhecidos](known-issues.md)
- [Como contribuir](CONTRIBUTING.md)
