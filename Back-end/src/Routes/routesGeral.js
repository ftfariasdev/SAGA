import { Router } from "express";
import { LoginController } from "../controller/loginController.js";
import { commonController } from "../controller/commonController.js";
import { tokenAuthenticate } from "../middlewares/authenticate.js";

export const routerGeral = new Router();
const loginController = new LoginController();
const controller = new commonController();

routerGeral.post('/login', loginController.auth);
routerGeral.post('/login/google', loginController.authGoogle); // ROTA GOOGLE
routerGeral.get('/token', tokenAuthenticate, (req, res) => {
    console.log("Verificação de token bem-sucedida para o usuário ID:", req.userId);
    return res.status(200).json({ 
        message: "Token válido", 
        userId: req.userId,
        timestamp: new Date().toISOString()
    });
});

// Endpoint de verificação de saúde do servidor (sem autenticação)
routerGeral.get('/health', (req, res) => {
    return res.status(200).json({ 
        status: "UP", 
        timestamp: new Date().toISOString(),
        version: "1.0.0"
    });
});

routerGeral.get('/info/:id_user', tokenAuthenticate, controller.info);
routerGeral.put('/editarInfo', tokenAuthenticate, controller.editarInfo);


