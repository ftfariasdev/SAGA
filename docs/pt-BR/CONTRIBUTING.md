# Como contribuir com o SAGA

🌐 [English](../../CONTRIBUTING.md) | **Português (Brasil)**

Este guia define como nomeamos branches, escrevemos commits e abrimos pull requests no SAGA. Um
histórico de git legível é uma ferramenta de diagnóstico: quando algo quebra, `git log` e
`git bisect` respondem "quando isso mudou e por quê" — **se** as mensagens disserem alguma coisa.
"updates" e "small fix" não dizem.

> 🗣️ **Isto é um combinado do time, não uma regra imposta.** A convenção foi proposta na
> [[CI2] #36](https://github.com/ftfariasdev/SAGA/issues/36) e precisa ser discutida com o time
> antes do merge. Convenção que ninguém combinou é convenção que ninguém segue. Registre o acordo no
> PR.

---

## 📑 Índice

1. [Modelo de branches — Git Flow](#1-modelo-de-branches--git-flow)
2. [Commits — Conventional Commits](#2-commits--conventional-commits)
3. [Pull requests](#3-pull-requests)
4. [Antes de abrir um PR](#4-antes-de-abrir-um-pr)
5. [Estilo de código e convenções de nomes](#5-estilo-de-código-e-convenções-de-nomes)
6. [Regras de documentação](#6-regras-de-documentação)
7. [Segurança básica](#7-segurança-básica)
8. [Automação (o que decidimos não instalar)](#8-automação-o-que-decidimos-não-instalar)
9. [Armadilhas](#9-armadilhas)

---

## 1. Modelo de branches — Git Flow

O SAGA usa **[Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)** com a ferramenta
de linha de comando [git-flow AVH](https://github.com/petervanderdoes/gitflow-avh). O repositório já
está configurado para ela: branch de produção `main`, branch de desenvolvimento `develop` e os
prefixos padrão abaixo.

> 🧰 **Instalando a ferramenta.** O Git for Windows já inclui (confira com `git flow version`). No
> Linux Mint: `sudo apt install git-flow`. No macOS, instale pelo seu gerenciador de pacotes — ou
> dispense a ferramenta: todo comando `git flow` abaixo tem um equivalente em Git puro.

### Branches permanentes

| Branch    | Papel                                                                                                   |
| --------- | ------------------------------------------------------------------------------------------------------- |
| `main`    | O que já foi lançado. Todo merge em `main` é uma versão e recebe uma tag (`1.0.0`). Nunca commite nela. |
| `develop` | Branch de integração — a próxima versão. O trabalho de feature e bugfix entra aqui.                     |

### Branches de vida curta

| Prefixo    | Sai de    | Entra em               | Use para                                                                                      |
| ---------- | --------- | ---------------------- | --------------------------------------------------------------------------------------------- |
| `feature/` | `develop` | `develop`              | Trabalho planejado do backlog: funcionalidade nova, refatoração, docs, testes, tooling, CI    |
| `bugfix/`  | `develop` | `develop`              | Corrigir um bug em `develop` que não precisa de versão urgente                                |
| `release/` | `develop` | `main` **e** `develop` | Preparar uma versão (`release/1.1.0`): número de versão e últimos ajustes, sem features novas |
| `hotfix/`  | `main`    | `main` **e** `develop` | Correção urgente na versão lançada (`hotfix/1.0.1`)                                           |

O prefixo `support/` existe na configuração do Git Flow, mas não é usado.

> 💡 **O prefixo da branch não é o tipo do commit.** O prefixo diz de onde a branch sai e para onde
> vai; o tipo da mudança (`feat`, `refactor`, `docs`…) vai nos commits e no título do PR
> ([seção 2](#2-commits--conventional-commits)). Uma task de refatoração é uma branch `feature/` cujos
> commits começam com `refactor`.

### Nomenclatura

`<prefixo>/<descricao-curta>` — minúsculas, palavras separadas por hífen (kebab-case). Branches de
release e hotfix levam o número da versão.

Exemplos: `feature/error-handler-global`, `feature/documentation-standard-for-contributions`,
`bugfix/boletim-aluno`, `release/1.1.0`, `hotfix/1.0.1`.

### Comandos do dia a dia

```bash
# Uma vez por clone. Responda: branch de produção "main", de desenvolvimento "develop",
# prefixos padrão, e deixe o prefixo de tag de versão VAZIO (a tag existente é "1.0.0").
git flow init

# Comece a partir de um develop atualizado
git switch develop
git pull
git flow feature start error-handler-global     # cria feature/error-handler-global
git flow bugfix start boletim-aluno             # cria bugfix/boletim-aluno

# Publique a branch e abra um pull request para develop
git flow feature publish error-handler-global   # o mesmo que: git push -u origin feature/error-handler-global
```

Sem a ferramenta git-flow, o equivalente é `git switch -c feature/error-handler-global develop`.

> ⚠️ **Não rode `git flow feature finish` nem `git flow bugfix finish`.** Eles fazem o merge em
> `develop` na sua máquina e apagam a branch, pulando a revisão e a CI. Features e bugfixes só chegam
> em `develop` por pull request. Depois do merge do PR, apague a branch e rode `git pull` em
> `develop`.

### Releases e hotfixes

Preparados por quem o time definir para a versão:

1. Crie a branch: `git flow release start 1.1.0` (a partir de `develop`) ou
   `git flow hotfix start 1.0.1` (a partir de `main`).
2. Commite só ajustes de release: números de versão, últimas correções, docs.
3. Abra um pull request para `main` e faça o merge com **Create a merge commit** (nunca squash).
4. Crie a tag da versão no commit de merge — sem prefixo, como a `1.0.0` que já existe:

   ```bash
   git switch main
   git pull
   git tag -a 1.1.0 -m "Release 1.1.0"
   git push origin 1.1.0
   ```

5. Traga a release de volta para `develop` com um pull request de `main` para `develop` (merge
   commit).

A CI (ESLint + Prettier, veja `.github/workflows/`) roda em todo push e pull request para `main` e
`develop`, então os pull requests de release e hotfix também são verificados.

---

## 2. Commits — Conventional Commits

```
<tipo>(<escopo>): <descrição>

[corpo opcional — o "porquê"]

[rodapés opcionais]
```

### Tipos

| Tipo       | Quando usar                                                  |
| ---------- | ------------------------------------------------------------ |
| `feat`     | Funcionalidade nova                                          |
| `fix`      | Correção de bug                                              |
| `refactor` | Muda o código sem mudar o comportamento                      |
| `test`     | Adiciona ou corrige teste                                    |
| `docs`     | Só documentação                                              |
| `chore`    | Build, dependências, configuração                            |
| `ci`       | Workflows de CI (`.github/workflows/`)                       |
| `style`    | Só formatação, sem mudança de lógica (ex.: rodar o Prettier) |

### Escopos sugeridos

O escopo diz **qual parte do sistema** mudou. Prefira um destes:

| Escopo        | Área                                                      |
| ------------- | --------------------------------------------------------- |
| `auth`        | Login, login com Google, JWT, middleware `authenticate`   |
| `usuarios`    | Cadastro, consulta e edição de usuários (todos os perfis) |
| `alunos`      | Funcionalidades do aluno                                  |
| `professores` | Funcionalidades do professor                              |
| `secretaria`  | Funcionalidades da secretaria                             |
| `cursos`      | Cursos                                                    |
| `materias`    | Matérias                                                  |
| `turmas`      | Turmas                                                    |
| `chamada`     | Chamada / frequência                                      |
| `notas`       | Notas e boletim                                           |
| `db`          | Schema do Prisma, migrations, `docker-compose.yml`        |
| `api`         | Assuntos transversais da API (servidor, rotas, CORS)      |
| `front`       | Páginas, scripts e estilos do front-end                   |
| `docs`        | Documentação                                              |
| `ci`          | Workflows de CI                                           |
| `deps`        | Atualização de dependências                               |

O vocabulário do domínio é em português — veja o [glossário](glossary.md).

### Regras

- **Modo imperativo**: "adiciona", "corrige", "remove" (ou, em inglês, "add", "fix") — não
  "adicionado" nem "adicionando".
- Comece a descrição com **letra minúscula** e **não** termine com ponto final.
- A linha de cabeçalho tem **no máximo 72 caracteres**.
- `tipo` e `escopo` são as palavras-chave em inglês acima. A **descrição** pode ser em português ou
  inglês — mas mantenha **um idioma por PR**.
- **Mudança que quebra o contrato HTTP** (o front-end depende dele): coloque `!` depois do
  tipo/escopo e um rodapé `BREAKING CHANGE:` explicando o que o front precisa mudar.
- Vincule issues no rodapé: `Refs: #36` (relacionada) ou `Closes #36` (resolve a issue).

### Exemplos

```
refactor(erros): adiciona error handler global e asyncHandler
fix(notas): corrige boletim do aluno que nunca exibia nota
feat(auth): adiciona middleware de autorização por perfil
docs(contrib): document the contribution standard
ci: fix node-version input in lint workflow
```

Mudança que quebra contrato (exemplo ilustrativo):

```
refactor(auth)!: coloca o perfil do usuário no payload do JWT

BREAKING CHANGE: /login não devolve mais `emailDoBanco`; use `email`.
Refs: #14
```

### Ruim → bom (commits reais deste repositório)

| ❌ Antes                   | ✅ Depois                                                     |
| -------------------------- | ------------------------------------------------------------- |
| `updates`                  | `docs(readme): atualiza os passos de instalação`              |
| `small fix`                | `fix(turmas): mantém o curso selecionado ao editar uma turma` |
| `Adicionando mascaras`     | `feat(front): adiciona máscaras de CPF e telefone`            |
| `more modal implementaton` | `refactor(front): substitui alert() por mensagens em modal`   |

> A coluna "depois" mostra o **formato** de uma boa mensagem; o texto exato depende do que o commit
> original realmente mudou.

---

## 3. Pull requests

- **Um PR = uma task do backlog.** O backlog fica nas
  [issues do GitHub](https://github.com/ftfariasdev/SAGA/issues) — cada título começa com o ID, como
  `[C1]`, `[F1]`, `[S2]`, `[D7]`, `[CI2]`.
- **O sistema tem que funcionar ao fim de cada PR.** Nada de "parte 1 de 3" que deixa a API quebrada.
- **Título** = convenção de commit + ID da task:
  - `refactor(erros): [F1] adiciona error handler global`
  - `docs(contrib): [CI2] document contribution standard`
- **Branch base:** `develop` para branches `feature/` e `bugfix/`; `main` para branches `release/` e
  `hotfix/`, que depois voltam para `develop` ([seção 1](#releases-e-hotfixes)).
- **Descrição:** preencha o template (ele carrega sozinho) e vincule a issue com `Closes #N`.
- **Revisão:** pelo menos **uma aprovação** antes do merge.
- **Estratégia de merge (a combinar com o time):**
  - `feature/` e `bugfix/` → `develop`: **Squash and merge**, usando o título do PR como mensagem do
    commit. Assim o histórico de `develop` segue a convenção. Para comparar: o PR #43 entrou como
    `Feature/config eslint and prettier (#43)` — exatamente o que esta convenção evita.
  - `release/` e `hotfix/` → `main`, e `main` → `develop`: **Create a merge commit**, nunca squash.
    O squash cria commits em `main` que não existem em `develop`, e a próxima release dá conflito.

---

## 4. Antes de abrir um PR

Na **raiz do repositório** (é onde ficam as ferramentas de lint e formatação):

```bash
npm install            # uma vez
npm run lint           # ESLint
npm run format:check   # Prettier
```

Para corrigir automaticamente:

```bash
npm run lint:fix
npm run format
```

> 🪟 **Windows e fim de linha.** Com `core.autocrlf=true`, o git faz checkout dos arquivos com CRLF,
> mas o Prettier espera LF. O `format:check` pode acusar arquivos localmente que passam na CI
> (Linux). Para confirmar que é só fim de linha:
>
> ```bash
> npx prettier --check --end-of-line auto .
> ```

> 🧪 O `npm test` **ainda não está configurado** — o script atual é um placeholder que termina com
> erro. A infraestrutura de testes chega com a
> [[T1] #31](https://github.com/ftfariasdev/SAGA/issues/31).

Teste rápido do backend (dentro de `Back-end/`, configuração no
[guia de ambiente local](local-environment.md)):

```bash
docker compose up -d
npm run dev
curl http://localhost:8081/health
```

---

## 5. Estilo de código e convenções de nomes

Isto descreve o que o repositório **já faz**. Siga para manter a consistência.

### Formatação e lint

- **Prettier** (`.prettierrc`): ponto e vírgula, aspas simples, `printWidth` 100, sem vírgula final.
- **ESLint** (`eslint.config.js`), principais regras:
  - `eqeqeq` — sempre `===` / `!==`.
  - `no-unused-vars` — argumentos não usados só são permitidos se chamados `next` ou com prefixo `_`.
  - `no-console` — só `console.error` e `console.warn`. Scripts de CLI (`server.js`,
    `fixMateria.js`, `sync_professores_turmas.js`) são exceção.
  - `require-await` e `no-return-await`.

### Back-end

- ES Modules (`"type": "module"` no `Back-end/package.json`) — use `import`/`export`.
- Controllers: `src/controller/<dominio>Controller.js`, cada um exportando uma classe.
- Routers: `src/Routes/routes<Dominio>.js`.
- Middlewares: `src/middlewares/`.

### Banco de dados

- Colunas em `snake_case`; chaves com prefixo `id_` (`id_user`, `id_turma`).
- Models do Prisma em `PascalCase`, mapeados para tabelas `snake_case` com `@@map`
  (`ProfessorTurma` → `professor_turma`).

### Idioma do domínio

O vocabulário do domínio é **português** (`aluno`, `turma`, `materia`, `chamada`, `nota`…).
Continue usando-o em identificadores novos e **não traduza nomes existentes** — código meio
traduzido é mais difícil de pesquisar. Veja o [glossário](glossary.md).

### Front-end

Organizado por perfil de usuário: `Front-End/<Perfil>/{Page,Js,Css}` (`Aluno`, `Professor`,
`Secretaria`), com scripts compartilhados em `Front-End/Js/` e estilos compartilhados em
`Front-End/Css Base/`.

---

## 6. Regras de documentação

Todo documento existe em **EN-US e PT-BR**, e os dois são atualizados **no mesmo PR**.

### Onde fica cada idioma

- **EN-US** fica onde o GitHub e as ferramentas procuram: `README.md`, `CONTRIBUTING.md` e
  `CLAUDE.md` na raiz, `Back-end/README.md`, `Front-End/README.md` e `docs/<nome>.md`.
- **PT-BR** fica inteiro em [`docs/pt-BR/`](README.md), para nenhuma pasta listar cada documento duas
  vezes.

| EN-US                                       | PT-BR                                                |
| ------------------------------------------- | ---------------------------------------------------- |
| `docs/<nome>.md`                            | `docs/pt-BR/<nome>.md` (mesmo nome)                  |
| `README.md`, `CONTRIBUTING.md`              | `docs/pt-BR/README.md`, `docs/pt-BR/CONTRIBUTING.md` |
| `Back-end/README.md`, `Front-End/README.md` | `docs/pt-BR/back-end.md`, `docs/pt-BR/front-end.md`  |
| `CLAUDE.md`                                 | `docs/pt-BR/ai-agents.md`                            |

A tradução do `CLAUDE.md` **não** se chama `CLAUDE.md` de propósito: o Claude Code carrega
automaticamente qualquer `CLAUDE.md` que encontra em subpastas e leria o arquivo como um segundo
conjunto de instruções.

### Regras de escrita

- **Maiúsculas e minúsculas:** arquivos especiais do GitHub na raiz ficam em MAIÚSCULAS; os demais
  arquivos de documentação ficam em minúsculas e kebab-case (`local-environment.md`).
- **Seletor de idioma:** a linha logo abaixo do H1 aponta para o outro idioma, por exemplo
  `🌐 [English](../../README.md) | **Português (Brasil)**`.
- **Documentos novos** entram nas tabelas de documentação do
  [README em inglês](../../README.md#all-documents) e do
  [README em português](README.md#todos-os-documentos).
- **Descreva o código como ele é hoje.** Marque o que é planejado como planejado, com link para a
  issue. Ao corrigir um item dos [problemas conhecidos](known-issues.md), remova-o dos dois idiomas.
- **Mudanças na API** atualizam a [referência da API](api-reference.md) (e o
  `docs/openapi.yaml` quando a [[DOC1] #34](https://github.com/ftfariasdev/SAGA/issues/34) entrar).
- **Formatação:** o Prettier verifica o Markdown no CI (`npm run format`). Diagramas Mermaid são
  bem-vindos — o GitHub os renderiza.
- A única exceção à regra dos dois arquivos é o `.github/pull_request_template.md`: o GitHub carrega
  um único template padrão, então ele é bilíngue em um arquivo só.

---

## 7. Segurança básica

- **Nunca commite** `.env`, tokens reais ou senhas reais. O `.env` já está no `.gitignore`;
  registre variáveis novas no `Back-end/.env.example`, sem os valores secretos.
- ⚠️ Os arquivos `Back-end/tests/*.http` hoje contêm JWTs reais — removê-los e rotacionar o segredo
  é a [[C4] #2](https://github.com/ftfariasdev/SAGA/issues/2). Não adicione outros.
- **Nenhuma resposta da API pode devolver `senha`**, nem mesmo em hash.

---

## 8. Automação (o que decidimos não instalar)

`commitlint` + `husky` (validar a mensagem no momento do commit) **não foram instalados de
propósito**. Com parte do time ainda aprendendo, um hook que rejeita commit gera frustração antes de
gerar hábito. Começamos pela convenção escrita; se o time pedir automação depois, a gente adiciona.

---

## 9. Armadilhas

- **Não reescreva o histórico** para "consertar" commits antigos. Custo alto, valor zero.
- **Checklist curto.** Checklist longo vira caixinha marcada sem ler — seis itens é o limite
  prático.
- **Convenção não combinada é convenção ignorada.** Discuta mudanças neste documento com o time
  antes.
