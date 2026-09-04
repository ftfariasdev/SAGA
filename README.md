  # 🏫 Sistema de Gestão Escolar - SAGA
  <img src="SAGA/Front-End/Img/login_img.PNG" alt="Lista de Alunos" />
  

Sistema completo para gerenciamento de escolas, com funcionalidades robustas de administração de alunos, turmas, professores e matrículas. Ideal para escolas de pequeno e médio porte que desejam informatizar seus processos com uma solução web moderna e escalável.

---

## 🧾 Índice

- [🧠 Sobre o Projeto](#-sobre-o-projeto)  
- [🛠️ Tecnologias Utilizadas](#-tecnologias-utilizadas)  
- [📥 Instalação](#-instalação)  
- [🚀 Como Rodar o Projeto](#-como-rodar-o-projeto)  
- [📌 Funcionalidades](#-funcionalidades)  
- [🖼️ Imagens](#-imagens)  
- [🤝 Contribuições](#-contribuições)  
- [🧑‍💻 Desenvolvedores](#-desenvovedores)  
- [📄 Licença](#-licença)  

---

## 🧠 Sobre o Projeto

O **Sistema de Administração e Gestão Acadêmica** foi desenvolvido para facilitar a administração acadêmica, proporcionando uma interface intuitiva tanto para o time pedagógico quanto administrativo.  
A estrutura do sistema é modular e escalável, permitindo expansões futuras como integração de boletins, presença, mensagens internas e mais.

---

## 🛠️ Tecnologias Utilizadas

### 🔙 Backend
- [Node.js](https://nodejs.org) – Ambiente de execução JavaScript
- [Express.js](https://expressjs.com) – Framework web minimalista
- [Prisma ORM](https://www.prisma.io) – ORM moderno e tipado
- [PostgreSQL 16](https://www.postgresql.org) – Banco de dados relacional, rodando em container
- [Docker Compose](https://docs.docker.com/compose/) – Ambiente de banco idêntico para toda a equipe
- [Dotenv](https://www.npmjs.com/package/dotenv) – Variáveis de ambiente

### 🎨 Frontend
- HTML5 + CSS3
- JavaScript Vanilla (ES6+)
- Layout responsivo com Flexbox/Grid

---

## 📥 Instalação

O projeto roda **100% local**: o banco de dados sobe em um container Docker, sem
depender de serviços na nuvem.

> 📘 **Primeira vez configurando a máquina?** Siga o guia completo em
> **[docs/AMBIENTE-LOCAL.md](docs/AMBIENTE-LOCAL.md)** — ele cobre a instalação
> do Docker passo a passo no **macOS**, **Linux Mint** e **Windows**.

O resumo, para quem já tem Node.js 22 e Docker instalados:

### 1️⃣ Clone o repositório
```bash
git clone https://github.com/SAGA-TCC/SAGA.git
cd SAGA/Back-end
```

### 2️⃣ Instale as dependências
```bash
npm install
```

### 3️⃣ Configure as variáveis de ambiente
```bash
cp .env.example .env     # no Windows: copy .env.example .env
```

Os valores já vêm prontos para o ambiente local. Só gere um `JWT_SECRET` próprio:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚀 Como Rodar o Projeto

### 🐳 Banco de dados
```bash
docker compose up -d      # sobe o PostgreSQL 16 em container
npx prisma migrate dev    # cria as tabelas
```

### 🔌 Backend (API REST)
```bash
npm run dev
```

Servidor disponível em: `http://localhost:3000` (teste com `/health`).

### 👤 Primeiro acesso

O banco novo vem vazio e todas as telas exigem login. Crie a primeira secretaria
pela API — é a única rota aberta, feita para esse bootstrap:

```bash
curl -X POST http://localhost:3000/sec/cadSecretaria \
  -H "Content-Type: application/json" \
  -d '{"nome":"Secretaria Teste","email":"secretaria@saga.local","senha":"senha123","dt_nasc":"2000-01-15T00:00:00.000Z","telefone":"11999990000","cpf":"00000000191","ft_perfil":""}'
```

Depois é só logar com `secretaria@saga.local` / `senha123`.

### 🌐 Frontend
Abra a pasta `Front-End` no VSCode e inicie o `index.html` com o
[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).

> ⚠️ O front precisa ser servido em `http://127.0.0.1:5500` — esse endereço está
> fixo na configuração de CORS do backend. Abrir o arquivo direto pelo navegador
> (`file://`) não funciona.

---

## 📌 Funcionalidades

- ✅ Cadastro, edição e remoção de **alunos**
- ✅ Gerenciamento de **professores**
- ✅ Criação e atribuição de **turmas**
- ✅ Relacionamento entre alunos, professores e turmas
- ✅ Matrículas
- ✅ Lançamento de notas
- ✅ Sistema de frequência

---

## 🖼️ Imagens

### 📋 Chamada  
![Lista de Alunos](https://via.placeholder.com/800x400.png?text=Lista+de+Alunos)

### 🧑 Cadastro de Professores  
![Cadastro de Professores](https://via.placeholder.com/800x400.png?text=Cadastro+de+Professores)

### 🏫 Gerenciamento de Turmas  
![Gerenciamento de Turmas](https://via.placeholder.com/800x400.png?text=Gerenciamento+de+Turmas)

---

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se livre para abrir uma _issue_ ou enviar um _pull request_.

1. Fork este repositório  
2. Crie sua feature (`git checkout -b minha-feature`)  
3. Commit suas alterações (`git commit -m 'feat: minha nova feature'`)  
4. Push para a branch (`git push origin minha-feature`)  
5. Abra um Pull Request  

---

## 🧑‍💻 Desenvolvedores 

Desenvolvido por [Felipe Farias](https://github.com/Felipe-dev01), Brenno Mello, Jéssica Oliveira e Hugo Rocha.  

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

---
