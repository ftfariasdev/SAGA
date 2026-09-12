# Referência da API

🌐 [English](../api-reference.md) | **Português (Brasil)**

> **Documento provisório.** Este é um mapa escrito à mão da API HTTP **como ela se comporta hoje**,
> conferido com `Back-end/src` em 10/09/2026. Ele será substituído pela especificação OpenAPI da
> [[DOC1] #34](https://github.com/ftfariasdev/SAGA/issues/34).
>
> **O contrato está congelado.** O front-end chama estas rotas com URLs fixas no código, então
> caminhos, parâmetros e formatos de resposta — inclusive os estranhos, sinalizados abaixo — não podem
> mudar sem uma task do backlog que autorize explicitamente.

## Índice

1. [Convenções](#1-convenções)
2. [Rotas gerais](#2-rotas-gerais)
3. [Rotas do aluno (`/aluno`)](#3-rotas-do-aluno-aluno)
4. [Rotas do professor (`/prof`, `/professor`)](#4-rotas-do-professor-prof-professor)
5. [Rotas da secretaria (`/sec`)](#5-rotas-da-secretaria-sec)
   - [Cursos](#51-cursos) · [Matérias](#52-matérias) · [Usuários](#53-usuários) ·
     [Turmas](#54-turmas)
6. [Testando a API](#6-testando-a-api)

Legenda: 🔒 exige token · 🌐 pública · ❌ rota quebrada hoje · ⚠️ leia a observação.
Os caminhos em "Usado por" são relativos a `Front-End/`; "—" significa que nenhuma tela chama a rota.

---

## 1. Convenções

### URL base

`http://localhost:8081` — a porta vem do `PORT` em `Back-end/.env`, e o front-end tem `8081` fixo no
código.

O CORS só libera a origem `http://127.0.0.1:5500` (`Back-end/server.js:19`). Ferramentas como curl
ou REST Client não são afetadas.

### Autenticação

- Pegue um token em `POST /login` (ou `POST /login/google`) e envie como
  `Authorization: Bearer <token>`.
- Os tokens são JWTs assinados com `JWT_SECRET`. O payload é só `{ userId }`, e eles valem por
  **10 horas**. Não existe endpoint de refresh nem de logout — o front-end apenas apaga o token do
  `localStorage`.
- ⚠️ O middleware `tokenAuthenticate` só verifica se o token é válido. **Nenhuma rota confere o
  perfil do usuário** — qualquer aluno logado consegue chamar `/sec/*`. Veja
  [[S1] #14](https://github.com/ftfariasdev/SAGA/issues/14) e
  [[S2] #15](https://github.com/ftfariasdev/SAGA/issues/15).

Os erros do middleware são todos `401` com a chave `error`: cabeçalho ausente, cabeçalho fora do
formato `Bearer <token>` ou token inválido/expirado (este acrescenta `detalhes`).

### Tipos de usuário (`user.tipo`)

| `tipo` | Significado                                  |
| ------ | -------------------------------------------- |
| `0`    | Criado automaticamente pelo login com Google |
| `1`    | Secretaria                                   |
| `2`    | Professor                                    |
| `3`    | Aluno                                        |

Esses valores já estão gravados no banco — nunca os renumere.

### Requisições

- Corpo em JSON (`Content-Type: application/json`) de até **50 MB** (`server.js:28`) — as fotos de
  perfil trafegam como texto base64 em `ft_perfil`.
- Os IDs (`id_user`, `id_turma`, …) são strings UUID. `codigo` e `matricula` são inteiros
  autoincrementais.
- Datas no corpo são strings ISO 8601 (`2000-01-15T00:00:00.000Z`). O parâmetro de query `data` usa
  `AAAA-MM-DD`.

### Respostas e erros

Ainda não existe um tratador de erros global
([[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3)), então cada handler monta seu próprio corpo
de erro:

| Chave                  | Onde aparece                                                  |
| ---------------------- | ------------------------------------------------------------- |
| `erro` (+ `detalhes`)  | Handlers de aluno, de professor e a maioria dos da secretaria |
| `error` (+ `detalhes`) | Login, cadastro de usuários e matérias                        |
| `message` (+ `error`)  | `/info`, `/editarInfo`, edição de curso e exclusão de usuário |

`detalhes` e `error` costumam trazer a mensagem de erro interna crua (inclusive erros do Prisma) —
não mostre isso ao usuário final.

| Status | Significado nesta API                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `200`  | Sucesso. **Também usado em algumas falhas de validação**: as rotas de cadastro respondem `200 { error: 'Email já cadastrado' }` |
| `201`  | Criado — só `POST /sec/Turma/cadastrar` e `POST /sec/vicularProfessor`                                                          |
| `204`  | Sucesso em algumas rotas PUT/DELETE. O Express descarta o JSON que o handler tenta enviar                                       |
| `400`  | Entrada ausente/inválida, ou violação de restrição única (Prisma `P2002`)                                                       |
| `401`  | Token ausente ou inválido, ou credenciais erradas                                                                               |
| `403`  | Professor não vinculado à turma ou à matéria                                                                                    |
| `404`  | Registro não encontrado                                                                                                         |
| `500`  | Erro inesperado. Rotas cujo handler não existe respondem com a página de erro **HTML** padrão do Express                        |

⚠️ **Handlers sem `try/catch`** estão indicados nas observações. Um erro de banco dentro deles vira
uma promise rejeitada sem tratamento, o que no Node ≥ 15 **derruba o processo da API**
([[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3)).

---

## 2. Rotas gerais

Definidas em `Back-end/src/Routes/routesGeral.js`.

| Método | Caminho          | Auth  | Handler                       | Entrada                                                             | Sucesso                                                                    | Usado por                                                                                                                                                                       |
| ------ | ---------------- | ----- | ----------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/login`         | 🌐    | `LoginController.auth`        | corpo `{ email, senha }`                                            | `200 { token, tipo, id_user, nome, emailDoBanco, ft_perfil }`              | `Login/Js/login.js`                                                                                                                                                             |
| POST   | `/login/google`  | 🌐 ⚠️ | `LoginController.authGoogle`  | corpo `{ id_token }`                                                | `200`, mesmo formato de `/login`                                           | `Login/Js/login.js`                                                                                                                                                             |
| GET    | `/token`         | 🔒    | inline                        | —                                                                   | `200 { message, userId, timestamp }`                                       | `Js/verificaToken.js`, `Secretaria/Js/editarInfo.js`                                                                                                                            |
| GET    | `/health`        | 🌐 ⚠️ | inline                        | —                                                                   | `200 { status: "UP", timestamp, version: "1.0.0" }`                        | `Login/Js/login.js`                                                                                                                                                             |
| GET    | `/info/:id_user` | 🔒 ⚠️ | `commonController.info`       | caminho `id_user`                                                   | `200 { id_user, matricula, cpf, nome, email, dt_nasc, telefone }`          | `Js/menu.js`, `Aluno/Js/homeAlu.js`, `Aluno/Js/infoAluno.js`, `Professor/Js/homeProf.js`, `Professor/Js/infoProf.js`, `Secretaria/Js/infoSec.js`, `Secretaria/Js/editarInfo.js` |
| PUT    | `/editarInfo`    | 🔒 ⚠️ | `commonController.editarInfo` | corpo `{ id_user, nome?, email?, dt_nasc?, telefone?, ft_perfil? }` | `200 { message, user: { id_user, nome, email, dt_nasc, telefone, tipo } }` | `Secretaria/Js/editarInfo.js`                                                                                                                                                   |

**Observações**

- **`POST /login`** — `401 { error }` quando o e-mail não está cadastrado ("Cadastro não existe…") ou
  a senha está errada. O e-mail volta como **`emailDoBanco`**, não `email`. ⚠️ Sem `try/catch`: um
  erro de banco derruba a API.
- **`POST /login/google`** — valida o ID token do Google contra `GOOGLE_CLIENT_ID`. `400` se faltar
  `id_token`, `401` se ele for inválido. ⚠️ Se nenhum usuário tiver aquele e-mail, **é criado um
  usuário novo com `tipo: 0`** (com `cpf`/`telefone` provisórios `google_<timestamp>`), que recebe um
  token válido ([[S5] #18](https://github.com/ftfariasdev/SAGA/issues/18)). A busca e a criação no
  banco depois da validação do token não têm `try/catch`.
- **`GET /health`** — `server.js:33` define um segundo `/health` (`{ status: "OK", message }`), mas
  ele nunca é alcançado porque o `routerGeral` é registrado antes. A resposta da tabela é a real
  ([[F3] #5](https://github.com/ftfariasdev/SAGA/issues/5)).
- **`GET /info/:id_user`** — ⚠️ qualquer usuário logado lê o CPF, o telefone e a data de nascimento
  de qualquer outro ([[S4] #17](https://github.com/ftfariasdev/SAGA/issues/17)). `404 { message }`.
  O handler também envia `turma: user.turma`, que é sempre `undefined`, então essa chave nunca
  aparece.
- **`PUT /editarInfo`** — ⚠️ o usuário editado vem do **corpo** (`id_user`), não do token, então
  qualquer pessoa logada edita qualquer outra
  ([[S4] #17](https://github.com/ftfariasdev/SAGA/issues/17)). `400` quando falta `id_user`, quando
  `dt_nasc` é inválida ou quando o telefone/e-mail já pertence a outro usuário; `404` quando o
  usuário não existe. Fora de produção, a resposta `500` inclui o `stack` do erro.

---

## 3. Rotas do aluno (`/aluno`)

Definidas em `Back-end/src/Routes/routesAluno.js`. Todos os handlers identificam o aluno pelo token
(`req.userId`); nenhum recebe ID de usuário.

| Método | Caminho                     | Auth  | Handler                               | Entrada                 | Sucesso                                                                                           | Usado por             |
| ------ | --------------------------- | ----- | ------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- | --------------------- |
| GET    | `/aluno/listMateria`        | 🔒    | `AlunoController.listInfoCurso`       | —                       | `200 [{ materia, cargaHoraria, professor }]`                                                      | `Aluno/Js/curso.js`   |
| GET    | `/aluno/modulo/:modulo`     | 🔒 ⚠️ | `AlunoController.listModuloInfo`      | caminho `modulo`        | `200 { curso, turma, modulo, materias: [{ nome, codigo, descricao, ch_total, notaB1, notaB2 }] }` | —                     |
| GET    | `/aluno/bimestre/:bimestre` | 🔒 ❌ | `AlunoController.listBimestreInfo`    | caminho `bimestre`      | sempre `500` (o handler não existe)                                                               | `Aluno/Js/boletim.js` |
| GET    | `/aluno/frequencia`         | 🔒    | `AlunoController.getFrequenciaByData` | query `data=AAAA-MM-DD` | `200 { data, presente }`                                                                          | —                     |
| GET    | `/aluno/frequencia-geral`   | 🔒 ❌ | `AlunoController.getFrequenciaGeral`  | —                       | sempre `500` (o handler não existe)                                                               | —                     |
| GET    | `/aluno/presencas-dia`      | 🔒 ⚠️ | `AlunoController.getPresencasByDia`   | query `data=AAAA-MM-DD` | `200 [{ materia, professor, presente }]`                                                          | `Aluno/Js/freq2.js`   |

**Observações**

- ❌ **`listBimestreInfo` e `getFrequenciaGeral` não existem** no `AlunoController`. A função da rota
  lança um `TypeError` e o Express responde `500` com sua página de erro em HTML. É por isso que o
  boletim do aluno (`boletim.html`) nunca mostra notas
  ([[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)).
- **`/aluno/listMateria`** — matérias do curso do aluno. `professor` é o nome do professor ou
  `"Não definido"`. `404 { erro }` quando o aluno não tem turma ou curso.
- **`/aluno/modulo/:modulo`** — mantém só as matérias cujo `codigo` **começa com** `modulo` (`1` pega
  `1`, `10`, `11`…). ⚠️ `notaB1`/`notaB2` procuram notas com `tipo_avaliacao` `"B1"`/`"B2"`, mas a tela
  do professor sempre grava `"Prova"`, então as duas voltam como `"-"`. `404` quando nenhuma matéria
  corresponde.
- **`/aluno/frequencia`** — `400` quando `data` falta ou é inválida; `404` quando o aluno não tem
  turma, não houve chamada no dia ou não há registro de presença. O dia é calculado no **fuso
  horário local do servidor** (`startOfDay`/`endOfDay` do `date-fns`).
- **`/aluno/presencas-dia`** — um item por chamada naquele dia (dia em UTC). ⚠️ A chamada não guarda a
  matéria, então `materia` é a **primeira** matéria do professor e pode estar errada. `presente` é
  `false` quando não há registro. `404` quando não houve chamada
  ([[D6] #28](https://github.com/ftfariasdev/SAGA/issues/28)).

---

## 4. Rotas do professor (`/prof`, `/professor`)

Definidas em `Back-end/src/Routes/routesProf.js`. Todos os handlers encontram o professor pelo token
(`req.userId`) e respondem `404 { erro: 'Professor não encontrado.' }` quando o usuário logado não é
professor. As rotas ligadas a uma turma respondem `403` quando o professor não está vinculado a ela em
`professor_turma`.

| Método | Caminho                        | Auth  | Handler                                 | Entrada                                     | Sucesso                                                                    | Usado por                                                                                                    |
| ------ | ------------------------------ | ----- | --------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| GET    | `/prof/turmas/:id_professor`   | 🔒 ⚠️ | `ProfController.listarTurmasProf`       | caminho `id_professor` (ignorado)           | `200` lista de turmas, cada uma com `curso`                                | `Professor/Js/Chamada.js`, `Professor/Js/lancamento.js`, `Professor/Js/turma.js`                             |
| GET    | `/prof/materias/:id_professor` | 🔒    | `ProfController.materiasProf`           | caminho `id_professor`                      | `200` lista de matérias com `curso: { nome, codigo }`, ordenada por `nome` | `Professor/Js/Chamada.js`, `Professor/Js/lancamento.js`                                                      |
| GET    | `/prof/alunos/:id_turma`       | 🔒 ⚠️ | `ProfController.listarAlunosTurma`      | caminho `id_turma`                          | `200 [{ id_aluno, ...user }]`                                              | `Professor/Js/chamada2.js`                                                                                   |
| GET    | `/prof/alunos-turma/:id_turma` | 🔒 ⚠️ | `ProfController.listarAlunosTurma`      | caminho `id_turma`                          | igual à anterior                                                           | `Professor/Js/lancamento.js`                                                                                 |
| POST   | `/prof/chamada`                | 🔒 ⚠️ | `ProfController.realizarChamada`        | corpo, veja as observações                  | `200 { mensagem, resultados: [{ id_aluno, presente }] }`                   | `Professor/Js/chamada2.js`                                                                                   |
| GET    | `/prof/chamada/:id_turma`      | 🔒 ❌ | `ProfController.listarChamada`          | caminho `id_turma`                          | sempre `500`                                                               | —                                                                                                            |
| GET    | `/prof/chamada/:id_turma/data` | 🔒 ⚠️ | `ProfController.buscarChamadaPorData`   | caminho `id_turma`, query `data=AAAA-MM-DD` | `200` registro da chamada com `presencas[].aluno.user`                     | `Professor/Js/chamada2.js`                                                                                   |
| POST   | `/prof/lancarNotas`            | 🔒 ⚠️ | `ProfController.lancarNotas`            | corpo, veja as observações                  | `200 { mensagem, resultados: [{ id_aluno, valor }] }`                      | `Professor/Js/lancamento.js`                                                                                 |
| GET    | `/professor/user/:id_user`     | 🔒 ⚠️ | `ProfController.buscarProfessorPorUser` | caminho `id_user` (ignorado)                | `200 { id_professor, id_user }`                                            | `Professor/Js/Chamada.js`, `Professor/Js/chamada2.js`, `Professor/Js/lancamento.js`, `Professor/Js/turma.js` |

**Observações**

- **Parâmetros de caminho ignorados.** `/prof/turmas/:id_professor` e `/professor/user/:id_user`
  sempre respondem pelo usuário logado; o valor da URL nunca é lido. Continue enviando — ele faz parte
  do contrato ([[M7] #21](https://github.com/ftfariasdev/SAGA/issues/21)).
- **`/prof/materias/:id_professor`** lê o parâmetro, sim, e responde
  `403 { erro: 'Acesso negado a este professor.' }` quando aquele professor não é o usuário logado.
- **`/prof/alunos/:id_turma`** e **`/prof/alunos-turma/:id_turma`** executam o mesmo handler. ⚠️ Cada
  item espalha a linha inteira de `user`, **inclusive o hash da `senha`**.
- Corpo de **`POST /prof/chamada`**:

  ```json
  {
    "id_turma": "uuid",
    "data": "2026-09-10",
    "presencas": [{ "id_aluno": "uuid", "presente": true }]
  }
  ```

  `400` quando falta `id_turma`, `data` ou a lista `presencas`, ou quando um item não é
  `{ id_aluno: string, presente: boolean }`. A chamada é buscada pelo timestamp **exato**
  `new Date(data)` e criada se não existir; depois cada presença é atualizada ou criada. ⚠️ Os itens
  são validados um a um, então um item inválido no meio deixa os anteriores já gravados.

- ❌ **`GET /prof/chamada/:id_turma`** inclui as relações `aluno` e `materia`, que `Chamada` não tem,
  então o Prisma rejeita a consulta sempre. Nenhuma tela usa essa rota.
- **`GET /prof/chamada/:id_turma/data`** — busca o dia em UTC (de `T00:00:00.000Z` a
  `T23:59:59.999Z`). `400` sem `data`, `404` quando não houve chamada. ⚠️ `presencas[].aluno.user` é
  a linha completa do usuário, **inclusive a `senha`**.
- Corpo de **`POST /prof/lancarNotas`**:

  ```json
  {
    "id_turma": "uuid",
    "id_materia": "uuid",
    "tipo_avaliacao": "Prova",
    "bimestre": "1º Bimestre",
    "notas": [{ "id_aluno": "uuid", "valor": 8.5 }]
  }
  ```

  `400` quando falta um campo, quando um item não é `{ id_aluno: string, valor: number }` ou quando
  `valor` está fora de 0–10. `403` quando o professor não está vinculado à turma ou não é o `id_prof`
  da matéria. ⚠️ Cada chamada **cria** uma `nota` + uma `nota_aluno` por aluno — nada é atualizado,
  então enviar duas vezes duplica as notas (apesar da mensagem "lançadas/atualizadas"). Mesmo
  comportamento de gravação parcial da chamada
  ([[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)).

---

## 5. Rotas da secretaria (`/sec`)

Definidas em `Back-end/src/Routes/routesSec.js`. Elas foram feitas para a secretaria, mas qualquer
token válido é aceito ([[S2] #15](https://github.com/ftfariasdev/SAGA/issues/15)).

### 5.1 Cursos

| Método | Caminho                       | Auth  | Handler                      | Entrada                                                  | Sucesso                                       | Usado por                                                                                                                                                                                                                                   |
| ------ | ----------------------------- | ----- | ---------------------------- | -------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/sec/curso`                  | 🔒 ⚠️ | `SecController.cadCurso`     | corpo `{ nome, periodo, descricao, ch_total, freq_min }` | `200` registro do curso                       | `Secretaria/Js/cadastroCurso.js`                                                                                                                                                                                                            |
| GET    | `/sec/listarCursos`           | 🔒 ⚠️ | `SecController.listarCursos` | —                                                        | `200` lista de cursos, cada um com `materias` | `Secretaria/Js/cadastrarTurma.js`, `Secretaria/Js/cadastroMateria.js`, `Secretaria/Js/editarCurso.js`, `Secretaria/Js/editarMateria.js`, `Secretaria/Js/editarTurma.js`, `Secretaria/Js/ListarCursos.js`, `Secretaria/Js/ListarMaterias.js` |
| PUT    | `/sec/editarCurso/:id_curso`  | 🔒 ⚠️ | `SecController.editarCurso`  | caminho `id_curso`, corpo igual ao do cadastro           | `204` (sem corpo)                             | `Secretaria/Js/editarCurso.js`                                                                                                                                                                                                              |
| DELETE | `/sec/excluirCurso/:id_curso` | 🔒 ⚠️ | `SecController.excluirCurso` | caminho `id_curso`                                       | `204`                                         | `Secretaria/Js/ListarCursos.js`                                                                                                                                                                                                             |

**Observações**

- ⚠️ Nenhum dos quatro handlers tem `try/catch`. Editar um curso que não existe, ou excluir um que
  ainda tem matérias ou turmas, lança um erro do Prisma que **derruba a API** em vez de responder
  404/409. O ramo `404 { message: 'Curso não encontrado!' }` de `editarCurso` é inalcançável.
- `ch_total` e `freq_min` são strings.

### 5.2 Matérias

| Método | Caminho                           | Auth  | Handler                        | Entrada                                                                       | Sucesso                                                                                     | Usado por                                                           |
| ------ | --------------------------------- | ----- | ------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| POST   | `/sec/materia/:id_curso`          | 🔒 ⚠️ | `SecController.cadMateria`     | caminho `id_curso`, corpo `{ nome, descricao, ch_total, freq_min, id_prof? }` | `200` registro da matéria                                                                   | `Secretaria/Js/cadastroMateria.js`                                  |
| GET    | `/sec/listarMaterias/:id_curso`   | 🔒    | `SecController.listarMaterias` | caminho `id_curso`                                                            | `200` lista de matérias com `professor.user: { id_user, nome, email, ft_perfil, telefone }` | `Secretaria/Js/editarMateria.js`, `Secretaria/Js/ListarMaterias.js` |
| PUT    | `/sec/editarMateria/:id_materia`  | 🔒 ⚠️ | `SecController.editarMateria`  | caminho `id_materia`, corpo igual ao do cadastro                              | `200` registro da matéria                                                                   | `Secretaria/Js/editarMateria.js`                                    |
| DELETE | `/sec/excluirMateria/:id_materia` | 🔒 ⚠️ | `SecController.excluirMateria` | caminho `id_materia`                                                          | `204`                                                                                       | `Secretaria/Js/ListarMaterias.js`                                   |

**Observações**

- `id_prof` é um **`id_professor`**, não um `id_user`. Quando enviado, o professor também é vinculado
  (`professor_turma`) a **todas as turmas do curso**. Erros:
  `500 { error: 'Erro ao cadastrar matéria. <mensagem>' }`.
- ⚠️ **`editarMateria`: omitir `id_prof` remove o professor** da matéria. Se ele não tiver mais
  nenhuma outra matéria, os vínculos dele com as turmas deste curso também são apagados.
  `404 { message }` quando a matéria não existe. Toda essa sincronização existe porque cada matéria
  tem um único professor, global ([[D3] #24](https://github.com/ftfariasdev/SAGA/issues/24)).
- ⚠️ `excluirMateria` não tem `try/catch`: excluir uma matéria que já tem notas derruba a API.

### 5.3 Usuários

| Método | Caminho                                         | Auth  | Handler                                         | Entrada                                                                                 | Sucesso                                                                                               | Usado por                                                            |
| ------ | ----------------------------------------------- | ----- | ----------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| POST   | `/sec/cad`                                      | 🔒 ⚠️ | `SecController.criarUsuario`                    | corpo `{ nome, email, senha, dt_nasc, telefone, cpf, ft_perfil, tipo }`                 | `200 { message }`                                                                                     | —                                                                    |
| POST   | `/sec/cadAluno`                                 | 🔒 ⚠️ | `SecController.cadAluno`                        | corpo `{ nome, email, senha, dt_nasc, telefone, cpf, ft_perfil, id_turma }`             | `200 { message }`                                                                                     | `Secretaria/Js/cadastro.js`                                          |
| POST   | `/sec/cadProfessor`                             | 🔒 ⚠️ | `SecController.cadProfessor`                    | corpo `{ nome, email, senha, dt_nasc, telefone, cpf, ft_perfil }`                       | `200 { message }`                                                                                     | `Secretaria/Js/cadastro.js`                                          |
| POST   | `/sec/cadSecretaria`                            | 🌐 ⚠️ | `SecController.cadSecretaria`                   | corpo igual ao de `cadProfessor`                                                        | `200 { message }`                                                                                     | `Secretaria/Js/cadastro.js`                                          |
| GET    | `/sec/listarUsuarios`                           | 🔒    | `SecController.listarUsuarios`                  | —                                                                                       | `200 [{ id_user, matricula, nome, email, dt_nasc, telefone, cpf, ft_perfil, tipo }]`                  | `Secretaria/Js/ListarUsuarios.js`                                    |
| PUT    | `/sec/editarUsuario/:id_user`                   | 🔒 ⚠️ | `SecController.editarUsuario`                   | caminho `id_user`, corpo `{ nome, email, dt_nasc, telefone, senha?, cpf?, ft_perfil? }` | `200` registro completo do usuário                                                                    | `Secretaria/Js/editarCad.js`                                         |
| DELETE | `/sec/excluirUsuario/:id_user`                  | 🔒 ⚠️ | `SecController.excluirUsuario`                  | caminho `id_user`                                                                       | `200 { message }`                                                                                     | `Secretaria/Js/ListarUsuarios.js`                                    |
| GET    | `/sec/consultarUsuario/:id_user`                | 🔒    | `SecController.consultarUsuario`                | caminho: um `id_user`, `id_professor`, `id_aluno` ou `id_secretaria`                    | `200 { nome, email, dt_nasc, telefone, cpf, ft_perfil, tipo, id_professor, id_aluno, id_secretaria }` | `Secretaria/Js/editarCad.js`                                         |
| GET    | `/sec/consultarAluno/:id_user`                  | 🔒    | `SecController.consultarAluno`                  | caminho `id_user`                                                                       | `200` registro do aluno com `turma`                                                                   | `Secretaria/Js/editarCad.js`                                         |
| GET    | `/sec/consultarProfessor/:id_user`              | 🔒    | `SecController.consultarProfessor`              | caminho `id_user`                                                                       | `200 { id_professor, id_user }`                                                                       | `Secretaria/Js/editarCad.js`                                         |
| GET    | `/sec/consultarSecretaria/:id_user`             | 🔒    | `SecController.consultarSecretaria`             | caminho `id_user`                                                                       | `200 { id_secretaria, id_user }`                                                                      | `Secretaria/Js/editarCad.js`                                         |
| PUT    | `/sec/atualizarTurmaAluno/:id_user`             | 🔒    | `SecController.atualizarTurmaAluno`             | caminho `id_user`, corpo `{ id_turma }`                                                 | `200` registro do aluno                                                                               | `Secretaria/Js/editarCad.js`                                         |
| PUT    | `/sec/atualizarEspecialidadeProfessor/:id_user` | 🔒 ❌ | `SecController.atualizarEspecialidadeProfessor` | caminho `id_user`, corpo `{ especialidade }`                                            | sempre `500` depois de encontrar o professor                                                          | `Secretaria/Js/editarCad.js`                                         |
| PUT    | `/sec/atualizarSetorSecretaria/:id_user`        | 🔒 ❌ | `SecController.atualizarSetorSecretaria`        | caminho `id_user`, corpo `{ setor }`                                                    | sempre `500` depois de encontrar a secretaria                                                         | `Secretaria/Js/editarCad.js`                                         |
| GET    | `/sec/listarTurmasProfessor/:id_user`           | 🔒    | `SecController.listarTurmasProfessor`           | caminho `id_user`                                                                       | `200` lista de turmas com `curso`                                                                     | —                                                                    |
| PUT    | `/sec/atualizarTurmasProfessor/:id_user`        | 🔒 ⚠️ | `SecController.atualizarTurmasProfessor`        | caminho `id_user`, corpo `{ turmas: [id_turma, …] }`                                    | `200 { mensagem }`                                                                                    | `Secretaria/Js/editarCad.js`                                         |
| GET    | `/sec/listarProfessores`                        | 🔒    | `SecController.listarProfessores`               | —                                                                                       | `200 [{ id_professor, nome, email }]`                                                                 | `Secretaria/Js/cadastroMateria.js`, `Secretaria/Js/editarMateria.js` |

**Observações**

- ⚠️ **`POST /sec/cadSecretaria` é pública.** É assim que o primeiro usuário é criado num banco vazio
  (veja o [ambiente local](local-environment.md)) — e também um jeito de qualquer pessoa criar
  uma conta de secretaria ([[C1] #1](https://github.com/ftfariasdev/SAGA/issues/1)).
- **Rotas de cadastro (`cadAluno`, `cadProfessor`, `cadSecretaria`)** criam a linha em `user` (`tipo`
  3, 2 ou 1) e depois a linha do perfil, **sem transação**
  ([[D5a] #26](https://github.com/ftfariasdev/SAGA/issues/26)). ⚠️ E-mail, telefone ou CPF duplicado
  responde **HTTP 200** com `{ error: 'Email já cadastrado' }` (ou `Telefone`/`CPF`) — confira o
  corpo, não só o status. Uma corrida na restrição única responde `400 { error }`; outras falhas,
  `500 { error, detalhes }`. As verificações de duplicidade e o hash da senha rodam fora do
  `try/catch`.
- **`POST /sec/cad`** cria só uma linha em `user`, com o `tipo` que for enviado, sem perfil de aluno,
  professor ou secretaria. E-mail duplicado → `200 { error }`. Sem `try/catch`. Não é usada pelo
  front-end.
- **`PUT /sec/editarUsuario/:id_user`** — `nome`, `email`, `telefone` e `dt_nasc` são sempre
  gravados; omitir `dt_nasc` gera uma data inválida e um `500`. A `senha` é refeita com hash quando
  enviada. ⚠️ A resposta é o registro inteiro do usuário, **inclusive o hash da `senha`**.
  `404 { erro }`.
- **`DELETE /sec/excluirUsuario/:id_user`** — para um aluno, apaga antes todas as presenças e notas
  dele; para um professor, os vínculos com turmas; depois a linha do perfil e o usuário. ⚠️ Não é
  transacional nem reversível. `404 { message }`. Se uma chave estrangeira ainda impedir a exclusão —
  um professor que já fez alguma chamada ou lançou notas, já que `chamada` e `nota` referenciam o
  professor com `ON DELETE RESTRICT` — responde `500 { message, constraint, error }` depois que as
  exclusões anteriores já aconteceram.
- **`consultarUsuario`** tenta o ID como `id_user`, depois como `id_professor`, `id_aluno` e
  `id_secretaria` ([[M7] #21](https://github.com/ftfariasdev/SAGA/issues/21)). `404 { erro }`.
- ❌ **`atualizarEspecialidadeProfessor` e `atualizarSetorSecretaria`** gravam colunas
  (`especialidade`, `setor`) que não existem no `schema.prisma`, então sempre falham com `500` depois
  de encontrar o perfil (`404` caso contrário).
- ⚠️ **`atualizarTurmasProfessor`** apaga todos os vínculos do professor com turmas e depois os recria
  a partir de `turmas`, sem transação — se o segundo passo falhar, o professor fica sem nenhuma turma.

### 5.4 Turmas

| Método | Caminho                                               | Auth  | Handler                                | Entrada                                                                        | Sucesso                                                                                                                            | Usado por                                                                                                                  |
| ------ | ----------------------------------------------------- | ----- | -------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/sec/Turma/cadastrar`                                | 🔒    | `SecController.cadTurma`               | corpo `{ nome, dt_inicio, semestres, id_curso, id_professor? }`                | `201` registro da turma                                                                                                            | `Secretaria/Js/cadastrarTurma.js`                                                                                          |
| GET    | `/sec/Turma/listar`                                   | 🔒    | `SecController.listarTurmas`           | —                                                                              | `200` lista de turmas com `curso`, `alunos` (linhas de aluno) e `professoresRelation[].professor.user: { nome, email, ft_perfil }` | `Secretaria/Js/cadastro.js`, `Secretaria/Js/editarCad.js`, `Secretaria/Js/editarTurma.js`, `Secretaria/Js/ListarTurmas.js` |
| PUT    | `/sec/Turma/editar/:id`                               | 🔒    | `SecController.editarTurma`            | caminho `id` (um `id_turma`), corpo `{ nome, dt_inicio, semestres, id_curso }` | `200` registro da turma                                                                                                            | `Secretaria/Js/editarTurma.js`                                                                                             |
| DELETE | `/sec/Turma/deletar/:id`                              | 🔒 ⚠️ | `SecController.delTurma`               | caminho `id` (um `id_turma`)                                                   | `204`                                                                                                                              | `Secretaria/Js/ListarTurmas.js`                                                                                            |
| GET    | `/sec/Turma/consultar/:id_turma`                      | 🔒    | `SecController.consultarTurma`         | caminho `id_turma`                                                             | `200`, veja as observações                                                                                                         | `Secretaria/Js/ConsultarTurma.js`                                                                                          |
| DELETE | `/sec/Turma/removerAluno/:id_aluno`                   | 🔒 ⚠️ | `SecController.removerAlunoTurma`      | caminho `id_aluno`                                                             | `200 { mensagem, id_user, nome }`                                                                                                  | `Secretaria/Js/ConsultarTurma.js`                                                                                          |
| DELETE | `/sec/Turma/removerProfessor/:id_professor/:id_turma` | 🔒    | `SecController.removerProfessorTurma`  | caminho `id_professor`, `id_turma`                                             | `200 { mensagem, id_professor, id_turma }`                                                                                         | `Secretaria/Js/ConsultarTurma.js`                                                                                          |
| POST   | `/sec/vicularProfessor`                               | 🔒 ⚠️ | `SecController.vincularProfessorTurma` | corpo `{ id_professor, id_turma }`                                             | `201` registro do vínculo                                                                                                          | —                                                                                                                          |

**Observações**

- **`GET /sec/Turma/consultar/:id_turma`** reorganiza os dados para o front-end. `404 { erro }`
  quando a turma não existe.

  ```text
  {
    id_turma, codigo, nome, dt_inicio, semestres,
    curso: { id_curso, nome, codigo, periodo, descricao, ch_total, freq_min },
    professores: [{ id_professor, id_user, nome, email, telefone, foto }],
    alunos: [{ id_aluno, id_user, matricula, nome, email, telefone, data_nascimento, foto }],
    total_alunos, total_professores
  }
  ```

- ⚠️ **`DELETE /sec/Turma/deletar/:id`** apaga as **linhas de `aluno` de todos os alunos da turma**
  (e os vínculos de professores) antes de excluir a turma, sem transação. O banco não exige isso —
  `aluno.id_turma` é `ON DELETE SET NULL`. Se algum aluno já tiver notas ou presenças, as chaves
  estrangeiras `RESTRICT` fazem a operação falhar e nada é apagado. Em caso de falha, responde
  `400 { error: <objeto de erro do Prisma> }`
  ([[D4] #25](https://github.com/ftfariasdev/SAGA/issues/25)).
- ⚠️ **`DELETE /sec/Turma/removerAluno/:id_aluno`** apaga a linha de `aluno` em vez de só desvincular
  a turma; o `user` fica sem perfil de aluno
  ([[D4] #25](https://github.com/ftfariasdev/SAGA/issues/25)). Um aluno com notas ou presenças não
  pode ser removido (`500`, `ON DELETE RESTRICT`). `404 { erro }` quando o aluno não existe.
- **`removerProfessorTurma`** — `404 { erro }` quando o vínculo não existe.
- **`cadTurma`** com `id_professor` também cria o vínculo professor–turma. **`editarTurma`** responde
  `404 { erro }` quando a turma não existe; `id_curso` é obrigatório.
- ⚠️ **`POST /sec/vicularProfessor`** — o erro de digitação no caminho ("vicular") faz parte do
  contrato; não corrija sem uma task. Não existe restrição única em `professor_turma`, então enviar o
  mesmo par duas vezes cria um vínculo duplicado.

---

## 6. Testando a API

### Arquivos do REST Client

`Back-end/tests/routesAluno.http`, `routesProf.http` e `routesSec.http` têm requisições prontas. Abra
no VS Code com a extensão **REST Client** e clique em **Send Request** acima de cada bloco.

> ⚠️ Esses arquivos contêm JWTs fixos e senhas em texto puro do desenvolvimento anterior
> ([[C4] #2](https://github.com/ftfariasdev/SAGA/issues/2)). Não acrescente novos: faça login, cole o
> token localmente e não faça commit dele. Os tokens expiram em 10 horas e só funcionam com o segredo
> que os assinou.

### curl (macOS, Linux, Git Bash)

Usa o usuário inicial do [guia do ambiente local](local-environment.md):

```bash
TOKEN=$(curl -s -X POST http://localhost:8081/login \
  -H "Content-Type: application/json" \
  -d '{"email":"secretaria@saga.local","senha":"senha123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0, "utf8")).token')

curl http://localhost:8081/sec/listarCursos -H "Authorization: Bearer $TOKEN"
```

### PowerShell (Windows)

```powershell
$login = Invoke-RestMethod -Uri http://localhost:8081/login -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"secretaria@saga.local","senha":"senha123"}'

Invoke-RestMethod -Uri http://localhost:8081/sec/listarCursos `
  -Headers @{ Authorization = "Bearer $($login.token)" }
```

---

**Veja também:** [Arquitetura](architecture.md) · [Banco de dados](database.md) ·
[Problemas conhecidos](known-issues.md) · [Glossário](glossary.md) ·
[Índice da documentação](README.md#documentação)
