// Script para sincronizar vínculos de professores com turmas
// Este script deve ser executado para garantir que todos os professores vinculados a matérias
// também estejam vinculados às turmas correspondentes
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncProfessoresTurmas() {
    try {
        console.log('Iniciando sincronização de professores com turmas...');
        
        // Buscar todas as matérias que têm professor associado
        const materiasComProfessor = await prisma.materia.findMany({
            where: {
                id_prof: { not: null }
            },
            include: {
                professor: true,
                curso: {
                    include: {
                        turmas: true
                    }
                }
            }
        });
        
        console.log(`Encontradas ${materiasComProfessor.length} matérias com professores associados`);
        
        let vinculosCriados = 0;
        
        // Para cada matéria com professor, verificar se o professor está vinculado às turmas do curso
        for (const materia of materiasComProfessor) {
            const professor = materia.professor;
            const turmas = materia.curso.turmas;
            
            console.log(`Verificando vínculos do professor ${professor.id_professor} com ${turmas.length} turmas do curso ${materia.curso.nome}`);
            
            // Para cada turma do curso, verificar se o professor já está vinculado
            for (const turma of turmas) {
                // Verificar se o vínculo já existe
                const vinculoExistente = await prisma.professorTurma.findFirst({
                    where: {
                        id_professor: professor.id_professor,
                        id_turma: turma.id_turma
                    }
                });
                
                // Se não existir, criar o vínculo
                if (!vinculoExistente) {
                    await prisma.professorTurma.create({
                        data: {
                            id_professor: professor.id_professor,
                            id_turma: turma.id_turma
                        }
                    });
                    
                    vinculosCriados++;
                    console.log(`Vínculo criado: Professor ${professor.id_professor} - Turma ${turma.id_turma} (${turma.nome})`);
                }
            }
        }
        
        console.log(`Sincronização concluída! ${vinculosCriados} vínculos criados.`);
    } catch (error) {
        console.error('Erro ao sincronizar professores com turmas:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncProfessoresTurmas();
