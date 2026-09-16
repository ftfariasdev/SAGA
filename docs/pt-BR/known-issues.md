# Problemas conhecidos

🌐 [English](../known-issues.md) | **Português (Brasil)**

Uma lista honesta dos defeitos e da dívida técnica encontrados lendo o código — para que quem chega
não seja pego de surpresa nem construa em cima deles.

> Conferido com o código em 10/09/2026. Os números de linha mudam conforme o código evolui: se algum
> não bater, procure pelo trecho citado. A maioria dos itens já tem uma task no
> [backlog](https://github.com/ftfariasdev/SAGA/issues).

## Índice

- [🔴 Segurança](#-segurança)
- [🟠 Integridade dos dados](#-integridade-dos-dados)
- [🟡 Bugs](#-bugs)
- [🔧 Ferramentas, CI e DX](#-ferramentas-ci-e-dx)
- [🧹 Dívida técnica e limpeza](#-dívida-técnica-e-limpeza)
- [🎨 Front-end](#-front-end)
- [Como usar esta lista](#como-usar-esta-lista)

---

## 🔴 Segurança

### Cadastro de secretaria público

- **O que acontece:** `POST /sec/cadSecretaria` é registrada sem `tokenAuthenticate`
  (`Back-end/src/Routes/routesSec.js:32`).
- **Impacto:** qualquer pessoa que alcance a API cria uma conta de secretaria — e, como os perfis não
  são conferidos, usa todas as rotas.
- **Task:** [[C1] #1](https://github.com/ftfariasdev/SAGA/issues/1)

### Tokens e senhas commitados nos arquivos de teste

- **O que acontece:** `Back-end/tests/*.http` contêm JWTs fixos (3, 6 e 16 linhas `Bearer` em
  `routesAluno`, `routesProf` e `routesSec`) e senhas em texto puro.
- **Impacto:** qualquer pessoa com acesso ao repositório consegue lê-los; tokens assinados com um
  segredo ainda em uso continuam válidos até expirar.
- **Task:** [[C4] #2](https://github.com/ftfariasdev/SAGA/issues/2)

### Sem autorização por perfil

- **O que acontece:** o `tokenAuthenticate` só verifica a assinatura, e o payload do JWT é só
  `{ userId }` (`Back-end/src/controller/loginController.js:26` e `:72`). Nenhuma rota confere
  `user.tipo`.
- **Impacto:** qualquer usuário logado — um aluno, ou um usuário `tipo: 0` criado pelo login com
  Google — consegue criar, editar e excluir usuários, cursos, matérias e turmas.
- **Task:** [[S1] #14](https://github.com/ftfariasdev/SAGA/issues/14),
  [[S2] #15](https://github.com/ftfariasdev/SAGA/issues/15)

### Segredo JWT de reserva

- **O que acontece:** `Back-end/src/middlewares/authenticate.js:8` verifica os tokens com
  `process.env.JWT_SECRET || 'sua_chave_secreta_padrao'`, enquanto o `LoginController` os assina com o
  `JWT_SECRET` exportado pelo `server.js`, que não tem valor de reserva.
- **Impacto:** se o `JWT_SECRET` faltar, o login falha, mas a API aceita tokens forjados com um texto
  que é público no repositório.
- **Task:** [[F2] #4](https://github.com/ftfariasdev/SAGA/issues/4)

### IDOR nas rotas de perfil

- **O que acontece:** `GET /info/:id_user` devolve os dados de qualquer usuário, e `PUT /editarInfo`
  pega do corpo da requisição o `id_user` a editar
  (`Back-end/src/controller/commonController.js:5` e `:36`).
- **Impacto:** qualquer usuário logado lê CPF, telefone e data de nascimento de outro, e altera nome,
  e-mail, telefone e foto dele.
- **Task:** [[S4] #17](https://github.com/ftfariasdev/SAGA/issues/17)

### O login com Google cria contas

- **O que acontece:** quando o e-mail do Google não está cadastrado, o `LoginController.authGoogle`
  cria um usuário com `tipo: 0` e `cpf`/`telefone` provisórios `google_<timestamp>`, e devolve um
  token válido (`Back-end/src/controller/loginController.js:56-68`).
- **Impacto:** qualquer conta Google ganha um token. O front-end manda o `tipo: 0` de volta para a
  tela de login, mas o token funciona em todas as rotas 🔒 (veja "Sem autorização por perfil").
- **Task:** [[S5] #18](https://github.com/ftfariasdev/SAGA/issues/18)

### Hashes de senha nas respostas da API

- **O que acontece:** o hash bcrypt da `senha` é devolvido por `PUT /sec/editarUsuario/:id_user` (o
  registro inteiro, `secController.js:481`), por `GET /prof/alunos/:id_turma` e
  `/prof/alunos-turma/:id_turma` (`...aluno.user`, `profController.js:102`) e por
  `GET /prof/chamada/:id_turma/data` (`aluno.user`, `profController.js:457-459`).
- **Impacto:** hashes podem ser quebrados por força bruta offline, principalmente senhas fracas como
  as dos arquivos de teste.
- **Task:** ainda sem task (relacionada: [[D5b] #27](https://github.com/ftfariasdev/SAGA/issues/27))

### Detalhes de erros internos enviados ao cliente

- **O que acontece:** a maioria das respostas `500` inclui `error.message` em `detalhes`/`error`, e o
  `commonController.editarInfo` ainda envia o `stack` sempre que `NODE_ENV` não é `production`.
- **Impacto:** expõe nomes de tabelas, restrições e caminhos de arquivos para quem chama a API.
- **Task:** [[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3)

### Sem middlewares de proteção

- **O que acontece:** não há `helmet` nem limite de requisições, e corpos JSON/urlencoded são aceitos
  com até 50 MB (`Back-end/server.js:28-29`).
- **Impacto:** o `/login` pode sofrer força bruta; payloads grandes podem esgotar a memória.
- **Task:** [[S3] #16](https://github.com/ftfariasdev/SAGA/issues/16)

---

## 🟠 Integridade dos dados

### Excluir uma turma apaga os alunos dela

- **O que acontece:** `SecController.delTurma` executa
  `prisma.aluno.deleteMany({ where: { id_turma } })` e apaga os vínculos de professores antes de
  excluir a turma, sem transação (`secController.js:1057`). Apagar os alunos nem é necessário:
  `aluno.id_turma` é `ON DELETE SET NULL` (migration `20250606013519_add_id_prof_to_materia`), então o
  banco só desvincularia os alunos.
- **Impacto:** quando nenhum aluno da turma tem notas ou presenças ainda, todos perdem o perfil de
  aluno e as linhas de `user` ficam sem perfil. Caso contrário, as chaves estrangeiras `RESTRICT`
  fazem a chamada falhar com `400`.
- **Task:** [[D4] #25](https://github.com/ftfariasdev/SAGA/issues/25)

### Remover um aluno da turma apaga o perfil de aluno

- **O que acontece:** `SecController.removerAlunoTurma` apaga a linha de `aluno` em vez de desvincular
  a turma (`secController.js:1234`).
- **Impacto:** um aluno com notas ou presenças não pode ser removido (`nota_aluno` e `presenca` são
  `ON DELETE RESTRICT`, então a chamada responde `500`); um aluno sem elas perde o perfil, e o `user`
  precisa ser cadastrado como aluno de novo.
- **Task:** [[D4] #25](https://github.com/ftfariasdev/SAGA/issues/25)

### Excluir um usuário apaga o histórico acadêmico

- **O que acontece:** `SecController.excluirUsuario` (`secController.js:491`) apaga todas as
  presenças e notas de um aluno antes de excluí-lo, em passos separados e sem transação. Para um
  professor, remove primeiro os vínculos com turmas; como `chamada.id_professor` e
  `nota.id_professor` são `ON DELETE RESTRICT`, um professor que já fez alguma chamada ou lançou notas
  falha em seguida com um `500` (`P2003`).
- **Impacto:** o histórico do aluno se perde para sempre; um professor com histórico não pode ser
  excluído, e a tentativa que falhou o deixa sem turmas.
- **Task:** ainda sem task (relacionada: [[D5b] #27](https://github.com/ftfariasdev/SAGA/issues/27))

### O cadastro não é transacional

- **O que acontece:** `cadAluno`, `cadProfessor` e `cadSecretaria` criam o `user` e depois o perfil em
  duas consultas separadas (`secController.js:269-288`, no caso do aluno).
- **Impacto:** se a segunda inserção falhar (por exemplo, um `id_turma` inválido), sobra um usuário
  sem perfil, e o e-mail, o CPF e o telefone dele passam a contar como já usados.
- **Task:** [[D5a] #26](https://github.com/ftfariasdev/SAGA/issues/26)

### Substituir as turmas de um professor pode apagá-las

- **O que acontece:** `SecController.atualizarTurmasProfessor` executa `deleteMany` e depois
  `createMany` sem transação (`secController.js:928-941`).
- **Impacto:** se o segundo passo falhar (por exemplo, um ID de turma inválido), o professor fica sem
  nenhuma turma.
- **Task:** ainda sem task

### Cada matéria tem um único professor, global

- **O que acontece:** `materia.id_prof` guarda um professor para a matéria em todas as turmas.
  `cadMateria` e `editarMateria` percorrem todas as turmas do curso criando ou apagando vínculos em
  `professor_turma`, e o `Back-end/sync_professores_turmas.js` existe para consertar esses vínculos.
- **Impacto:** professores diferentes não podem dar a mesma matéria em turmas diferentes; os vínculos
  saem de sincronia, e tirar um professor de uma matéria pode apagar vínculos criados à mão.
- **Task:** [[D3] #24](https://github.com/ftfariasdev/SAGA/issues/24)

### Vínculos professor–turma duplicados

- **O que acontece:** os índices únicos de `professor_turma` foram removidos na migration
  `20250506004317_ajuste_professor_turma`, e não existe chave única composta em
  `(id_professor, id_turma)`. `POST /sec/vicularProfessor` e `cadTurma` não verificam se o vínculo já
  existe.
- **Impacto:** o mesmo professor pode ficar vinculado à mesma turma várias vezes.
- **Task:** ainda sem task

### As notas são duplicadas a cada envio

- **O que acontece:** `ProfController.lancarNotas` sempre cria uma nova `nota` + `nota_aluno` por
  aluno e nunca atualiza (`profController.js:380`).
- **Impacto:** enviar a tela de lançamento duas vezes grava as notas duas vezes.
- **Task:** [[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)

### Gravação parcial na chamada e nas notas

- **O que acontece:** `realizarChamada` e `lancarNotas` validam cada item da lista dentro do laço,
  depois que os itens anteriores já foram gravados (`profController.js:228-261` e `:368-398`).
- **Impacto:** um item inválido no meio responde `400`, mas os itens anteriores continuam gravados.
- **Task:** [[D6] #28](https://github.com/ftfariasdev/SAGA/issues/28),
  [[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)

---

## 🟡 Bugs

### O boletim do aluno nunca carrega

- **O que acontece:** `routesAluno.js:19` e `:28` chamam `listBimestreInfo` e `getFrequenciaGeral`,
  que não existem no `AlunoController`. O Express responde `500` com uma página HTML.
  `Front-End/Aluno/Js/boletim.js` chama a primeira.
- **Impacto:** os alunos nunca veem suas notas por bimestre.
- **Task:** [[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)

### As notas por módulo são sempre "-"

- **O que acontece:** `alunoController.js:117-118` procura notas com `tipo_avaliacao` `"B1"`/`"B2"`,
  mas a tela de lançamento (`Front-End/Professor/Js/lancamento.js:171-172`) sempre envia
  `tipo_avaliacao: "Prova"` e coloca o bimestre em `bimestre` (`"1º Bimestre"` … `"4º Bimestre"`).
  Nada grava `"B1"`/`"B2"`.
- **Impacto:** `GET /aluno/modulo/:modulo` nunca mostra uma nota.
- **Task:** [[D7] #29](https://github.com/ftfariasdev/SAGA/issues/29)

### A rota de listagem de chamadas sempre falha

- **O que acontece:** `ProfController.listarChamada` inclui `aluno` e `materia`, que não são relações
  de `Chamada`, e ordena por um `id_aluno` que não existe (`profController.js:301-312`).
- **Impacto:** `GET /prof/chamada/:id_turma` sempre responde `500`. Nenhuma tela usa a rota hoje.
- **Task:** [[D6] #28](https://github.com/ftfariasdev/SAGA/issues/28)

### As datas de frequência são tratadas de três jeitos diferentes

- **O que acontece:** `realizarChamada` compara o timestamp exato (`profController.js:210-216`);
  `buscarChamadaPorData` e `getPresencasByDia` usam o dia em UTC (`profController.js:443-444`,
  `alunoController.js:279-280`); `getFrequenciaByData` usa o dia no fuso local do servidor
  (`alunoController.js:189-190`).
- **Impacto:** uma chamada pode aparecer em uma rota e sumir em outra, e o mesmo dia pode acabar com
  mais de uma chamada.
- **Task:** [[D6] #28](https://github.com/ftfariasdev/SAGA/issues/28)

### A frequência do dia mostra a matéria errada

- **O que acontece:** a chamada não guarda a matéria, então `getPresencasByDia` informa
  `chamada.professor.materias[0]` (`alunoController.js:299`).
- **Impacto:** para professores com mais de uma matéria, o aluno vê o nome da matéria errada.
- **Task:** [[D6] #28](https://github.com/ftfariasdev/SAGA/issues/28)

### Atualizar a especialidade do professor e o setor da secretaria sempre falha

- **O que acontece:** `atualizarEspecialidadeProfessor` e `atualizarSetorSecretaria` gravam as colunas
  `especialidade` e `setor` (`secController.js:829` e `:860`), que não existem no `schema.prisma`.
- **Impacto:** essas chamadas `PUT` feitas por `Front-End/Secretaria/Js/editarCad.js` sempre respondem
  `500`.
- **Task:** [[D5b] #27](https://github.com/ftfariasdev/SAGA/issues/27)

### Editar um usuário sem data de nascimento falha

- **O que acontece:** `editarUsuario` sempre envia `dt_nasc: new Date(dt_nasc)` ao Prisma
  (`secController.js:458`); sem `dt_nasc`, isso é uma data inválida.
- **Impacto:** `PUT /sec/editarUsuario/:id_user` responde `500` a menos que `dt_nasc` seja enviado.
- **Task:** [[D5b] #27](https://github.com/ftfariasdev/SAGA/issues/27)

### Handlers sem `try/catch` derrubam o processo da API

- **O que acontece:** `cadCurso`, `listarCursos`, `editarCurso`, `excluirCurso`, `excluirMateria` e
  `criarUsuario` (`secController.js:7-47` e `:211-242`), as verificações de duplicidade dos handlers
  de cadastro, o `LoginController.auth` e a parte de banco do `LoginController.authGoogle` (depois do
  `verifyIdToken`, `loginController.js:55-68`) não têm `try/catch`. O Express 4 não captura promises
  rejeitadas. Além disso, `editarCurso` testa `if (!curso)` depois do `prisma.curso.update`, que lança
  `P2025` em vez de devolver `null`, então o ramo `404` é código morto.
- **Impacto:** um erro de banco — editar um curso que não existe, ou excluir um que ainda tem
  matérias — vira uma promise rejeitada sem tratamento, e no Node ≥ 15 isso **derruba o processo da
  API**, não só aquela requisição. Com `npm run dev` (`node --watch`), a API só volta depois que algum
  arquivo muda.
- **Task:** [[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3)

### Cadastro duplicado responde HTTP 200

- **O que acontece:** quando o e-mail, o telefone ou o CPF já existe, os handlers de cadastro fazem
  `return res.json({ error: '… já cadastrado' })` sem definir status (`secController.js:250-264`, no
  caso do aluno).
- **Impacto:** clientes que só olham `response.ok` tratam a falha como sucesso.
- **Task:** [[D5a] #26](https://github.com/ftfariasdev/SAGA/issues/26)

### Rota `/health` duplicada

- **O que acontece:** `Back-end/server.js:33` define `/health`, mas `routesGeral.js:21` a registra
  antes e responde no lugar.
- **Impacto:** código morto, e dois formatos de resposta diferentes no código-fonte.
- **Task:** [[F3] #5](https://github.com/ftfariasdev/SAGA/issues/5)

### O e-mail não é guardado após o login com senha

- **O que acontece:** `Front-End/Login/Js/login.js:83-84` lê `data.email`, mas `POST /login` devolve
  `emailDoBanco` (`loginController.js:32`).
- **Impacto:** `emailUsuario` fica vazio no `localStorage` até o `Js/menu.js` buscar `/info` de novo.
- **Task:** [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37)

### `/info` nunca devolve a turma

- **O que acontece:** `commonController.js:25` envia `turma: user.turma`, mas `User` não tem o campo
  `turma`.
- **Impacto:** a chave é sempre `undefined` e some do JSON.
- **Task:** ainda sem task

---

## 🔧 Ferramentas, CI e DX

### Porta da API divergente (corrigido)

- **O que acontece:** o `Back-end/.env.example` dizia `PORT=3000`, enquanto o front-end (74 URLs
  fixas) e os arquivos `.http` chamam a porta `8081`.
- **Impacto:** seguindo o guia de instalação, as telas não alcançavam a API.
- **Situação:** corrigido na mudança de documentação que criou este arquivo — o exemplo agora usa
  `8081`. Arquivos `.env` locais criados antes ainda precisam de `PORT=8081`.

### O CI ignora a versão do Node

- **O que acontece:** `.github/workflows/lint.yml:23` e `prettier.yml:23` usam `node-node: '20'`
  (erro de digitação de `node-version`). O `actions/setup-node` ignora a entrada desconhecida.
- **Impacto:** o CI roda com o Node padrão do runner, não com uma versão fixa.
- **Task:** [[CI1] #35](https://github.com/ftfariasdev/SAGA/issues/35)

### O CI não roda testes

- **O que acontece:** o CI só executa `npm run lint` e `npm run format:check`. Não existe suíte de
  testes, e o `npm test` do `Back-end/` é um placeholder que sai com código 1.
- **Impacto:** regressões só são pegas manualmente.
- **Task:** [[T1] #31](https://github.com/ftfariasdev/SAGA/issues/31),
  [[CI1] #35](https://github.com/ftfariasdev/SAGA/issues/35)

### A verificação do Prettier falha localmente no Windows

- **O que acontece:** o Git for Windows costuma configurar `core.autocrlf=true`, que faz o checkout dos
  arquivos com CRLF. O Prettier espera LF, e o repositório não tem `.gitattributes`.
- **Impacto:** `npm run format:check` falha no Windows mesmo quando o CI (Linux) passa.
- **Correção sugerida (não aplicada):** um `.gitattributes` com `* text=auto eol=lf`.
- **Task:** ainda sem task

### Configuração do `package.json` da raiz

- **O que acontece:** ESLint e Prettier estão em `dependencies` em vez de `devDependencies`, e não há
  `"type": "module"`, embora o `eslint.config.js` use `import`.
- **Impacto:** o Node imprime um aviso `MODULE_TYPELESS_PACKAGE_JSON` a cada `npm run lint`.
- **Task:** ainda sem task

### Metadados herdados no `Back-end/package.json`

- **O que acontece:** `name` é `"dev"`, `description` é uma tag HTML `<img>`, `main` aponta para um
  `index.js` que não existe, e `repository`/`bugs`/`homepage` apontam para
  `HugoSants/AuthenticateNode`. São usadas duas bibliotecas de bcrypt — o `bcrypt` (nativo) gera os
  hashes em `secController.js` e o `bcryptjs` os compara em `loginController.js` — e o `sqlite3` está
  instalado, mas nunca é importado (o banco é PostgreSQL).
- **Impacto:** metadados confusos e uma biblioteca de hash de senha sobrando.
- **Task:** [[F10] #12](https://github.com/ftfariasdev/SAGA/issues/12)

### Licença não definida

- **O que acontece:** o README dizia MIT, mas não existe arquivo `LICENSE`, e o
  `Back-end/package.json` diz `ISC`.
- **Impacto:** do ponto de vista legal, o código não tem licença nenhuma.
- **Task:** ainda sem task (decisão do time)

### Client ID do Google em dois lugares

- **O que acontece:** `Front-End/Login/Js/login.js:218` tem o `client_id` do OAuth do Google fixo no
  código, enquanto o back-end valida os tokens contra o `GOOGLE_CLIENT_ID` do `.env` (vazio no
  `.env.example`).
- **Impacto:** o login com Google só funciona se os dois valores forem iguais. Client IDs não são
  segredos, mas a configuração sai de sincronia.
- **Task:** ainda sem task (relacionadas: [[F2] #4](https://github.com/ftfariasdev/SAGA/issues/4),
  [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37))

---

## 🧹 Dívida técnica e limpeza

### Logs improvisados

- **O que acontece:** os controllers registram erros com `console.error`, sem níveis nem contexto da
  requisição.
- **Impacto:** é difícil rastrear uma requisição que falhou.
- **Task:** [[F8] #10](https://github.com/ftfariasdev/SAGA/issues/10)

### Sem validação de entrada

- **O que acontece:** os corpos das requisições são desestruturados e passados direto ao Prisma.
- **Impacto:** um campo ausente ou com tipo errado aparece como erro do Prisma e `500`, em vez de
  `400`.
- **Task:** [[F6] #8](https://github.com/ftfariasdev/SAGA/issues/8)

### Sem paginação

- **O que acontece:** `listarUsuarios`, `listarTurmas`, `listarCursos` e as demais listagens devolvem
  todas as linhas.
- **Impacto:** as respostas crescem junto com a escola.
- **Task:** [[P2] #13](https://github.com/ftfariasdev/SAGA/issues/13)

### Formatos de erro inconsistentes

- **O que acontece:** os corpos de erro usam `erro`, `error` ou `message`; algumas respostas `204`
  tentam enviar corpo; `delTurma` responde `400` com o objeto de erro cru do Prisma.
- **Impacto:** o front-end precisa adivinhar onde está a mensagem.
- **Task:** [[F5] #7](https://github.com/ftfariasdev/SAGA/issues/7),
  [[F1] #3](https://github.com/ftfariasdev/SAGA/issues/3)

### O `server.js` faz coisas demais

- **O que acontece:** configuração, CORS, rotas e `listen` ficam num único arquivo, e o
  `loginController.js` importa `JWT_SECRET` do `server.js` (importação circular). Não há desligamento
  gracioso.
- **Impacto:** os testes não conseguem importar a aplicação sem subir o servidor.
- **Task:** [[F3] #5](https://github.com/ftfariasdev/SAGA/issues/5),
  [[F2] #4](https://github.com/ftfariasdev/SAGA/issues/4)

### Scripts de manutenção criam o próprio cliente Prisma

- **O que acontece:** `Back-end/fixMateria.js:6` e `Back-end/sync_professores_turmas.js:6` chamam
  `new PrismaClient()`; a API em si usa o `src/util/prisma.js` compartilhado.
- **Impacto:** baixo — mas é um padrão fácil de copiar para dentro da API por engano.
- **Task:** [[F4] #6](https://github.com/ftfariasdev/SAGA/issues/6)

### Arquivos órfãos e legados

- **O que acontece:**
  - `Back-end/cadMateria.js` — cópia antiga do `cadMateria`, não é importado em lugar nenhum.
  - `Back-end/src/controller/profController_fixed.js` — arquivo vazio.
  - `Back-end/fixMateria.js` — verificação avulsa com um ID de curso fixo (linha 19) que insere e
    apaga uma matéria de teste.
  - `Back-end/node_modules.rar` — cerca de 78 MB versionados no Git.
  - `Back-end/baseline.sql` — dump em UTF-16 de um schema antigo, não é uma migration do Prisma.
- **Impacto:** ruído para quem chega; o arquivo compactado deixa todo clone bem mais pesado.
- **Task:** [[F9] #11](https://github.com/ftfariasdev/SAGA/issues/11)

### Histórico de migrations com uma reescrita que perde dados

- **O que acontece:** duas migrations têm o mesmo nome, `add_nota` (`20250508225216_add_nota` e
  `20250515005914_add_nota`). A segunda remove as colunas `valor`, `bimestre`, `data` e `id_aluno` de
  `nota` para mover as notas para `nota_aluno`, sem copiar os dados. O `bimestre` voltou depois como
  texto (`20250615203113_add_bimestre_to_nota`).
- **Impacto:** qualquer banco migrado por ela perdeu as notas que tinha, e o histórico é difícil de
  acompanhar.
- **Task:** ainda sem task (relacionada: [[M0] #19](https://github.com/ftfariasdev/SAGA/issues/19))

### A API expõe IDs internos de perfil

- **O que acontece:** algumas URLs recebem `id_professor` ou `id_aluno` em vez de `id_user`, algumas
  ignoram o parâmetro do caminho (`/prof/turmas/:id_professor`, `/professor/user/:id_user`), e o
  `consultarUsuario` aceita quatro tipos diferentes de ID.
- **Impacto:** o front-end precisa lidar com vários IDs para a mesma pessoa.
- **Task:** [[M7] #21](https://github.com/ftfariasdev/SAGA/issues/21)

---

## 🎨 Front-end

### URL da API fixa em todo lugar

- **O que acontece:** `http://localhost:8081` aparece 74 vezes em 29 arquivos JavaScript.
- **Impacto:** mudar a porta ou publicar em outro endereço exige editar todos os arquivos.
- **Task:** [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37)

### Páginas que pulam a verificação do token

- **O que acontece:** `Secretaria/Page/Cadastro.html`, `cadastroMateria.html`, `editarMateria.html`,
  `editarUsuario.html` e `ListarCursos.html` não carregam o `Js/verificaToken.js`.
- **Impacto:** essas páginas abrem sem redirecionar para o login; as chamadas à API depois falham com
  `401`.
- **Task:** ainda sem task (relacionada: [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37))

### Scripts incluídos com caminho quebrado

- **O que acontece:** `Secretaria/Page/info.html:109` carrega `../Js/verificaToken.js`, que não existe
  (o arquivo fica em `Front-End/Js/`). `Login/RecSenha.html:21` e `Login/ConfirRecSenha.html:20`
  carregam `Js/script.js`, que também não existe.
- **Impacto:** a página de perfil da secretaria nunca verifica o token, e as telas de recuperação de
  senha não têm lógica — nem existe rota no back-end para isso.
- **Task:** ainda sem task

### Usuários criados pelo Google voltam para a tela de login

- **O que acontece:** `handleGoogleCredentialResponse`, em `Front-End/Login/Js/login.js`, não tem
  caso para `tipo: 0`, então o ramo `default` (linhas 191-192) redireciona para `Login.html` sem
  nenhuma mensagem — depois de já ter guardado o token.
- **Impacto:** quem tem uma conta Google não cadastrada parece "entrar" e cai de novo na tela de
  login, com um token válido no `localStorage`.
- **Task:** relacionada: [[S5] #18](https://github.com/ftfariasdev/SAGA/issues/18)

### `id_user` é lido, mas nunca gravado

- **O que acontece:** `Secretaria/Js/editarInfo.js:237` e `:315` leem
  `localStorage.getItem('id_user')`, mas nenhum script grava essa chave — o login guarda `userId`.
- **Impacto:** a tela "editar minhas informações" da secretaria recebe `null` em vez do ID do usuário
  logado.
- **Task:** relacionada: [[FE1] #37](https://github.com/ftfariasdev/SAGA/issues/37)

### O gráfico de frequência do aluno é estático

- **O que acontece:** `Aluno/Js/freq1.js` desenha um gráfico com os dados fixos `[50, 50]` (linha 10),
  e o único `fetch` dele usa a URL relativa `/aluno/listMateria` (linha 53), que vai para o Live
  Server (`127.0.0.1:5500`) em vez da API.
- **Impacto:** a página de frequência (`Aluno/Page/Freq1.html`) sempre mostra 50/50, seja qual for a
  frequência real.
- **Task:** [[FE5] #41](https://github.com/ftfariasdev/SAGA/issues/41)

### Scripts órfãos no front-end

- **O que acontece:** `Aluno/Js/dia.js`, `Aluno/Js/script.js`, `Professor/Js/boletim.js` e
  `Professor/Js/script.js` não são carregados por nenhuma página.
- **Impacto:** código morto com cara de importante — editá-lo não muda nada.
- **Task:** ainda sem task (relacionada: [[F9] #11](https://github.com/ftfariasdev/SAGA/issues/11),
  que cobre o back-end)

### Script carregado duas vezes

- **O que acontece:** `Secretaria/Page/ListarTurmas.html` inclui `../Js/ListarTurmas.js` nas linhas 17
  e 98.
- **Impacto:** o script roda duas vezes na página de listagem de turmas.
- **Task:** ainda sem task

### Maiúsculas e minúsculas inconsistentes em arquivos e pastas

- **O que acontece:** `Aluno/Css` e `Professor/Css` vs `Secretaria/css`; `HomeAluno.Html` e
  `HomeProfessor.Html`, enquanto `Login/Js/login.js:97` e `:105` redirecionam para `.html`; e uma pasta
  chamada `Css Base` (com espaço).
- **Impacto:** funciona no Windows e no macOS, mas dá `404` em sistemas de arquivos que diferenciam
  maiúsculas de minúsculas e na maioria dos servidores web.
- **Task:** ainda sem task

### O CORS libera uma única origem

- **O que acontece:** `Back-end/server.js:19` só libera `http://127.0.0.1:5500`.
- **Impacto:** abrir o front-end como `http://localhost:5500` (ou em outra porta) bloqueia todas as
  chamadas à API.
- **Task:** ainda sem task (relacionada: [[F2] #4](https://github.com/ftfariasdev/SAGA/issues/4))

---

## Como usar esta lista

- **Corrigiu algo?** Remova o item de **ambos** os arquivos, `docs/known-issues.md` e
  `docs/pt-BR/known-issues.md`, no mesmo pull request.
- **Encontrou algo?** Adicione nos dois arquivos, no grupo certo, com arquivo e linha, impacto e task
  do backlog (ou "ainda sem task").
- **Não corrija estes itens de passagem.** Cada correção muda um comportamento do qual alguém pode
  depender — abra ou pegue a task e siga o [docs/pt-BR/CONTRIBUTING.md](CONTRIBUTING.md).

**Veja também:** [Referência da API](api-reference.md) · [Arquitetura](architecture.md)
· [Banco de dados](database.md) · [Índice da documentação](README.md#documentação)
