import { Router } from "express";
import { tokenAuthenticate } from "../middlewares/authenticate.js";
import AlunoController from "../controller/alunoController.js";

export const routerAluno = new Router();
const alunoController = new AlunoController();

routerAluno.get('/aluno/listMateria', tokenAuthenticate, (req, res) => alunoController.listInfoCurso(req, res));

// Nova rota para listar informações do módulo
routerAluno.get('/aluno/modulo/:modulo', tokenAuthenticate, (req, res) => alunoController.listModuloInfo(req, res));

// Nova rota para listar informações por bimestre
routerAluno.get('/aluno/bimestre/:bimestre', tokenAuthenticate, (req, res) => alunoController.listBimestreInfo(req, res));

// Frequencia
routerAluno.get('/aluno/frequencia', tokenAuthenticate, (req, res) => alunoController.getFrequenciaByData(req, res));

routerAluno.get('/aluno/frequencia-geral', tokenAuthenticate, (req, res) => alunoController.getFrequenciaGeral(req, res));

routerAluno.get('/aluno/presencas-dia', tokenAuthenticate, (req, res) => alunoController.getPresencasByDia(req, res));

