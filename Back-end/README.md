# Node_authentication

<img src="https://upload.wikimedia.org/wikipedia/commons/6/64/Expressjs.png" alt="Express Logo" width="200">    <img src="https://cdn.worldvectorlogo.com/logos/jwt-3.svg" alt="JWT Logo" width="50" height="50">


### Configuration .env
```.env

DATABASE_URL="your database URL"
PORT=your door
JWT_SECRET=add the key you created

```

### Create application
```.

npm init -y

```

### necessary facilities
```.

npm install express dotenv bcrypt jsonwebtoken

```

---


### Prisma instalation
```.

npm install prisma @prisma/client

```

### Initializing Prisma
```.

npx prisma init

```

### Create Tables in the Database

```.

npx prisma migrate dev --name init

```

* Ou sincronizar o banco sem criar migrações:

```.

npx prisma db push

```

* After that, just start the application with Node.

```.

node name_file.js

```

