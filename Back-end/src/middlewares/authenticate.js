import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

// Obtém o segredo do JWT das variáveis de ambiente
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_padrao';

export const tokenAuthenticate = async (req, res, next) => {
    try {
        console.log("Verificando autenticação do token...");
        console.log("URL requisitada:", req.originalUrl);

        // Verifica se existe o cabeçalho de autorização
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.error("Token não fornecido no cabeçalho de autorização");
            return res.status(401).json({ error: "Token de autenticação não fornecido" });
        }

        // Extrai o token do cabeçalho Bearer
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
            console.error("Formato do token inválido");
            return res.status(401).json({ error: "Formato do token inválido" });
        }

        console.log("Token extraído:", token.substring(0, 10) + "...");

        try {
            // Verifica o token
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log("Token válido para o usuário ID:", decoded.userId);
            // Adiciona o ID do usuário ao objeto request
            req.userId = decoded.userId;
            
            // Continua para o próximo middleware ou rota
            next();
        } catch (jwtError) {
            console.error("Erro na verificação do token:", jwtError.name, jwtError.message);
            return res.status(401).json({ 
                error: "Token inválido ou expirado", 
                detalhes: jwtError.message 
            });
        }
    } catch (error) {
        console.error("Erro inesperado na autenticação:", error);
        return res.status(500).json({ 
            error: "Erro interno na autenticação",
            detalhes: error.message 
        });
    }
};


