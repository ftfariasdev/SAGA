import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import { PrismaClient } from '@prisma/client'
import { routerGeral } from './src/Routes/routesGeral.js'
import { routerAluno } from './src/Routes/routesAluno.js'
import { routerProf } from './src/Routes/routesProf.js'
import { routerSec } from './src/Routes/routesSec.js'

const prisma = new PrismaClient()

dotenv.config()

const PORT = process.env.PORT
export const JWT_SECRET = process.env.JWT_SECRET

const server = express()

// Configuração correta do CORS
server.use(cors({
  origin: 'http://127.0.0.1:5500', // Substitua pela origem exata do seu frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

server.timeout = 300000;
// Aumentando o limite de tamanho do corpo da requisição para 50MB
server.use(express.json({ limit: '50mb' }));
server.use(express.urlencoded({ limit: '50mb', extended: true }));
server.use(routerGeral, routerAluno, routerProf, routerSec)

// Adicionando um endpoint de health check
server.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

server.listen(PORT, ()=>{
    console.log(`Servidor rodando na porta ${PORT}!`)
})