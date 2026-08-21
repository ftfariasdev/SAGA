import { Router } from "express";
import { LoginController } from "../controller/loginController.js";
import { tokenAuthenticate } from "../middlewares/authenticate.js";
import { SecController } from "../controller/secController.js";
import { ProfController } from "../controller/profController.js";

export const routerProf = new Router();

const profController = new ProfController();

// Rota para buscar todas as turmas associadas ao professor
routerProf.get("/prof/turmas/:id_professor", tokenAuthenticate, (req, res) => profController.listarTurmasProf(req, res));

// Rota para buscar todas as matérias associadas ao professor
routerProf.get("/prof/materias/:id_professor", tokenAuthenticate, (req, res) => profController.materiasProf(req, res));

// Rota para buscar todos os alunos de uma turma associada ao professor
routerProf.get("/prof/alunos/:id_turma", tokenAuthenticate, (req, res) => profController.listarAlunosTurma(req, res));
// Buscar alunos de uma turma (para lançamento de notas)
routerProf.get("/prof/alunos-turma/:id_turma", tokenAuthenticate, (req, res) => profController.listarAlunosTurma(req, res));
// Rota para lançar chamada
routerProf.post("/prof/chamada", tokenAuthenticate, (req, res) => profController.realizarChamada(req, res));

routerProf.get("/prof/chamada/:id_turma", tokenAuthenticate, (req, res) => profController.listarChamada(req, res));

// Rota para buscar chamada específica por data
routerProf.get("/prof/chamada/:id_turma/data", tokenAuthenticate, (req, res) => profController.buscarChamadaPorData(req, res));

routerProf.post("/prof/lancarNotas", tokenAuthenticate, (req, res) => profController.lancarNotas(req, res));

routerProf.get("/professor/user/:id_user", tokenAuthenticate, (req, res) => profController.buscarProfessorPorUser(req, res));

