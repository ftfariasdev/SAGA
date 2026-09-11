# 🐳 Ambiente local do SAGA — do zero até a API rodando

🌐 [English](../local-environment.md) | **Português (Brasil)**

Este guia leva qualquer pessoa da equipe de uma máquina limpa até o sistema
rodando **100% local**, sem depender do Supabase nem de internet.

O banco de dados roda em um **container Docker com PostgreSQL 16**. Isso garante
que todo mundo — macOS, Linux Mint e Windows — use exatamente a mesma versão do
Postgres, com o mesmo usuário, a mesma senha e o mesmo schema.

**Tempo estimado:** 20–30 min na primeira vez (a maior parte é download).

---

## 📑 Índice

1. [Visão geral](#1-visão-geral)
2. [Pré-requisitos comuns](#2-pré-requisitos-comuns)
3. [Instalando o Docker](#3-instalando-o-docker)
   - [🍎 macOS](#-macos)
   - [🐧 Linux Mint](#-linux-mint)
   - [🪟 Windows](#-windows-10-e-11)
4. [Configurando o projeto](#4-configurando-o-projeto)
5. [Subindo o banco](#5-subindo-o-banco-de-dados)
6. [Criando as tabelas com o Prisma](#6-criando-as-tabelas-com-o-prisma)
7. [Criando o primeiro usuário](#7-criando-o-primeiro-usuário)
8. [Rodando a API e o front-end](#8-rodando-a-api-e-o-front-end)
9. [Comandos do dia a dia](#9-comandos-do-dia-a-dia)
   - [Ferramentas de qualidade (lint e formatação)](#ferramentas-de-qualidade-lint-e-formatação)
10. [Resolvendo problemas](#10-resolvendo-problemas)

---

## 1. Visão geral

```
┌──────────────────┐      ┌──────────────────┐      ┌────────────────────────┐
│    Front-End     │ HTTP │       API        │ SQL  │  Container PostgreSQL  │
│  (Live Server)   │─────▶│  Node + Express  │─────▶│      saga-db :5432     │
│  127.0.0.1:5500  │      │  localhost:8081  │      │   (volume saga-pgdata) │
└──────────────────┘      └──────────────────┘      └────────────────────────┘
                                 Prisma ORM
```

O que você vai instalar:

| Ferramenta           | Para quê                      | Onde  |
| -------------------- | ----------------------------- | ----- |
| **Git**              | Clonar o repositório          | Todos |
| **Node.js 22 LTS**   | Rodar a API                   | Todos |
| **Docker + Compose** | Subir o Postgres em container | Todos |

> ℹ️ **Você não precisa instalar o PostgreSQL na sua máquina.** Ele vem dentro
> do container. Se você já tiver um Postgres instalado, veja a
> [seção 10](#a-porta-5432-já-está-em-uso).

---

## 2. Pré-requisitos comuns

### Git

| Sistema    | Comando                                                       |
| ---------- | ------------------------------------------------------------- |
| macOS      | `brew install git` (ou já vem com o Xcode Command Line Tools) |
| Linux Mint | `sudo apt install git`                                        |
| Windows    | Baixe em [git-scm.com](https://git-scm.com/download/win)      |

### Node.js 22 LTS

| Sistema    | Comando                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------- |
| macOS      | `brew install node@22`                                                                             |
| Linux Mint | `curl -fsSL https://deb.nodesource.com/setup_22.x \| sudo -E bash - && sudo apt install -y nodejs` |
| Windows    | Baixe o instalador LTS em [nodejs.org](https://nodejs.org)                                         |

Confira no fim:

```bash
git --version
node -v     # deve mostrar v22.x
npm -v
```

---

## 3. Instalando o Docker

Escolha a seção do seu sistema operacional. **Depois de instalar, o resto do
guia é idêntico para todo mundo** — os comandos `docker compose` são os mesmos
nos três sistemas.

---

### 🍎 macOS

Há dois caminhos, e qual você usa depende da sua versão do macOS. Descubra com:

```bash
sw_vers -productVersion
```

#### macOS 14 (Sonoma) ou mais novo → OrbStack

O [OrbStack](https://orbstack.dev) é bem mais leve e rápido que o Docker Desktop
no Mac, e usa exatamente os mesmos comandos.

```bash
brew install --cask orbstack
```

Abra o **OrbStack** pelo Launchpad uma vez. Ele vai pedir sua senha de
administrador para instalar o componente de rede — isso é normal e acontece só
na primeira execução. Deixe-o iniciar junto com o sistema para não precisar
abrir toda vez.

#### macOS 13 (Ventura) ou mais antigo → Colima

O OrbStack e o Docker Desktop **exigem macOS 14+**. No Ventura, use o
[Colima](https://colima.run): mesma CLI, sem interface gráfica.

```bash
brew install colima docker docker-compose
```

> ⏳ **Em Macs Intel isso demora.** Não existe pacote pré-compilado do `lima`
> (a base do Colima) para macOS 13 em Intel, então o Homebrew compila do
> código-fonte — de 10 a 30 minutos. É normal o terminal ficar parado; deixe
> rodando. Em Macs Apple Silicon o download é direto e leva ~2 min.

Ligue a máquina virtual que roda os containers (leva ~1 min na primeira vez):

```bash
colima start --cpu 2 --memory 4
```

> ⚠️ **Importante:** o Colima não sobe sozinho quando você liga o computador.
> Sempre que reiniciar o Mac, rode `colima start` antes de trabalhar. Para deixar
> automático: `brew services start colima`.

Instalado pelo Homebrew, o Compose **não é encontrado automaticamente** pelo
Docker — você vai ver `docker: unknown command: docker compose`. É esperado, e
se resolve apontando o Docker para a pasta de plugins do Homebrew.

Se o arquivo `~/.docker/config.json` **ainda não existir**:

```bash
mkdir -p ~/.docker
echo "{\"cliPluginsExtraDirs\":[\"$(brew --prefix)/lib/docker/cli-plugins\"]}" > ~/.docker/config.json
```

Se **já existir** (não sobrescreva, você perderia as configurações que já tem —
credenciais e contextos, por exemplo), acrescente a chave no JSON com um editor:

```json
{
  "cliPluginsExtraDirs": ["/usr/local/lib/docker/cli-plugins"]
}
```

> 💡 Use `/opt/homebrew/lib/docker/cli-plugins` em Macs Apple Silicon e
> `/usr/local/lib/docker/cli-plugins` em Macs Intel. Na dúvida, rode
> `brew --prefix` para descobrir qual é o seu.

Confira com `docker compose version`.

#### Conferindo

```bash
docker run --rm hello-world
```

Se aparecer _"Hello from Docker!"_, está pronto.

---

### 🐧 Linux Mint

Não use o `docker.io` do repositório do Mint — ele costuma estar desatualizado e
vir sem o plugin `compose` v2. Instale pelo repositório oficial do Docker.

#### 1. Remova versões antigas (se houver)

```bash
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
  sudo apt-get remove -y $pkg
done
```

#### 2. Adicione o repositório oficial

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

> 💡 O `$UBUNTU_CODENAME` é essencial no Mint. O Mint tem codinome próprio
> (`vanessa`, `xia`…) e o Docker não publica pacotes com esses nomes — essa
> variável traduz para o codinome do Ubuntu correspondente (`jammy`, `noble`…).
> Se o comando acima devolver vazio, rode `cat /etc/os-release` e use o valor de
> `UBUNTU_CODENAME` manualmente.

#### 3. Instale

```bash
sudo apt-get install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
```

#### 4. Rode o Docker sem `sudo`

```bash
sudo groupadd -f docker
sudo usermod -aG docker $USER
```

> ⚠️ **Faça logout e login de novo** (ou reinicie) para o grupo valer. Sem isso
> você vai tomar `permission denied` em todo comando `docker`.

#### Conferindo

```bash
docker run --rm hello-world
docker compose version
```

---

### 🪟 Windows 10 e 11

O Docker Desktop no Windows roda em cima do **WSL2** (o subsistema Linux do
Windows). Você precisa dos dois.

#### 1. Instale o WSL2

Abra o **PowerShell como administrador** (botão direito no menu Iniciar →
_Terminal (Admin)_) e rode:

```powershell
wsl --install
```

**Reinicie o computador.** Ao voltar, uma janela do Ubuntu vai abrir pedindo um
nome de usuário e senha — crie-os (são só do Linux interno, podem ser
diferentes dos do Windows).

Confira:

```powershell
wsl -l -v
```

A coluna `VERSION` precisa mostrar **2**. Se mostrar 1, rode
`wsl --set-version Ubuntu 2`.

#### 2. Instale o Docker Desktop

Baixe em [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
e instale mantendo a opção **"Use WSL 2 instead of Hyper-V"** marcada.

Abra o Docker Desktop e espere o ícone da baleia, no canto inferior esquerdo,
ficar **verde** (_Engine running_). Em _Settings → General_, confirme que
**"Start Docker Desktop when you sign in"** está ligado.

> ⚠️ O Docker Desktop precisa estar **aberto** para os comandos funcionarem. Se
> der `error during connect`, é quase sempre isso.

#### Conferindo

No PowerShell (não precisa ser admin):

```powershell
docker run --rm hello-world
docker compose version
```

---

## 4. Configurando o projeto

A partir daqui os comandos são iguais nos três sistemas.

### 1. Clone o repositório

```bash
git clone https://github.com/ftfariasdev/SAGA.git
cd SAGA/Back-end
```

### 2. Instale as dependências da API

```bash
npm install
```

### 3. Crie o arquivo `.env`

O repositório tem um modelo pronto em `Back-end/.env.example`:

```bash
cp .env.example .env      # macOS e Linux
```

```powershell
copy .env.example .env    # Windows
```

Abra o `.env` e gere um `JWT_SECRET` só seu:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cole o resultado na linha `JWT_SECRET=`. Os valores de banco (`saga`/`saga`) já
vêm prontos e não precisam ser alterados — são credenciais de desenvolvimento
local, o banco não fica exposto para fora da sua máquina.

> ⚠️ **Mantenha `PORT=8081`.** O front-end chama `http://localhost:8081` fixo em
> todos os scripts. Com qualquer outra porta a API sobe, mas as telas não
> conseguem falar com ela.

> 🔒 O `.env` está no `.gitignore` e **nunca** deve ser commitado. O
> `.env.example` é que vai para o Git — se você adicionar uma variável nova,
> registre-a lá também (sem o valor secreto).

---

## 5. Subindo o banco de dados

Ainda dentro de `SAGA/Back-end`:

```bash
docker compose up -d
```

Na primeira vez ele baixa a imagem do Postgres (~80 MB). O `-d` deixa rodando em
segundo plano.

Confira se subiu de verdade:

```bash
docker compose ps
```

Você deve ver `saga-db` com status **`Up (healthy)`**. Se aparecer
`Up (health: starting)`, espere uns 10 segundos e rode de novo — o Compose faz
um teste de conexão automático antes de considerar o banco pronto.

---

## 6. Criando as tabelas com o Prisma

O banco subiu vazio. As tabelas são criadas pelas _migrations_ que já estão
versionadas em `Back-end/prisma/migrations/`:

```bash
npx prisma generate       # gera o client tipado do Prisma
npx prisma migrate dev    # cria todas as tabelas no banco local
```

Para conferir que deu certo, abra a interface visual do banco:

```bash
npx prisma studio
```

Ela abre em `http://localhost:5555` e lista as tabelas (`user`, `aluno`,
`professor`, `turma`, `nota`…). Use-a para inspecionar e conferir dados — o
primeiro usuário é criado pela API, na [próxima seção](#7-criando-o-primeiro-usuário),
porque a senha precisa ser gravada com hash.

> 💡 **`migrate dev` vs `migrate deploy`:** use `migrate dev` no dia a dia — ele
> aplica o que falta e avisa se você mudou o `schema.prisma`. O `migrate deploy`
> só aplica migrations existentes, sem criar novas.

---

## 7. Criando o primeiro usuário

O banco novo está **vazio** — nenhum usuário existe ainda. Como todas as telas
exigem login, e criar usuários exige estar logado, você precisa criar a primeira
**secretaria** direto pela API.

A rota `POST /sec/cadSecretaria` é a única que não pede autenticação,
justamente para resolver isso. Com a API rodando (`npm run dev`), em outro
terminal:

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

No Windows, use o PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:8081/sec/cadSecretaria -Method Post `
  -ContentType "application/json" `
  -Body '{"nome":"Secretaria Teste","email":"secretaria@saga.local","senha":"senha123","dt_nasc":"2000-01-15T00:00:00.000Z","telefone":"11999990000","cpf":"00000000191","ft_perfil":""}'
```

Resposta esperada: `{"message":"Cadastro de secretaria concluído com sucesso"}`.

Pronto — agora você faz login no front-end com `secretaria@saga.local` /
`senha123` e cria alunos, professores, cursos e turmas pela interface.

> ℹ️ `telefone` e `cpf` são únicos no banco. Se for criar um segundo usuário de
> teste, mude esses dois valores ou vai tomar erro de duplicidade.

> ⚠️ **Só para ambiente local.** Essa rota fica aberta sem autenticação, ou seja,
> qualquer pessoa poderia criar uma conta de secretaria. Na sua máquina isso não
> é problema, mas **precisa ser tratado antes de qualquer publicação** do sistema.

> 🔜 Fechar essa rota pública está planejado em
> [[C1] #1](https://github.com/ftfariasdev/SAGA/issues/1). Quando essa task for
> entregue, este passo de bootstrap vai mudar — confira a issue antes de seguir.

---

## 8. Rodando a API e o front-end

### API

```bash
npm run dev
```

Deve aparecer `Servidor rodando na porta 8081!`. Teste em outro terminal:

```bash
curl http://localhost:8081/health
# {"status":"UP","timestamp":"2026-09-10T13:00:00.000Z","version":"1.0.0"}
```

### Front-end

O front é HTML/CSS/JS puro e precisa ser servido em `http://127.0.0.1:5500` —
esse endereço está fixo na configuração de CORS em `Back-end/server.js`.

No **VS Code**, instale a extensão **Live Server**, abra a pasta `Front-End`,
clique com o botão direito em `index.html` → **Open with Live Server**.

> ⚠️ Abrir o `index.html` com dois cliques (`file://`) **não funciona** — o
> navegador bloqueia as chamadas para a API por CORS. `http://localhost:5500`
> também não: o CORS aceita exatamente `127.0.0.1`.

---

## 9. Comandos do dia a dia

Todos rodados de dentro de `SAGA/Back-end`:

| O quê                                 | Comando                                       |
| ------------------------------------- | --------------------------------------------- |
| Ligar o banco                         | `docker compose up -d`                        |
| Desligar o banco (mantém os dados)    | `docker compose stop`                         |
| Remover o container (mantém os dados) | `docker compose down`                         |
| **Apagar tudo, inclusive os dados**   | `docker compose down -v`                      |
| Ver se está rodando                   | `docker compose ps`                           |
| Ver os logs do Postgres               | `docker compose logs -f db`                   |
| Abrir o `psql` dentro do container    | `docker compose exec db psql -U saga -d saga` |
| Interface visual do banco             | `npx prisma studio`                           |
| Aplicar migrations novas              | `npx prisma migrate dev`                      |
| Zerar o banco e recriar tudo          | `npx prisma migrate reset`                    |
| Rodar a API                           | `npm run dev`                                 |

**Rotina normal de trabalho:** `docker compose up -d` → `npm run dev`. Só isso.

No **macOS com Colima**, lembre-se de rodar `colima start` antes, depois de cada
reinicialização do computador.

### Ferramentas de qualidade (lint e formatação)

ESLint e Prettier ficam na **raiz do repositório** (pasta `SAGA/`), não em
`Back-end`. Instale uma vez:

```bash
cd ..          # de SAGA/Back-end para SAGA/
npm install
```

| O quê                                 | Comando                |
| ------------------------------------- | ---------------------- |
| Procurar erros de código              | `npm run lint`         |
| Corrigir o que for automático         | `npm run lint:fix`     |
| Verificar a formatação (JS, JSON, MD) | `npm run format:check` |
| Formatar                              | `npm run format`       |

Os mesmos checks rodam no GitHub Actions a cada push e pull request para `main`
e `develop` — rode-os antes de abrir o PR.

> 🪟 **Windows:** com `core.autocrlf=true` (o padrão do Git for Windows), os
> arquivos chegam na sua máquina com quebra de linha CRLF e o `format:check`
> acusa arquivos que estão corretos. Para confirmar que a diferença é só a
> quebra de linha, rode `npx prettier --check --end-of-line auto .`. O CI roda
> em Linux e é ele quem vale. Prefira formatar só os arquivos que você alterou
> (`npx prettier --write caminho/do/arquivo`).

---

## 10. Resolvendo problemas

### A porta 5432 já está em uso

Erro: `Bind for 0.0.0.0:5432 failed: port is already allocated`.

Significa que você já tem um PostgreSQL instalado na máquina. Em vez de
desinstalá-lo, mude a porta do container. No `.env`:

```env
POSTGRES_PORT=5433
DATABASE_URL="postgresql://saga:saga@localhost:5433/saga?schema=public"
```

Depois: `docker compose up -d`.

### A VM do Colima não sobe (Mac Intel)

O Colima avisa que `vmType vz` precisa de macOS 15.5+ em Macs Intel. Na prática
ele costuma funcionar mesmo assim (foi o caso no macOS 13.7 durante a montagem
deste ambiente), mas se a VM travar ao iniciar, recrie com o driver antigo:

```bash
colima delete
colima start --vm-type qemu --cpu 2 --memory 4
```

### `Cannot connect to the Docker daemon`

O Docker não está rodando.

- **macOS + Colima:** `colima start`
- **macOS + OrbStack:** abra o app OrbStack
- **Windows:** abra o Docker Desktop e espere o ícone ficar verde
- **Linux:** `sudo systemctl start docker`

### `permission denied` no Docker (Linux)

Você não está no grupo `docker`, ou entrou nele mas não refez o login:

```bash
sudo usermod -aG docker $USER
```

E então **faça logout e login novamente**. Para testar sem deslogar:
`newgrp docker`.

### `Can't reach database server at localhost:5432` (Prisma)

Nessa ordem:

1. `docker compose ps` — o `saga-db` está `Up (healthy)`?
2. Se estiver `health: starting`, espere 10s.
3. Confira se a porta e as credenciais da `DATABASE_URL` batem com as variáveis
   `POSTGRES_*` no mesmo `.env`.
4. `docker compose logs db` para ver o que o Postgres reclamou.

### O front-end diz que não consegue conectar ao servidor

Nessa ordem:

1. A API está rodando? `curl http://localhost:8081/health` precisa responder.
2. O `.env` está com `PORT=8081`? O front não conhece outra porta.
3. O front está aberto em `http://127.0.0.1:5500` (e não em `localhost:5500` ou
   `file://`)? O console do navegador (F12) mostra erro de CORS quando não está.

### As migrations estão dessincronizadas

Se o Prisma acusar _drift_ ou migrations pendentes e você **não se importa em
perder os dados locais** (que são só de teste):

```bash
npx prisma migrate reset
```

Isso apaga tudo, reaplica todas as migrations do zero e deixa o banco limpo.

### Quero começar do absoluto zero

```bash
docker compose down -v    # apaga o container E o volume com os dados
docker compose up -d
npx prisma migrate dev
```

### Windows: `npm run dev` não encontra o `node`

Feche e reabra o PowerShell depois de instalar o Node — o `PATH` só é atualizado
em terminais novos.

---

## 📎 Arquivos relacionados

| Arquivo                         | O que é                                               |
| ------------------------------- | ----------------------------------------------------- |
| `Back-end/docker-compose.yml`   | Definição do container do Postgres                    |
| `Back-end/.env.example`         | Modelo das variáveis de ambiente (vai para o Git)     |
| `Back-end/.env`                 | Suas variáveis reais (**não** vai para o Git)         |
| `Back-end/prisma/schema.prisma` | Modelo das tabelas                                    |
| `Back-end/prisma/migrations/`   | Histórico versionado do schema                        |
| `package.json` (raiz)           | Scripts `lint`, `lint:fix`, `format` e `format:check` |
| `eslint.config.js` (raiz)       | Regras do ESLint para back-end e front-end            |
| `.prettierrc` (raiz)            | Regras de formatação do Prettier                      |
| `.github/workflows/`            | Checks de lint e formatação no GitHub Actions         |

Próximos passos: [README do Back-end](back-end.md) ·
[README do Front-End](front-end.md) ·
[Como contribuir](CONTRIBUTING.md)
