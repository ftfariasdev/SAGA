# Glossário do SAGA

🌐 [English](../glossary.md) | **Português (Brasil)**

O código, as rotas, as tabelas e a interface do SAGA usam termos do domínio em **português**, muitas
vezes abreviados. Este glossário liga cada termo aos identificadores que aparecem no código e ao
equivalente em inglês — útil para quem está chegando no projeto e para conversar com quem lê a
versão em inglês da documentação.

> Mantenha os nomes do domínio em português ao escrever código novo — consistência vale mais que
> tradução. Registre aqui (e na versão em inglês) todo termo novo que você introduzir.

## Índice

1. [Termos do domínio](#1-termos-do-domínio)
2. [Verbos usados em rotas e métodos](#2-verbos-usados-em-rotas-e-métodos)
3. [Abreviações](#3-abreviações)
4. [Nomes das páginas](#4-nomes-das-páginas)
5. [Termos técnicos](#5-termos-técnicos)

---

## 1. Termos do domínio

### Pessoas e perfis

| Termo            | Identificadores no código                                        | Em inglês                       | Observações                                                                                                     |
| ---------------- | ---------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| usuário          | `User`, tabela `user`, `id_user`, `userId` (JWT, `localStorage`) | user account                    | Registro base compartilhado por todos os perfis. Veja [database.md](database.md#user--model-user).              |
| aluno            | `Aluno`, `aluno`, `id_aluno`, `routerAluno`, `/aluno/*`          | student                         | `tipo = 3`. Pertence a no máximo uma `turma`.                                                                   |
| professor (prof) | `Professor`, `professor`, `id_professor`, `id_prof`, `/prof/*`   | teacher                         | `tipo = 2`. `id_prof` é a coluna do professor na `materia`.                                                     |
| secretaria (sec) | `Secretaria`, `secretaria`, `id_secretaria`, `/sec/*`            | school office / registrar staff | `tipo = 1`. Administra cursos, turmas e usuários. Em inglês não é "secretary" no sentido de assistente pessoal. |
| tipo             | `User.tipo`, `localStorage.tipo`                                 | user type (role code)           | `0` criado pelo Google, `1` secretaria, `2` professor, `3` aluno. Nunca renumere.                               |

### Estrutura acadêmica

| Termo              | Identificadores no código                                     | Em inglês                        | Observações                                                                                |
| ------------------ | ------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| curso              | `Curso`, `curso`, `id_curso`                                  | course / degree program          | Topo da hierarquia: tem `materias` e `turmas`.                                             |
| matéria            | `Materia`, `materia`, `id_materia`, `materias`                | subject / discipline             | Disciplina ensinada dentro de um `curso`. Um professor por matéria (`id_prof`).            |
| turma              | `Turma`, `turma`, `id_turma`, rotas `Turma/*`                 | class / cohort                   | Grupo de alunos de um `curso` que começa em `dt_inicio`.                                   |
| módulo             | `modulo`, `/aluno/modulo/:modulo`                             | module                           | Não existe coluna: a API seleciona as matérias cujo `codigo` começa com o valor informado. |
| semestres          | `Turma.semestres`                                             | number of semesters              | Campo numérico na tela, guardado como texto.                                               |
| período            | `Curso.periodo`                                               | period / shift                   | Texto livre.                                                                               |
| carga horária      | `ch_total`                                                    | workload (total hours)           | Guardada como texto em `curso` e `materia`.                                                |
| código             | `codigo`                                                      | code                             | Número sequencial, legível, em `curso`, `materia` e `turma` (não é a chave primária).      |
| matrícula          | `User.matricula`                                              | registration / enrollment number | Número com autoincremento exibido como identificação do usuário. Não é único no banco.     |
| vínculo / vincular | `professor_turma`, `ProfessorTurma`, `vincularProfessorTurma` | link / to assign                 | Principalmente professor ↔ turma. A rota está escrita `/sec/vicularProfessor` (sic).       |

### Frequência

| Termo      | Identificadores no código                           | Em inglês                   | Observações                                                       |
| ---------- | --------------------------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| chamada    | `Chamada`, `chamada`, `id_chamada`, `/prof/chamada` | roll call (session)         | Uma por professor × turma × data.                                 |
| presença   | `Presenca`, `presenca`, `presencas`, `presente`     | attendance record / present | Uma por aluno em cada `chamada`; `presente` é booleano.           |
| frequência | `/aluno/frequencia*`, `Freq1.html`, `Freq2.html`    | attendance (rate)           | Calculada a partir de `presenca`; não existe tabela `frequencia`. |
| freq_min   | `freq_min`                                          | minimum required attendance | Guardada como texto em `curso` e `materia`.                       |

### Notas

| Termo             | Identificadores no código                             | Em inglês                | Observações                                                                                               |
| ----------------- | ----------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| nota              | `Nota`, `nota`, `id_nota`, `notas`                    | grade entry (header)     | Professor + turma + matéria + avaliação + bimestre. No corpo da requisição, `notas` é a lista de valores. |
| nota do aluno     | `NotaAluno`, `nota_aluno`, `notasAlunos`, `valor`     | a student's grade value  | `valor` de 0 a 10.                                                                                        |
| lançar notas      | `lancarNotas`, `/prof/lancarNotas`, `Lancamento.html` | to post / enter grades   | "Lançamento" = o ato de lançar.                                                                           |
| tipo de avaliação | `tipo_avaliacao`                                      | assessment type          | Ex.: `Prova`, `Trabalho`. A interface envia `Prova`.                                                      |
| bimestre          | `bimestre`, `/aluno/bimestre/:bimestre`               | two-month term (quarter) | O ano letivo tem quatro. Guardado como texto, ex.: `1º Bimestre`.                                         |
| B1 / B2           | `'B1'`, `'B2'` em `alunoController.listModuloInfo`    | 1st / 2nd term grade     | Valores que a tela de módulo procura em `tipo_avaliacao`; a interface não os grava.                       |
| boletim           | `Aluno/Page/boletim.html`, `boletim.js`               | report card              | Tela de notas do aluno.                                                                                   |

### Dados pessoais

| Termo              | Identificadores no código                          | Em inglês                        | Observações                                                                       |
| ------------------ | -------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| nome               | `nome`, `nomeUsuario`                              | name                             |                                                                                   |
| senha              | `senha`                                            | password                         | Guardada como hash bcrypt. Nunca pode aparecer numa resposta.                     |
| data de nascimento | `dt_nasc`                                          | date of birth                    |                                                                                   |
| data de início     | `dt_inicio`                                        | start date                       | Na `turma`.                                                                       |
| foto de perfil     | `ft_perfil`, `fotoPerfil`, `foto`                  | profile photo                    | Imagem em texto (data URL de um JPEG redimensionado, ou a URL da foto do Google). |
| CPF                | `cpf`                                              | Brazilian individual taxpayer ID | 11 dígitos, único. Máscara `000.000.000-00` no `mascaras.js`.                     |
| telefone           | `telefone`                                         | phone number                     | Único. Máscara `XX XXXXX-XXXX`.                                                   |
| especialidade      | `especialidade`, `atualizarEspecialidadeProfessor` | (teacher's) specialty            | Enviada pela interface, mas a coluna não existe — a atualização falha.            |
| setor              | `setor`, `atualizarSetorSecretaria`                | department                       | Mesma situação de `especialidade`.                                                |

---

## 2. Verbos usados em rotas e métodos

| Português               | Em inglês                        | Exemplo                                                                             |
| ----------------------- | -------------------------------- | ----------------------------------------------------------------------------------- |
| cadastrar / cad         | create, register                 | `POST /sec/cadAluno`, `POST /sec/Turma/cadastrar` (`cadTurma`)                      |
| listar / list           | list                             | `GET /sec/listarCursos`, `GET /aluno/listMateria`                                   |
| consultar               | get the details of one item      | `GET /sec/consultarUsuario/:id_user`, `GET /sec/Turma/consultar/:id_turma`          |
| buscar                  | look up, fetch                   | `GET /professor/user/:id_user` (`buscarProfessorPorUser`)                           |
| editar                  | edit (o registro inteiro)        | `PUT /sec/editarCurso/:id_curso`, `PUT /editarInfo`                                 |
| atualizar               | update (uma parte específica)    | `PUT /sec/atualizarTurmaAluno/:id_user`                                             |
| excluir / deletar / del | delete                           | `DELETE /sec/excluirUsuario/:id_user`, `DELETE /sec/Turma/deletar/:id` (`delTurma`) |
| remover                 | remove (desvincular, não apagar) | `DELETE /sec/Turma/removerProfessor/:id_professor/:id_turma`                        |
| vincular                | link, assign                     | `POST /sec/vicularProfessor` (`vincularProfessorTurma`)                             |
| realizar                | carry out, perform               | `POST /prof/chamada` (`realizarChamada`)                                            |
| lançar                  | post, record                     | `POST /prof/lancarNotas`                                                            |
| verificar               | check, verify                    | `Front-End/Js/verificaToken.js`                                                     |
| sincronizar             | synchronize                      | `Back-end/sync_professores_turmas.js`                                               |
| recuperar               | recover                          | `Login/RecSenha.html` (recuperar senha = password recovery)                         |

> ⚠️ Na interface, `remover` sugere desvincular, mas `DELETE /sec/Turma/removerAluno/:id_aluno`
> apaga a linha de perfil do aluno. Veja [known-issues.md](known-issues.md).

---

## 3. Abreviações

| Abreviação | Significa          | Em inglês             | Onde aparece                                 |
| ---------- | ------------------ | --------------------- | -------------------------------------------- |
| `sec`      | secretaria         | school office         | `/sec/*`, `secController.js`, `routesSec.js` |
| `prof`     | professor          | teacher               | `/prof/*`, `profController.js`, `id_prof`    |
| `alu`      | aluno              | student               | `homeAlu.js`                                 |
| `cad`      | cadastro/cadastrar | registration / create | `cadAluno`, `cadCurso`, `Cadastro.html`      |
| `dt`       | data               | date                  | `dt_nasc`, `dt_inicio`                       |
| `ft`       | foto               | photo                 | `ft_perfil`                                  |
| `ch`       | carga horária      | workload (hours)      | `ch_total`                                   |
| `freq`     | frequência         | attendance            | `freq_min`, `Freq1.html`, `freq2.js`         |
| `id_*`     | identificador      | identifier (UUID)     | `id_user`, `id_turma`, …                     |
| `Rec`      | recuperar          | recover               | `RecSenha.html`                              |
| `Confir`   | confirmar          | confirm               | `ConfirRecSenha.html`                        |
| `Info`     | informações        | information / profile | `info.html`, `/info/:id_user`, `editarInfo`  |

---

## 4. Nomes das páginas

| Página / arquivo                  | Significado                                     |
| --------------------------------- | ----------------------------------------------- |
| `Home*.html`                      | Página inicial do perfil                        |
| `info.html`                       | "Meu perfil"                                    |
| `Ajuda.html`                      | Ajuda                                           |
| `Cadastro.html`, `cadastro*.html` | Formulário de cadastro                          |
| `Listar*.html`                    | Página de listagem                              |
| `editar*.html`                    | Formulário de edição                            |
| `consultarTurma.html`             | Detalhes da turma                               |
| `Curso.html` (aluno)              | Meu curso e suas matérias                       |
| `boletim.html`                    | Boletim                                         |
| `Freq1.html` / `Freq2.html`       | Resumo de frequência / calendário de frequência |
| `Chamada.html` / `Chamada2.html`  | Escolher turma e matéria / fazer a chamada      |
| `Lancamento.html`                 | Lançamento de notas                             |
| `Turma.html` (professor)          | Turmas do professor                             |

---

## 5. Termos técnicos

Comuns em mensagens de commit, comentários e conversas do time.

| Português               | Em inglês           |
| ----------------------- | ------------------- |
| rota                    | route               |
| requisição / resposta   | request / response  |
| banco de dados / banco  | database            |
| tabela / coluna         | table / column      |
| chave estrangeira       | foreign key         |
| migração / migration    | migration           |
| vínculo                 | link / relationship |
| cadastro                | registration record |
| perfil                  | role / profile      |
| sessão                  | session             |
| chave secreta / segredo | secret key          |
| ambiente                | environment         |
| homologação             | staging             |
| produção                | production          |
