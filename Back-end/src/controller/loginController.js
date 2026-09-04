import bcrypt from 'bcryptjs';
import prisma from "../util/prisma.js";
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../../server.js";
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


export class LoginController {
    async auth(req, res) {
        const { email, senha } = req.body;        const userExists = await prisma.user.findUnique({ where: { email } });


        if (!userExists) {
            return res.status(401).json({ error: "Cadastro não existe. Entre em contato com a secretaria para realizar seu cadastro." });
        }

        const isPasswordValid = await bcrypt.compare(senha, userExists.senha);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Senha incorreta!" });
        }

        const id_user = userExists.id_user;
        const token = jwt.sign({ userId: id_user }, JWT_SECRET, { expiresIn: '10h' });
        const tipo = userExists.tipo;
        const nome = userExists.nome;
        const emailDoBanco = userExists.email;
        const ft_perfil = userExists.ft_perfil || '';
        
        console.log("Logado com sucesso!");
        return res.json({ token, tipo, id_user, nome, emailDoBanco, ft_perfil });

    }

    async authGoogle(req, res) {
        const { id_token } = req.body;
        if (!id_token) {
            return res.status(400).json({ error: "Token do Google não fornecido" });
        }

        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: id_token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (err) {
            return res.status(401).json({ error: "Token do Google inválido" });
        }

        const payload = ticket.getPayload();
        const email = payload.email;
        const nome = payload.name;
        const ft_perfil = payload.picture;        // Busca ou cria usuário no banco
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    nome,
                    ft_perfil,
                    senha: '', // Não tem senha, pois é login social
                    tipo: 0, // 0 para indicar login pelo Google (ajuste conforme sua lógica)
                    dt_nasc: new Date(), // Data atual como fallback
                    telefone: `google_${Date.now()}`, // Valor temporário único
                    cpf: `google_${Date.now()}` // Valor temporário único
                }
            });
        }

        const id_user = user.id_user;
        const token = jwt.sign({ userId: id_user }, JWT_SECRET, { expiresIn: '10h' });
        const tipo = user.tipo;

        return res.json({ token, tipo, id_user, nome, emailDoBanco: email, ft_perfil });
    }
}