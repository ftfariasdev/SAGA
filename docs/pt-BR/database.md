# Banco de dados do SAGA

🌐 [English](../database.md) | **Português (Brasil)**

O modelo de dados, o que cada tabela guarda, os cuidados necessários antes de escrever uma consulta
ou uma migration e o histórico do schema.

## Índice

1. [Motor e configuração](#1-motor-e-configuração)
2. [Diagrama entidade-relacionamento](#2-diagrama-entidade-relacionamento)
3. [Referência das tabelas](#3-referência-das-tabelas)
4. [Observações e cuidados de modelagem](#4-observações-e-cuidados-de-modelagem)
5. [Histórico de migrations](#5-histórico-de-migrations)
6. [Comandos do dia a dia e regras](#6-comandos-do-dia-a-dia-e-regras)

---

## 1. Motor e configuração

| Item               | Valor                                                                                              |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| Motor              | PostgreSQL 16 (imagem `postgres:16`), container `saga-db`                                          |
| Definição          | [`Back-end/docker-compose.yml`](../../Back-end/docker-compose.yml)                                 |
| Volume de dados    | `saga-pgdata` (sobrevive ao `docker compose down`; é apagado pelo `docker compose down -v`)        |
| Health check       | `pg_isready` a cada 5 s — espere o `Up (healthy)` antes de rodar o Prisma                          |
| ORM                | Prisma 6 — schema em [`Back-end/prisma/schema.prisma`](../../Back-end/prisma/schema.prisma)        |
| Conexão            | `DATABASE_URL` no `Back-end/.env`, ex.: `postgresql://saga:saga@localhost:5432/saga?schema=public` |
| Credenciais locais | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (padrão `saga`/`saga`/`saga`)                  |

**Collation.** O container é inicializado com
`--encoding=UTF8 --locale-provider=icu --icu-locale=pt-BR`, então `ORDER BY nome` ordena nomes
acentuados corretamente (`Ética` antes de `Zoologia`) em qualquer sistema operacional. Esses
argumentos só valem quando o volume é criado pela primeira vez; um volume antigo mantém a collation
original até ser recriado com `docker compose down -v`.

Instalação passo a passo: [local-environment.md](local-environment.md).

---

## 2. Diagrama entidade-relacionamento

O diagrama usa os nomes dos models do Prisma; os nomes reais das tabelas (do `@@map`) estão na
[seção 3](#3-referência-das-tabelas).

```mermaid
erDiagram
    User ||--o| Secretaria : "id_user"
    User ||--o| Professor : "id_user"
    User ||--o| Aluno : "id_user"
    Curso ||--o{ Materia : "id_curso"
    Curso ||--o{ Turma : "id_curso"
    Professor |o--o{ Materia : "id_prof"
    Turma |o--o{ Aluno : "id_turma"
    Professor ||--o{ ProfessorTurma : "id_professor"
    Turma ||--o{ ProfessorTurma : "id_turma"
    Professor ||--o{ Chamada : "id_professor"
    Turma ||--o{ Chamada : "id_turma"
    Chamada ||--o{ Presenca : "id_chamada"
    Aluno ||--o{ Presenca : "id_aluno"
    Professor ||--o{ Nota : "id_professor"
    Turma ||--o{ Nota : "id_turma"
    Materia ||--o{ Nota : "id_materia"
    Nota ||--o{ NotaAluno : "id_nota"
    Aluno ||--o{ NotaAluno : "id_aluno"

    User {
        string id_user PK
        int matricula "autoincremento"
        string nome
        string email UK
        string senha "hash bcrypt"
        datetime dt_nasc
        string telefone UK
        string cpf UK
        string ft_perfil
        int tipo "0 Google, 1 Sec, 2 Prof, 3 Aluno"
    }
    Secretaria {
        string id_secretaria PK
        string id_user FK "único"
    }
    Professor {
        string id_professor PK
        string id_user FK "único"
    }
    Aluno {
        string id_aluno PK
        string id_user FK "único"
        string id_turma FK "opcional"
    }
    Curso {
        string id_curso PK
        int codigo UK "autoincremento"
        string nome
        string periodo
        string descricao
        string ch_total
        string freq_min
    }
    Materia {
        string id_materia PK
        int codigo UK "autoincremento"
        string nome
        string descricao
        string ch_total
        string freq_min
        string id_curso FK
        string id_prof FK "opcional"
    }
    Turma {
        string id_turma PK
        int codigo UK "autoincremento"
        string nome
        datetime dt_inicio
        string semestres
        string id_curso FK
    }
    ProfessorTurma {
        string id_prof_turma PK
        string id_professor FK
        string id_turma FK
    }
    Chamada {
        string id_chamada PK
        string id_professor FK
        string id_turma FK
        datetime data "padrão now()"
    }
    Presenca {
        string id_presenca PK
        string id_chamada FK
        string id_aluno FK
        boolean presente
    }
    Nota {
        string id_nota PK
        string id_professor FK
        string id_turma FK
        string id_materia FK
        string tipo_avaliacao "opcional"
        string bimestre "opcional"
        datetime data_lancamento "padrão now()"
    }
    NotaAluno {
        string id_nota_aluno PK
        string id_nota FK
        string id_aluno FK
        float valor
    }
```

---

## 3. Referência das tabelas

Convenções que valem para todas as tabelas:

- As chaves primárias são **UUIDs em texto** (`TEXT`), gerados pelo Prisma (`@default(uuid())`), não
  pelo banco.
- Os nomes das colunas estão em português, em `snake_case`; chaves estrangeiras seguem o padrão
  `id_<entidade>`.
- As chaves estrangeiras usam `ON UPDATE CASCADE` e `ON DELETE RESTRICT`, **exceto**
  `aluno.id_turma` e `materia.id_prof`, que usam `ON DELETE SET NULL`.
- Os campos de relação do Prisma (os nomes usados no `include`) aparecem na última linha de cada
  tabela.

### `user` — model `User`

Toda pessoa que pode fazer login.

| Coluna      | Tipo         | Restrições / observações                                                |
| ----------- | ------------ | ----------------------------------------------------------------------- |
| `id_user`   | TEXT         | PK (UUID)                                                               |
| `matricula` | SERIAL (int) | Número de matrícula com autoincremento. **Sem** restrição de unicidade. |
| `nome`      | TEXT         | Obrigatório                                                             |
| `email`     | TEXT         | **ÚNICO** — é o login                                                   |
| `senha`     | TEXT         | Hash bcrypt; string vazia nas contas criadas pelo login com Google      |
| `dt_nasc`   | TIMESTAMP(3) | Data de nascimento                                                      |
| `telefone`  | TEXT         | **ÚNICO**                                                               |
| `cpf`       | TEXT         | **ÚNICO**                                                               |
| `ft_perfil` | TEXT         | Obrigatório, pode ser string vazia. Imagem em texto (data URL ou URL)   |
| `tipo`      | INTEGER      | `0` criado pelo Google · `1` Secretaria · `2` Professor · `3` Aluno     |
| _relações_  |              | `secretarias`, `professores`, `alunos` (declaradas como arrays)         |

### `secretaria` — model `Secretaria`

| Coluna          | Tipo | Restrições / observações                  |
| --------------- | ---- | ----------------------------------------- |
| `id_secretaria` | TEXT | PK                                        |
| `id_user`       | TEXT | **ÚNICO**, FK → `user.id_user` (RESTRICT) |
| _relações_      |      | `user`                                    |

### `professor` — model `Professor`

| Coluna         | Tipo | Restrições / observações                                  |
| -------------- | ---- | --------------------------------------------------------- |
| `id_professor` | TEXT | PK                                                        |
| `id_user`      | TEXT | **ÚNICO**, FK → `user.id_user` (RESTRICT)                 |
| _relações_     |      | `user`, `turmasRelation`, `materias`, `notas`, `Chamadas` |

### `aluno` — model `Aluno`

| Coluna     | Tipo | Restrições / observações                                 |
| ---------- | ---- | -------------------------------------------------------- |
| `id_aluno` | TEXT | PK                                                       |
| `id_user`  | TEXT | **ÚNICO**, FK → `user.id_user` (RESTRICT)                |
| `id_turma` | TEXT | **Opcional**, FK → `turma.id_turma` (ON DELETE SET NULL) |
| _relações_ |      | `user`, `turma`, `notas` (→ `NotaAluno`), `presencas`    |

### `curso` — model `Curso`

| Coluna      | Tipo         | Restrições / observações                     |
| ----------- | ------------ | -------------------------------------------- |
| `id_curso`  | TEXT         | PK                                           |
| `nome`      | TEXT         |                                              |
| `codigo`    | SERIAL (int) | **ÚNICO**, autoincremento                    |
| `periodo`   | TEXT         | Texto livre                                  |
| `descricao` | TEXT         |                                              |
| `ch_total`  | TEXT         | Carga horária total, **guardada como texto** |
| `freq_min`  | TEXT         | Frequência mínima, **guardada como texto**   |
| _relações_  |              | `turmas`, `materias`                         |

### `materia` — model `Materia`

| Coluna       | Tipo         | Restrições / observações                                                      |
| ------------ | ------------ | ----------------------------------------------------------------------------- |
| `id_materia` | TEXT         | PK                                                                            |
| `nome`       | TEXT         |                                                                               |
| `codigo`     | SERIAL (int) | **ÚNICO**, autoincremento. O `/aluno/modulo/:modulo` filtra pelo prefixo dele |
| `descricao`  | TEXT         |                                                                               |
| `ch_total`   | TEXT         | Texto                                                                         |
| `freq_min`   | TEXT         | Texto                                                                         |
| `id_curso`   | TEXT         | FK → `curso.id_curso` (RESTRICT)                                              |
| `id_prof`    | TEXT         | **Opcional**, FK → `professor.id_professor` (ON DELETE SET NULL)              |
| _relações_   |              | `curso`, `professor`, `notas`                                                 |

### `turma` — model `Turma`

| Coluna      | Tipo         | Restrições / observações                                      |
| ----------- | ------------ | ------------------------------------------------------------- |
| `id_turma`  | TEXT         | PK                                                            |
| `codigo`    | SERIAL (int) | **ÚNICO**, autoincremento                                     |
| `nome`      | TEXT         |                                                               |
| `dt_inicio` | TIMESTAMP(3) | Data de início                                                |
| `semestres` | TEXT         | Texto                                                         |
| `id_curso`  | TEXT         | FK → `curso.id_curso` (RESTRICT)                              |
| _relações_  |              | `curso`, `alunos`, `professoresRelation`, `notas`, `Chamadas` |

### `professor_turma` — model `ProfessorTurma`

Vínculo muitos-para-muitos entre professores e turmas.

| Coluna          | Tipo | Restrições / observações                 |
| --------------- | ---- | ---------------------------------------- |
| `id_prof_turma` | TEXT | PK                                       |
| `id_professor`  | TEXT | FK → `professor.id_professor` (RESTRICT) |
| `id_turma`      | TEXT | FK → `turma.id_turma` (RESTRICT)         |
| _relações_      |      | `professor`, `turma`                     |

Não há restrição de unicidade em `(id_professor, id_turma)` — duplicatas são evitadas só pelo
código da aplicação.

### `chamada` — model `Chamada`

Uma sessão de chamada.

| Coluna         | Tipo         | Restrições / observações                 |
| -------------- | ------------ | ---------------------------------------- |
| `id_chamada`   | TEXT         | PK                                       |
| `id_professor` | TEXT         | FK → `professor.id_professor` (RESTRICT) |
| `id_turma`     | TEXT         | FK → `turma.id_turma` (RESTRICT)         |
| `data`         | TIMESTAMP(3) | Padrão `now()`                           |
| _relações_     |              | `professor`, `turma`, `presencas`        |

### `presenca` — model `Presenca`

A presença de um aluno em uma chamada.

| Coluna        | Tipo    | Restrições / observações             |
| ------------- | ------- | ------------------------------------ |
| `id_presenca` | TEXT    | PK                                   |
| `id_chamada`  | TEXT    | FK → `chamada.id_chamada` (RESTRICT) |
| `id_aluno`    | TEXT    | FK → `aluno.id_aluno` (RESTRICT)     |
| `presente`    | BOOLEAN | `true` = presente                    |
| _relações_    |         | `chamada`, `aluno`                   |

### `nota` — model `Nota`

Cabeçalho de um lançamento de nota: quem lançou, turma, matéria, avaliação e bimestre.

| Coluna            | Tipo         | Restrições / observações                                          |
| ----------------- | ------------ | ----------------------------------------------------------------- |
| `id_nota`         | TEXT         | PK                                                                |
| `id_professor`    | TEXT         | FK → `professor.id_professor` (RESTRICT)                          |
| `id_turma`        | TEXT         | FK → `turma.id_turma` (RESTRICT)                                  |
| `id_materia`      | TEXT         | FK → `materia.id_materia` (RESTRICT)                              |
| `tipo_avaliacao`  | TEXT         | **Opcional**. O front-end envia `"Prova"`                         |
| `bimestre`        | TEXT         | **Opcional**. O front-end envia `"1º Bimestre"` … `"4º Bimestre"` |
| `data_lancamento` | TIMESTAMP(3) | Padrão `now()`                                                    |
| _relações_        |              | `professor`, `turma`, `materia`, `notasAlunos`                    |

### `nota_aluno` — model `NotaAluno`

O valor da nota de um aluno.

| Coluna          | Tipo             | Restrições / observações                                |
| --------------- | ---------------- | ------------------------------------------------------- |
| `id_nota_aluno` | TEXT             | PK                                                      |
| `id_nota`       | TEXT             | FK → `nota.id_nota` (RESTRICT)                          |
| `id_aluno`      | TEXT             | FK → `aluno.id_aluno` (RESTRICT)                        |
| `valor`         | DOUBLE PRECISION | De 0 a 10, garantido só no `ProfController.lancarNotas` |
| _relações_      |                  | `nota`, `aluno`                                         |

---

## 4. Observações e cuidados de modelagem

Leia antes de escrever consultas ou migrations. Os defeitos em aberto estão em
[known-issues.md](known-issues.md).

- **O `tipo` faz parte dos dados.** Os códigos `0`, `1`, `2` e `3` ficam gravados; renumerar muda o
  perfil de usuários que já existem.
- **Usuário ↔ perfil é 1:1, mas o Prisma enxerga arrays.** `professor.id_user`, `aluno.id_user` e
  `secretaria.id_user` são únicos, porém o `User` declara `professores Professor[]`,
  `alunos Aluno[]` e `secretarias Secretaria[]`. Um `include: { alunos: true }` devolve um array com
  no máximo um elemento. Nada impede um usuário de ter mais de um tipo de perfil.
- **Não há exclusão em cascata.** Quase toda chave estrangeira é `RESTRICT`, então os controllers
  apagam os registros filhos na mão, sem transação:
  - `SecController.excluirUsuario` apaga as linhas de `presenca` e `nota_aluno` do aluno (ou as de
    `professor_turma` do professor) antes do perfil e do `user`. Professor com linhas em `chamada`
    ou `nota` não pode ser excluído (`P2003`).
  - `SecController.delTurma` apaga as **linhas de `aluno` da turma** (os alunos perdem o perfil e o
    `user` deles fica órfão), depois as de `professor_turma` e por fim a turma — mesmo com
    `aluno.id_turma` já sendo `ON DELETE SET NULL`. Veja [D4] #25.
  - `SecController.removerAlunoTurma` também apaga a linha de `aluno` em vez de fazer
    `id_turma = NULL`.
- **`professor_turma` aceita duplicatas.** Não existe restrição única em
  `(id_professor, id_turma)`; os índices únicos de coluna única da primeira migration foram
  removidos e nada entrou no lugar.
- **Um professor por matéria, para todas as turmas.** O `materia.id_prof` vale para a matéria
  inteira, não por turma. Para o professor chegar às turmas, `cadMateria`/`editarMateria` percorrem
  todas as turmas do curso criando linhas em `professor_turma`, e o
  `Back-end/sync_professores_turmas.js` corrige vínculos que faltam. Um modelo por turma × matéria
  faz parte do trabalho planejado no schema ([D3] #24, [M0] #19).
- **Notas: quem grava e quem lê não combinam.** O `lancarNotas` cria **uma `nota` por aluno** a cada
  envio (mais a `nota_aluno`), com `tipo_avaliacao = "Prova"` e `bimestre = "Nº Bimestre"`; lançar
  de novo acrescenta linhas em vez de atualizar. O `GET /aluno/modulo/:modulo` procura
  `tipo_avaliacao` igual a `B1`/`B2`, valores que a interface nunca grava. Veja [D7] #29.
- **Sem unicidade na frequência.** `presenca` não tem único `(id_chamada, id_aluno)` e `chamada` não
  tem único `(id_professor, id_turma, data)`; o controller faz busca-ou-cria pela data e hora exatas
  ([D6] #28).
- **Números guardados como texto.** `ch_total`, `freq_min` e `semestres` são `TEXT`; converta antes
  de fazer contas ou ordenar.
- **Valores provisórios do Google.** Usuários criados pelo `POST /login/google` recebem
  `senha = ''`, `dt_nasc = now()` e `telefone`/`cpf` = `google_<timestamp>` para passar pelas
  restrições ([S5] #18).
- **A `matricula` não é única** no banco, apesar de aparecer na tela como identificador.

---

## 5. Histórico de migrations

Pastas em [`Back-end/prisma/migrations/`](../../Back-end/prisma/migrations/), aplicadas nesta ordem.

| #   | Migration                               | O que fez                                                                                                                                                                                                                                                                                                                            |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `20250504143855_prof_e_turma`           | Schema inicial: `user`, `professor`, `aluno` (`id_turma` obrigatório), `secretaria`, `curso`, `materia`, `turma`, `professor_turma`. `email`/`telefone`/`cpf` únicos, `codigo` único em `curso` e `materia`, `id_user` único nas tabelas de perfil e índices únicos de coluna única em `professor_turma.id_professor` e `.id_turma`. |
| 2   | `20250506004317_ajuste_professor_turma` | Removeu os dois índices únicos de `professor_turma`, transformando-a em vínculo muitos-para-muitos de verdade (sem único composto).                                                                                                                                                                                                  |
| 3   | `20250508225216_add_nota`               | Criou `nota` como uma linha por nota de aluno: `id_aluno`, `id_materia`, `id_professor`, `id_turma`, `valor`, `data`, `bimestre` (inteiro).                                                                                                                                                                                          |
| 4   | `20250509003318_add_chamada`            | Criou `chamada` e `presenca`.                                                                                                                                                                                                                                                                                                        |
| 5   | `20250515005914_add_nota`               | Reestruturação **destrutiva** das notas: removeu `nota.bimestre`, `data`, `id_aluno`, `valor`; adicionou `data_lancamento` e `tipo_avaliacao`; criou `nota_aluno` (`id_nota`, `id_aluno`, `valor`).                                                                                                                                  |
| 6   | `20250606013519_add_id_prof_to_materia` | Tornou `aluno.id_turma` opcional com `ON DELETE SET NULL`; adicionou `materia.id_prof` (opcional, `SET NULL`); adicionou `turma.codigo` (serial, único).                                                                                                                                                                             |
| 7   | `20250615203113_add_bimestre_to_nota`   | Recriou `nota.bimestre`, agora como `TEXT` opcional.                                                                                                                                                                                                                                                                                 |

Observações:

- As migrations 3 e 5 têm o mesmo sufixo `add_nota`. Migrations novas precisam de nome único e
  descritivo.
- O `Back-end/baseline.sql` é um dump SQL antigo salvo em UTF-16. O Prisma não o usa; as migrations
  acima são a fonte da verdade.
- O backlog prevê um novo núcleo do schema gerado como migration única ([M0] #19), seguido da
  religação do back-end ([M0b] #20).

---

## 6. Comandos do dia a dia e regras

Rode dentro de `Back-end/`, com o container no ar (`docker compose up -d`).

| Comando                                       | O que faz                                                                           |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `npx prisma generate`                         | Gera de novo o Prisma Client depois de mudar o schema (o `migrate dev` também gera) |
| `npx prisma migrate dev --name <snake_case>`  | Cria uma migration a partir das mudanças no `schema.prisma` e aplica localmente     |
| `npx prisma migrate deploy`                   | Aplica migrations pendentes sem criar novas                                         |
| `npx prisma migrate status`                   | Mostra migrations pendentes e divergências (drift)                                  |
| `npx prisma migrate reset`                    | Apaga o banco local e reaplica todas as migrations — **perde os dados locais**      |
| `npx prisma studio`                           | Abre um editor visual em `http://localhost:5555`                                    |
| `docker compose exec db psql -U saga -d saga` | Abre o `psql` dentro do container                                                   |

Regras:

1. **Nunca edite uma migration que já foi aplicada** (mergeada ou rodada por outra pessoa). Crie uma
   nova.
2. **Nomeie migrations em `snake_case`**, descrevendo a mudança: `add_unique_professor_turma`, e não
   `ajuste` ou `fix`.
3. **Suba o `schema.prisma` e a pasta da nova migration juntos**, no mesmo PR.
4. **Mudanças destrutivas** (remover ou renomear coluna, passar a exigir valor) precisam ser
   avisadas na descrição do PR, explicando o que acontece com os dados existentes.
5. Atualize este documento sempre que o schema mudar. O checklist de PR está no
   [docs/pt-BR/CONTRIBUTING.md](CONTRIBUTING.md).
