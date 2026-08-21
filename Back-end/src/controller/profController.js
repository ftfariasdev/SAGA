import prisma from "../util/prisma.js";

export class ProfController {
    async listarTurmasProf(req, res) {
        try {
            const id_user = req.userId;
            if (!id_user) {
                return res.status(400).json({ erro: "Usuário não autenticado." });
            }

            const professor = await prisma.professor.findUnique({
                where: { id_user }
            });

            if (!professor) {
                return res.status(404).json({ erro: "Professor não encontrado." });
            }

            const professorTurmas = await prisma.professorTurma.findMany({
                where: { id_professor: professor.id_professor },
                include: {
                    turma: {
                        include: {
                            curso: true
                        }
                    }
                }
            });

            const turmas = professorTurmas.map(pt => pt.turma);
            return res.status(200).json(turmas);
        } catch (error) {
            console.error("Erro ao buscar turmas do professor:", error);
            return res.status(500).json({ erro: "Erro ao buscar turmas do professor", detalhes: error.message });
        }
    }

    async buscarProfessorPorUser(req, res) {
        try {
            const id_user = req.userId;
            if (!id_user) {
                return res.status(400).json({ erro: "Usuário não autenticado." });
            }

            const professor = await prisma.professor.findUnique({
                where: { id_user }
            });

            if (!professor) {
                return res.status(404).json({ erro: "Professor não encontrado para este usuário." });
            }

            return res.status(200).json(professor);
        } catch (error) {
            console.error("Erro ao buscar professor:", error);
            return res.status(500).json({ erro: "Erro ao buscar professor", detalhes: error.message });
        }
    }

    async listarAlunosTurma(req, res) {
        try {
            const id_user = req.userId;
            if (!id_user) {
                return res.status(400).json({ erro: "Usuário não autenticado." });
            }

            const { id_turma } = req.params;
            if (!id_turma) {
                return res.status(400).json({ erro: "ID da turma é obrigatório." });
            }

            const professor = await prisma.professor.findUnique({
                where: { id_user }
            });

            if (!professor) {
                return res.status(404).json({ erro: "Professor não encontrado." });
            }

            const professorTurma = await prisma.professorTurma.findFirst({
                where: {
                    id_professor: professor.id_professor,
                    id_turma
                }
            });

            if (!professorTurma) {
                return res.status(403).json({ erro: "Professor não tem acesso a esta turma." });
            }

            const alunos = await prisma.aluno.findMany({
                where: { id_turma },
                include: {
                    user: true
                }
            });

            const alunosFormatados = alunos.map(aluno => ({
                id_aluno: aluno.id_aluno,
                ...aluno.user
            }));

            return res.status(200).json(alunosFormatados);
        } catch (error) {
            console.error("Erro ao buscar alunos da turma:", error);
            return res.status(500).json({ erro: "Erro ao buscar alunos da turma", detalhes: error.message });
        }
    }    async materiasProf(req, res) {
        try {
            const id_user = req.userId;
            if (!id_user) {
                return res.status(400).json({ erro: "Usuário não autenticado." });
            }

            // Pode vir do parâmetro da URL ou buscar pelo usuário autenticado
            let id_professor = req.params.id_professor;
            
            if (!id_professor) {
                // Se não veio na URL, busca pelo usuário autenticado
                const professor = await prisma.professor.findUnique({
                    where: { id_user }
                });

                if (!professor) {
                    return res.status(404).json({ erro: "Professor não encontrado." });
                }
                
                id_professor = professor.id_professor;
            } else {
                // Se veio na URL, verifica se o usuário tem acesso a esse professor
                const professor = await prisma.professor.findUnique({
                    where: { 
                        id_professor,
                        id_user // Garante que o usuário autenticado é o dono deste professor
                    }
                });

                if (!professor) {
                    return res.status(403).json({ erro: "Acesso negado a este professor." });
                }
            }

            const materias = await prisma.materia.findMany({
                where: { id_prof: id_professor },
                include: {
                    curso: {
                        select: {
                            nome: true,
                            codigo: true
                        }
                    }
                },
                orderBy: {
                    nome: 'asc'
                }
            });

            return res.status(200).json(materias);
        } catch (error) {
            console.error("Erro ao buscar matérias do professor:", error);
            return res.status(500).json({ erro: "Erro ao buscar matérias do professor", detalhes: error.message });
        }
    }

    async realizarChamada(req, res) {
        try {
            const id_user = req.userId;
            if (!id_user) {
                return res.status(400).json({ erro: "Usuário não autenticado." });
            }

            const { id_turma, data, presencas } = req.body;

            if (!id_turma || !data || !Array.isArray(presencas)) {
                return res.status(400).json({ erro: "Dados obrigatórios: id_turma, data e presencas (array)." });
            }

            const professor = await prisma.professor.findUnique({
                where: { id_user }
            });

            if (!professor) {
                return res.status(404).json({ erro: "Professor não encontrado." });
            }

            const professorTurma = await prisma.professorTurma.findFirst({
                where: {
                    id_professor: professor.id_professor,
                    id_turma
                }
            });

            if (!professorTurma) {
                return res.status(403).json({ erro: "Professor não tem acesso a esta turma." });
            }

            const dataFormatada = new Date(data);
            const resultados = [];

            // Buscar ou criar a chamada para a turma e data
            let chamada = await prisma.chamada.findFirst({
                where: {
                    id_professor: professor.id_professor,
                    id_turma,
                    data: dataFormatada
                }
            });

            if (!chamada) {
                chamada = await prisma.chamada.create({
                    data: {
                        id_professor: professor.id_professor,
                        id_turma,
                        data: dataFormatada
                    }
                });
            }

            for (const presenca of presencas) {
                const { id_aluno, presente } = presenca;

                if (typeof id_aluno !== 'string' || typeof presente !== 'boolean') {
                    return res.status(400).json({ erro: "Cada presença deve ter id_aluno (string) e presente (boolean)." });
                }

                // Buscar ou criar/atualizar a presença do aluno para essa chamada
                let presencaExistente = await prisma.presenca.findFirst({
                    where: {
                        id_chamada: chamada.id_chamada,
                        id_aluno
                    }
                });

                if (presencaExistente) {
                    await prisma.presenca.update({
                        where: { id_presenca: presencaExistente.id_presenca },
                        data: { presente }
                    });
                } else {
                    await prisma.presenca.create({
                        data: {
                            id_chamada: chamada.id_chamada,
                            id_aluno,
                            presente
                        }
                    });
                }

                resultados.push({ id_aluno, presente });
            }

            return res.status(200).json({ mensagem: "Chamada realizada com sucesso!", resultados });
        } catch (error) {
            console.error("Erro ao realizar chamada:", error);
            return res.status(500).json({ erro: "Erro ao realizar chamada", detalhes: error.message });
        }
    }

    async listarChamada(req, res) {
        try {
            const id_user = req.userId;
            if (!id_user) {
                return res.status(400).json({ erro: "Usuário não autenticado." });
            }

            const { id_turma } = req.params;
            if (!id_turma) {
                return res.status(400).json({ erro: "ID da turma é obrigatório." });
            }

            const professor = await prisma.professor.findUnique({
                where: { id_user }
            });

            if (!professor) {
                return res.status(404).json({ erro: "Professor não encontrado." });
            }

            const professorTurma = await prisma.professorTurma.findFirst({
                where: {
                    id_professor: professor.id_professor,
                    id_turma
                }
            });

            if (!professorTurma) {
                return res.status(403).json({ erro: "Professor não tem acesso a esta turma." });
            }

            const chamadas = await prisma.chamada.findMany({
                where: { id_turma },
                include: {
                    aluno: {
                        include: {
                            user: true
                        }
                    },
                    materia: true
                },
                orderBy: [
                    { data: 'desc' },
                    { id_aluno: 'asc' }
                ]
            });

            return res.status(200).json(chamadas);
        } catch (error) {
            console.error("Erro ao listar chamadas:", error);
            return res.status(500).json({ erro: "Erro ao listar chamadas", detalhes: error.message });
        }
    }

    async lancarNotas(req, res) {
        try {
            const id_user = req.userId;
            if (!id_user) {
                return res.status(400).json({ erro: "Usuário não autenticado." });
            }

            const { id_turma, id_materia, tipo_avaliacao, bimestre, notas } = req.body;

            if (!id_turma || !id_materia || !tipo_avaliacao || !bimestre || !Array.isArray(notas)) {
                return res.status(400).json({ erro: "Dados obrigatórios: id_turma, id_materia, tipo_avaliacao, bimestre e notas (array)." });
            }

            const professor = await prisma.professor.findUnique({
                where: { id_user }
            });

            if (!professor) {
                return res.status(404).json({ erro: "Professor não encontrado." });
            }

            const professorTurma = await prisma.professorTurma.findFirst({
                where: {
                    id_professor: professor.id_professor,
                    id_turma
                }
            });

            if (!professorTurma) {
                return res.status(403).json({ erro: "Professor não tem acesso a esta turma." });
            }

            const materia = await prisma.materia.findFirst({
                where: {
                    id_materia,
                    id_prof: professor.id_professor // Corrigido de id_professor para id_prof
                }
            });

            if (!materia) {
                return res.status(403).json({ erro: "Professor não tem acesso a esta matéria." });
            }

            const resultados = [];

            for (const notaAluno of notas) {
                const { id_aluno, valor } = notaAluno;

                if (typeof id_aluno !== 'string' || typeof valor !== 'number') {
                    return res.status(400).json({ erro: "Cada nota deve ter id_aluno (string) e valor (number)." });
                }

                if (valor < 0 || valor > 10) {
                    return res.status(400).json({ erro: "Valor da nota deve estar entre 0 e 10." });
                }                // Criar nova nota
                const novaNota = await prisma.nota.create({
                    data: {
                        id_professor: professor.id_professor,
                        id_turma,
                        id_materia,
                        tipo_avaliacao,
                        bimestre,
                        data_lancamento: new Date(),
                        notasAlunos: {
                            create: {
                                id_aluno,
                                valor
                            }
                        }
                    }
                });

                resultados.push({ id_aluno, valor });
            }

            return res.status(200).json({ mensagem: "Notas lançadas/atualizadas com sucesso!", resultados });
        } catch (error) {
            console.error("Erro ao lançar notas:", error);
            return res.status(500).json({ erro: "Erro ao lançar notas", detalhes: error.message });
        }
    }

    async buscarChamadaPorData(req, res) {
        try {
            const id_user = req.userId;
            if (!id_user) {
                return res.status(400).json({ erro: "Usuário não autenticado." });
            }

            const { id_turma } = req.params;
            const { data } = req.query;

            if (!id_turma || !data) {
                return res.status(400).json({ erro: "ID da turma e data são obrigatórios." });
            }

            const professor = await prisma.professor.findUnique({
                where: { id_user }
            });

            if (!professor) {
                return res.status(404).json({ erro: "Professor não encontrado." });
            }

            const professorTurma = await prisma.professorTurma.findFirst({
                where: {
                    id_professor: professor.id_professor,
                    id_turma
                }
            });

            if (!professorTurma) {
                return res.status(403).json({ erro: "Professor não tem acesso a esta turma." });
            }

            // Converte a data para o formato correto
            const dataInicio = new Date(data + "T00:00:00.000Z");
            const dataFim = new Date(data + "T23:59:59.999Z");

            const chamada = await prisma.chamada.findFirst({
                where: {
                    id_turma,
                    data: {
                        gte: dataInicio,
                        lte: dataFim
                    }
                },
                include: {
                    presencas: {
                        include: {
                            aluno: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    }
                }
            });

            if (!chamada) {
                return res.status(404).json({ erro: "Nenhuma chamada encontrada para esta data." });
            }

            return res.status(200).json(chamada);

        } catch (error) {
            console.error("Erro ao buscar chamada por data:", error);
            return res.status(500).json({ erro: "Erro ao buscar chamada por data", detalhes: error.message });
        }
    }
}