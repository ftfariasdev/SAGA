# CLAUDE.md

🌐 [English](../../CLAUDE.md) | **Português (Brasil)**

Orientações para agentes de IA que programam neste repositório (Claude Code e similares). O Claude
Code carrega automaticamente o [CLAUDE.md](../../CLAUDE.md), em inglês; este arquivo é a tradução para
leitura humana. O nome é diferente de propósito: um `CLAUDE.md` dentro de uma subpasta seria carregado
pelo Claude Code como um segundo conjunto de instruções. Mantenha os dois sincronizados.

## O projeto em resumo

O SAGA é uma aplicação web de gestão escolar (secretaria, professores e alunos) desenvolvida por uma
equipe pequena, com pessoas que ainda estão aprendendo — prefira código claro e explícito a
abstrações engenhosas.

| Parte          | Tecnologia                                                 | Onde roda                                        |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `Front-End/`   | HTML/CSS/JS puro estático, uma pasta por perfil, sem build | `http://127.0.0.1:5500` (Live Server do VS Code) |
| `Back-end/`    | Node.js 22, Express 4 (ES modules), Prisma 6               | `http://localhost:8081`                          |
| Banco de dados | PostgreSQL 16 no Docker (container `saga-db`)              | `localhost:5432`                                 |

Identificadores, textos de tela e a maior parte do histórico de commits estão em **português**. Os
termos do domínio (`aluno`, `turma`, `materia`, `chamada`, `nota`, `bimestre`…) estão explicados no
[docs/pt-BR/glossary.md](glossary.md).

O código está em uma refatoração planejada, acompanhada por issues do GitHub com IDs entre colchetes
(`[F1]`, `[S2]`, `[D4]`…). Um pull request = uma issue.

## Comandos

Raiz do repositório — apenas ferramentas de lint e formatação:

```bash
npm install
npm run lint          # ESLint — manter em 0 erros e 0 warnings
npm run lint:fix
npm run format:check  # Prettier em **/*.{js,json,md} — o CI roda isto
npm run format
```

`Back-end/`:

```bash
docker compose up -d                       # sobe o PostgreSQL
npx prisma generate                        # regenera o Prisma Client
npx prisma migrate dev                     # aplica as migrations
npx prisma migrate dev --name <snake_case> # cria uma migration depois de editar o schema.prisma
npx prisma studio                          # interface do banco em :5555
npm run dev                                # API com node --watch
curl http://localhost:8081/health          # {"status":"UP",...}
```

**Ainda não existe runner de testes**: `npm test` no `Back-end/` sai com código 1 de propósito até a
`[T1]` #31. Valide mudanças no backend subindo a API e chamando as rotas afetadas
(`Back-end/tests/*.http` ou `curl`).

## Mapa da arquitetura

Caminho de uma requisição: `server.js` → `src/Routes/routes{Geral,Aluno,Prof,Sec}.js` →
`tokenAuthenticate` (`src/middlewares/authenticate.js`) → classe controller em `src/controller/` →
Prisma (`src/util/prisma.js`) → PostgreSQL.

- Não há camada de serviço nem de repositório: os controllers concentram as regras de negócio e
  chamam o Prisma direto.
- O `tokenAuthenticate` só verifica o JWT e preenche `req.userId`. **Não existe autorização por
  perfil** — qualquer usuário logado consegue chamar `/sec/*` (`[S2]` #15).
- `routesAluno.js` e `routesProf.js` envolvem os handlers em arrow functions; `routesGeral.js` e
  `routesSec.js` passam métodos soltos (`secController.cadCurso`), então `this` é `undefined` dentro
  dos métodos de `SecController`, `commonController` e `LoginController`.
- As páginas do front-end chamam `fetch('http://localhost:8081/...')` direto. A sessão fica no
  `localStorage` (`token`, `tipo`, `userId`, `nomeUsuario`, `emailUsuario`, `fotoPerfil`).

Detalhes: [docs/pt-BR/architecture.md](architecture.md),
[docs/pt-BR/api-reference.md](api-reference.md),
[docs/pt-BR/database.md](database.md),
[docs/pt-BR/front-end.md](front-end.md).

## Regras

1. **Não faça commit, push nem stage** sem o usuário pedir. O modelo de branches é **Git Flow**:
   branches `feature/` e `bugfix/` saem de `develop` e voltam por pull request para `develop`; só
   `release/` e `hotfix/` vão para `main`. Nunca rode `git flow … finish` — os merges acontecem por
   pull request.
2. **Trate o contrato HTTP como congelado.** Os scripts do front-end fixam caminhos, nomes de campos e
   status codes. Não renomeie rotas, campos de requisição/resposta nem status codes a menos que a
   task do backlog autorize. Quando a mudança for autorizada, registre o impacto no front-end e
   atualize o `docs/api-reference.md` nos dois idiomas.
3. **Nunca renumere `User.tipo`**: `0` = criado pelo login com Google, `1` = Secretaria,
   `2` = Professor, `3` = Aluno. Os valores estão gravados no banco e a página de login redireciona
   com base neles.
4. Nunca devolva `senha` (o hash da senha) em uma resposta. Nunca commite `.env`, tokens ou senhas
   reais.
5. Mude o schema apenas por migrations do Prisma. Commite o `schema.prisma` junto com a pasta da nova
   migration e nunca edite uma migration que já foi aplicada.
6. Use o vocabulário de domínio em português nos novos identificadores (`listarTurmas`, `id_turma`) e
   não traduza nomes existentes.
7. Siga o estilo existente: imports de ES modules; Prettier (aspas simples, ponto e vírgula, largura
   100, sem vírgula final); ESLint `eqeqeq`, `require-await`, `no-return-await`, `no-console` exceto
   `console.error`/`console.warn` (scripts de CLI são exceção). Rode `npm run lint` e
   `npm run format:check` antes de terminar.
8. Mensagens de commit seguem Conventional Commits — `tipo(escopo): descrição`. Veja o
   [docs/pt-BR/CONTRIBUTING.md](CONTRIBUTING.md).
9. **A documentação é bilíngue.** O inglês fica onde o GitHub e as ferramentas procuram (`README.md`,
   `CONTRIBUTING.md`, `CLAUDE.md`, os `README.md` das pastas e `docs/<nome>.md`). Toda tradução PT-BR
   fica em `docs/pt-BR/`: mesmo nome de arquivo para os documentos de `docs/`, `back-end.md` e
   `front-end.md` para os READMEs das pastas, `ai-agents.md` para este arquivo. Todo documento tem o
   seletor de idioma logo abaixo do H1. Atualize os dois idiomas na mesma mudança e inclua documentos
   novos nas tabelas de documentação do `README.md` e do `docs/pt-BR/README.md`. A única exceção de
   arquivo único é o `.github/pull_request_template.md`, que é bilíngue por dentro. Regras completas:
   [Como contribuir § 6](CONTRIBUTING.md#6-regras-de-documentação).

## Armadilhas

- **Porta 8081.** O front-end fixa essa porta, então o `.env` precisa manter `PORT=8081`. O CORS só
  libera `http://127.0.0.1:5500` — não `localhost:5500`, nem `file://`.
- O `/health` está definido duas vezes; vale o do `routesGeral.js` (`{"status":"UP"}`), porque esse
  roteador é montado primeiro.
- `GET /aluno/bimestre/:bimestre` e `GET /aluno/frequencia-geral` apontam para métodos que não
  existem no controller, então falham com 500 (`[D7]` #29).
- `DELETE /sec/Turma/deletar/:id` também apaga os registros de aluno da turma (`[D4]` #25). Não teste
  em dados que importam.
- `POST /sec/cadSecretaria` é pública de propósito, para criar o primeiro usuário em um banco local
  novo (`[C1]` #1 vai fechá-la).
- Os payloads de erro são inconsistentes (`erro` / `error` / `message`). Siga o formato do handler ao
  redor até a `[F1]` #3 criar o error handler global.
- Windows: `core.autocrlf=true` e nenhum `.gitattributes`, então o Prettier acusa finais de linha
  CRLF localmente. O CI no Linux é a referência; `npx prettier --check --end-of-line auto <arquivos>`
  confirma que só os finais de linha diferem.
- Arquivos órfãos — `Back-end/cadMateria.js` (não usado), `src/controller/profController_fixed.js`
  (vazio), `Back-end/node_modules.rar` — não importe nem estenda (`[F9]` #11).
- Lista completa: [docs/pt-BR/known-issues.md](known-issues.md).

## Onde procurar

| Tarefa                       | Arquivos                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Criar ou alterar um endpoint | `Back-end/src/Routes/routes*.js`, `Back-end/src/controller/*Controller.js`, `docs/api-reference.md` (+ `docs/pt-BR/`)                  |
| Autenticação / JWT           | `src/controller/loginController.js`, `src/middlewares/authenticate.js`, `Front-End/Js/verificaToken.js`, `Front-End/Login/Js/login.js` |
| Schema do banco              | `Back-end/prisma/schema.prisma`, `Back-end/prisma/migrations/`, `docs/database.md` (+ `docs/pt-BR/`)                                   |
| Uma tela                     | `Front-End/<Perfil>/Page/*.html` + `Front-End/<Perfil>/Js/*.js` (mapa no `docs/pt-BR/front-end.md`)                                    |
| Utilitários do front-end     | `Front-End/Js/verificaToken.js`, `menu.js`, `mascaras.js`                                                                              |
| Ambiente e configuração      | `Back-end/.env.example`, `Back-end/docker-compose.yml`, `Back-end/server.js`                                                           |
| Lint, formatação, CI         | `eslint.config.js`, `.prettierrc`, `.github/workflows/`                                                                                |
| Regras de contribuição       | `docs/pt-BR/CONTRIBUTING.md`, `.github/pull_request_template.md`                                                                       |
