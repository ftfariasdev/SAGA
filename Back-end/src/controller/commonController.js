import prisma from '../util/prisma.js'


export class commonController {
    async info(req, res) {
        const id_user = req.params.id_user;
        try {
            // Verificar se o usuário existe
            const user = await prisma.user.findUnique({
                where: { id_user }
            });

            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            // Retorna os dados do usuário
            return res.status(200).json({
                id_user: user.id_user,
                matricula: user.matricula,
                cpf: user.cpf,
                nome: user.nome,
                email: user.email,
                dt_nasc: user.dt_nasc,
                telefone: user.telefone,
                turma: user.turma
            });

        } catch (error) {
            console.error('Erro ao buscar informações do usuário:', error);
            return res.status(500).json({ message: 'Erro ao buscar informações do usuário', error: error.message });
        }
    }

    async editarInfo(req, res) {
        const { id_user, nome, email, dt_nasc, telefone, ft_perfil } = req.body;
        
        console.log('Solicitação de atualização recebida:', { id_user, nome, email, dt_nasc, telefone });
        
        try {
            // Validação dos dados recebidos
            if (!id_user) {
                return res.status(400).json({ message: 'ID do usuário é obrigatório' });
            }

            // Verificar se o usuário existe
            const userExists = await prisma.user.findUnique({
                where: { id_user }
            });

            if (!userExists) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            // Dados para atualização com validação
            const updateData = {};
            
            if (nome !== undefined) updateData.nome = nome;
            if (email !== undefined) updateData.email = email;
            
            // Tratamento especial para a data
            if (dt_nasc) {
                try {
                    updateData.dt_nasc = new Date(dt_nasc);
                    if (isNaN(updateData.dt_nasc.getTime())) {
                        return res.status(400).json({ message: 'Data de nascimento inválida' });
                    }
                } catch (error) {
                    return res.status(400).json({ message: 'Data de nascimento em formato inválido' });
                }
            }
            
            // Tratamento para telefone
            if (telefone !== undefined) {
                updateData.telefone = telefone;
                
                // Verificar se o telefone já existe para outro usuário
                const existingUserWithPhone = await prisma.user.findFirst({
                    where: {
                        telefone: telefone,
                        id_user: { not: id_user }
                    }
                });
                
                if (existingUserWithPhone) {
                    return res.status(400).json({ message: 'Este número de telefone já está em uso por outro usuário' });
                }
            }
            
            // Atualizar a foto de perfil se fornecida
            if (ft_perfil !== undefined) {
                updateData.ft_perfil = ft_perfil;
            }

            console.log('Dados para atualização:', updateData);

            // Atualizar o usuário
            const updatedUser = await prisma.user.update({
                where: { id_user },
                data: updateData
            });

            console.log('Usuário atualizado com sucesso:', updatedUser.id_user);

            // Sanitizar a resposta
            const sanitizedUser = {
                id_user: updatedUser.id_user,
                nome: updatedUser.nome,
                email: updatedUser.email,
                dt_nasc: updatedUser.dt_nasc ? updatedUser.dt_nasc.toISOString() : null,
                telefone: updatedUser.telefone,
                tipo: updatedUser.tipo
            };

            return res.status(200).json({
                message: 'Informações atualizadas com sucesso',
                user: sanitizedUser
            });
        } catch (error) {
            console.error('Erro ao atualizar informações:', error);
            
            // Tratamento específico para erros conhecidos
            if (error.code === 'P2002') {
                return res.status(400).json({ 
                    message: 'Erro de restrição única', 
                    error: 'Já existe um usuário com este e-mail ou telefone'
                });
            }
            
            return res.status(500).json({ 
                message: 'Erro ao atualizar informações', 
                error: error.message,
                stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
            });
        }
    }
}
