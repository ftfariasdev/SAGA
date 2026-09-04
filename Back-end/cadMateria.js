// Função cadMateria corrigida

export async function cadMateria(req, res) {
    try {
        const { id_curso } = req.params;
        const { nome, descricao, ch_total, freq_min, id_prof } = req.body;

        // Verificar se o curso existe
        const cursoExiste = await prisma.curso.findUnique({
            where: { id_curso }
        });

        if (!cursoExiste) {
            return res.status(404).json({ erro: "Curso não encontrado" });
        }

        // Verificar se o professor existe (se id_prof foi fornecido)
        if (id_prof) {
            const professorExiste = await prisma.professor.findUnique({
                where: { id_professor: id_prof }
            });

            if (!professorExiste) {
                return res.status(404).json({ erro: "Professor não encontrado" });
            }
        }

        // Criar a matéria
        const materia = await prisma.materia.create({
            data: {
                nome,
                descricao,
                ch_total,
                freq_min,
                id_curso,
                // Adicionar id_prof apenas se estiver definido
                ...(id_prof ? { id_prof } : {})
            }
        });

        return res.status(201).json(materia);
    } catch (error) {
        console.error("Erro ao cadastrar matéria:", error);
        return res.status(500).json({ 
            erro: "Erro ao cadastrar matéria", 
            detalhes: error.message 
        });
    }
}
