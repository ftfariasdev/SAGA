# 🔌 SAGA — Back-end (API REST)

🌐 [English](../../Back-end/README.md) | **Português (Brasil)**

A API REST do SAGA: **Node.js + Express 4** (ES modules), **Prisma 6** como ORM
e **PostgreSQL 16** rodando no Docker. Ela atende as três áreas do sistema —
secretaria, professor e aluno — para o front-end estático em
[`../Front-End`](front-end.md).

> 📘 Primeira vez aqui? O passo a passo de instalação para macOS, Linux Mint e
> Windows está em [docs/pt-BR/local-environment.md](local-environment.md).

---

## 🧾 Índice

- [Stack](#-stack)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Início rápido](#-início-rápido)
- [Scripts](#-scripts)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Como uma requisição percorre a API](#-como-uma-requisição-percorre-a-api)
- [Criando um endpoint](#-criando-um-endpoint)
- [Scripts de manutenção e testes manuais](#-scripts-de-manutenção-e-testes-manuais)
- [Para saber mais](#-para-saber-mais)

---

## 🧱 Stack

| Pacote / ferramenta         | Versão (`package.json`) | Papel no projeto                                                                     |
| --------------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Node.js                     | 22 LTS                  | Runtime — o pacote usa `"type": "module"` (`import`/`export`)                        |
| `express`                   | ^4.21.2                 | Servidor HTTP e rotas                                                                |
| `@prisma/client` / `prisma` | ^6.5.0 / ^6.6.0         | Client do ORM e CLI de migrations                                                    |
| PostgreSQL                  | 16 (imagem Docker)      | Banco de dados (`docker-compose.yml`)                                                |
| `jsonwebtoken`              | ^9.0.2                  | Emite e verifica os JWTs (válidos por 10 h)                                          |
| `bcrypt`                    | ^5.1.1                  | Gera o hash da senha quando a secretaria cria ou edita usuários (`secController.js`) |
| `bcryptjs`                  | ^3.0.2                  | Compara a senha no login (`loginController.js`)                                      |
| `google-auth-library`       | ^9.15.1                 | Valida o ID token do Google em `POST /login/google`                                  |
| `cors`                      | ^2.8.5                  | Libera apenas a origem do front-end, `http://127.0.0.1:5500`                         |
| `dotenv`                    | ^16.4.7                 | Carrega o `.env`                                                                     |
| `date-fns`                  | ^4.1.0                  | Início e fim do dia nas consultas de frequência (`alunoController.js`)               |

> ⚠️ Duas bibliotecas de bcrypt fazem o mesmo trabalho (os hashes são
> compatíveis), o `sqlite3` está listado mas nunca é importado, e os metadados
> do `package.json` (`"name": "dev"`, repositório `HugoSants/AuthenticateNode`)
> são sobras de um template. A limpeza está na
> [[F10] #12](https://github.com/ftfariasdev/SAGA/issues/12).

---

## 📁 Estrutura de pastas

```
Back-end/
├── server.js                    # Ponto de entrada: carrega o .env, CORS, corpo JSON (limite de 50 MB), monta as rotas e escuta na PORT
├── src/
│   ├── Routes/                  # Um router por área: URL + middleware → método do controller
│   │   ├── routesGeral.js       # /login, /login/google, /token, /health, /info/:id_user, /editarInfo
│   │   ├── routesAluno.js       # /aluno/*
│   │   ├── routesProf.js        # /prof/*, /professor/user/:id_user
│   │   └── routesSec.js         # /sec/*  cursos, matérias, usuários e turmas
│   ├── controller/              # Validação + regra de negócio + consultas Prisma + resposta HTTP, tudo junto
│   │   ├── loginController.js   # Login por senha e pelo Google, emite o JWT
│   │   ├── commonController.js  # Dados de perfil comuns a todos os tipos de usuário
│   │   ├── alunoController.js   # Aluno: matérias, notas por módulo, frequência
│   │   ├── profController.js    # Professor: turmas, matérias, chamada, lançamento de notas
│   │   ├── secController.js     # Secretaria: CRUD completo (~1.300 linhas, o maior arquivo)
│   │   └── profController_fixed.js  # Arquivo vazio (órfão)
│   ├── middlewares/
│   │   └── authenticate.js      # tokenAuthenticate: confere o "Bearer <JWT>" e preenche req.userId
│   └── util/
│       └── prisma.js            # Instância compartilhada do PrismaClient
├── prisma/
│   ├── schema.prisma            # Modelo de dados (12 models) — veja docs/pt-BR/database.md
│   └── migrations/              # Histórico SQL versionado — nunca edite uma migration já aplicada
├── tests/                       # Arquivos *.http para requisições manuais (REST Client do VS Code) — não são testes automatizados
├── docker-compose.yml           # Container PostgreSQL 16: saga-db, volume saga-pgdata, collation ICU pt-BR
├── .env.example                 # Modelo das variáveis de ambiente (vai para o Git) — copie para .env
├── sync_professores_turmas.js   # Script de manutenção (veja abaixo)
├── cadMateria.js                # Órfão: cópia antiga de secController.cadMateria, não é importado
├── baseline.sql                 # Dump SQL em UTF-16 de um schema antigo, não é usado pelo Prisma
└── node_modules.rar             # Arquivo de ~78 MB commitado por engano
```

Os arquivos órfãos e legados estão listados em
[docs/pt-BR/known-issues.md](known-issues.md) e a remoção está na
[[F9] #11](https://github.com/ftfariasdev/SAGA/issues/11).

---

## 🚀 Início rápido

Requer Node.js 22 e Docker. Guia completo:
[docs/pt-BR/local-environment.md](local-environment.md).

```bash
cd SAGA/Back-end
npm install
cp .env.example .env        # Windows: copy .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"   # cole em JWT_SECRET
docker compose up -d        # PostgreSQL 16
npx prisma migrate dev      # cria as tabelas
npm run dev                 # "Servidor rodando na porta 8081!"
```

```bash
curl http://localhost:8081/health
# {"status":"UP","timestamp":"2026-09-10T13:00:00.000Z","version":"1.0.0"}
```

O banco começa vazio — crie a primeira secretaria como descrito na
[seção 7 do guia de ambiente](local-environment.md#7-criando-o-primeiro-usuário).

---

## 📜 Scripts

| Comando       | O que faz                                                                                                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev` | `node --watch server.js` — sobe a API e reinicia quando um arquivo muda                                                                            |
| `npm test`    | Placeholder que imprime um erro e sai com código 1 — a suíte de testes está planejada na [[T1] #31](https://github.com/ftfariasdev/SAGA/issues/31) |

Lint e formatação **não** ficam nesta pasta: estão no
[`package.json` da raiz](../../package.json) (`npm run lint`, `npm run format:check`)
e cobrem back-end e front-end.

---

## 🔐 Variáveis de ambiente

Definidas no `.env` (copiado de [`.env.example`](../../Back-end/.env.example)).

| Variável            | Obrigatória | Valor no `.env.example`                                    | Para quê                                                                                        |
| ------------------- | ----------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `POSTGRES_USER`     | Sim         | `saga`                                                     | Usuário do banco criado pelo container                                                          |
| `POSTGRES_PASSWORD` | Sim         | `saga`                                                     | Senha desse usuário                                                                             |
| `POSTGRES_DB`       | Sim         | `saga`                                                     | Nome do banco                                                                                   |
| `POSTGRES_PORT`     | Não         | `5432`                                                     | Porta exposta na sua máquina — use `5433` se a 5432 estiver ocupada (e ajuste a `DATABASE_URL`) |
| `DATABASE_URL`      | Sim         | `postgresql://saga:saga@localhost:5432/saga?schema=public` | String de conexão do Prisma — precisa bater com as `POSTGRES_*`                                 |
| `PORT`              | Sim         | `8081`                                                     | Porta da API. **Mantenha 8081**: o front-end tem `http://localhost:8081` fixo                   |
| `JWT_SECRET`        | Sim         | placeholder                                                | Assina os JWTs — gere um valor aleatório seu                                                    |
| `GOOGLE_CLIENT_ID`  | Não         | _(vazio)_                                                  | Habilita `POST /login/google`; o login por senha funciona sem ele                               |

> ⚠️ Sem `JWT_SECRET`, o `authenticate.js` usa em silêncio uma string padrão,
> enquanto o `loginController.js` não tem fallback e não consegue emitir tokens.
> A configuração centralizada e validada está planejada na
> [[F2] #4](https://github.com/ftfariasdev/SAGA/issues/4).

---

## 🔄 Como uma requisição percorre a API

1. **`server.js`** aplica o CORS e o parse de JSON e passa a requisição pelos
   routers, nesta ordem: `routesGeral` → `routesAluno` → `routesProf` →
   `routesSec`.
2. **O router** casa a URL. Rotas protegidas executam antes o
   **`tokenAuthenticate`**: ele espera `Authorization: Bearer <token>`, verifica
   com o `JWT_SECRET` e guarda o `id_user` em `req.userId`. Ele só confere
   **autenticação** — ainda não há checagem de perfil, então qualquer usuário
   logado consegue chamar as rotas `/sec/*`
   ([[S2] #15](https://github.com/ftfariasdev/SAGA/issues/15)).
3. **O método do controller** lê `req.params`, `req.query`, `req.body` e
   `req.userId`, aplica a regra de negócio e consulta o banco pelo client
   compartilhado em `src/lib/prisma.js`.
4. **O controller responde** em JSON. A maioria dos métodos tem o próprio
   `try/catch`, mas alguns não têm (o CRUD de curso no `secController.js` e os
   handlers de login), e um erro neles derruba o processo da API. A chave de erro
   muda entre controllers (`erro`, `error` ou `message`). Um error handler global
   está planejado na
   [[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3).

A lista completa de rotas está em [docs/pt-BR/api-reference.md](api-reference.md).

---

## ➕ Criando um endpoint

1. **Escolha o router** da área (`routesGeral`, `routesAluno`, `routesProf` ou
   `routesSec`) e declare a rota com `tokenAuthenticate`, a menos que ela seja
   pública de propósito. Prefira envolver a chamada —
   `(req, res) => controller.metodo(req, res)` — para o `this` continuar
   funcionando se o método passar a usá-lo.
2. **Escreva o método no controller** com o corpo dentro de `try/catch`. O
   Express 4 não captura promises rejeitadas: um erro não tratado vira uma
   rejeição sem tratamento e o Node.js derruba o processo inteiro da API.
3. **Siga as convenções** da área que você está mexendo (status HTTP e a chave
   de erro que aquele controller já usa) e **nunca devolva o campo `senha`**.
4. **Se o schema mudar**, edite `prisma/schema.prisma`, rode
   `npx prisma migrate dev --name <descricao_curta>` e commite a pasta da
   migration gerada. Atualize [docs/pt-BR/database.md](database.md)
   e a versão em inglês.
5. **Documente a rota** em [docs/pt-BR/api-reference.md](api-reference.md)
   **e** em [docs/api-reference.md](../api-reference.md).
6. **Registre o impacto no front-end** no pull request (o template pede isso) e
   acrescente um exemplo de requisição em `tests/*.http` — sem tokens ou senhas
   reais.

Veja o [docs/pt-BR/CONTRIBUTING.md](CONTRIBUTING.md) para as convenções de
branch, commit e PR.

---

## 🧰 Scripts de manutenção e testes manuais

Rode de dentro de `Back-end/`, com o banco no ar. Os dois scripts criam o
próprio `PrismaClient` e mostram o progresso no console.

| Script                            | O que faz                                                                                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `node sync_professores_turmas.js` | Para cada matéria com professor atribuído, vincula esse professor a todas as turmas do curso da matéria, criando os registros de `professor_turma` que faltam. Pode ser rodado mais de uma vez. |

**Testes manuais da API:** os arquivos em `tests/` (`routesAluno.http`,
`routesProf.http`, `routesSec.http`) rodam com a extensão **REST Client** do VS
Code. Faça login primeiro e troque o cabeçalho `Authorization` pelo seu token.

> 🔒 Esses arquivos contêm **tokens e senhas reais commitados no passado**. Não
> acrescente novos — a remoção e a troca dos segredos estão na
> [[C4] #2](https://github.com/ftfariasdev/SAGA/issues/2).

---

## 📚 Para saber mais

- [Arquitetura](architecture.md) — como front-end, API e banco se encaixam
- [Referência da API](api-reference.md) — todas as rotas, entradas e quem as chama
- [Banco de dados](database.md) — models, relacionamentos e migrations
- [Problemas conhecidos](known-issues.md) — defeitos e dívida técnica, ligados ao backlog
- [Como contribuir](CONTRIBUTING.md)
- [README do projeto](README.md)
