document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('disciplinaForm');
    const params = new URLSearchParams(window.location.search);
    const materiaId = params.get('id');    // Elementos do formulário
    const nomeDisciplina = document.getElementById('nomeDisciplina');
    const cargaHoraria = document.getElementById('cargaHorariaDisc');
    const serie = document.getElementById('serieDisciplina');
    const frequencia = document.getElementById('frequenciaDisciplina');
    const descricao = document.getElementById('descricaoDisciplina');
    const cursoDisciplina = document.getElementById('cursoDisciplina');
    const professorDisciplina = document.getElementById('professorDisciplina');    // Função para carregar cursos
    function mostrarModal(mensagem) {
        const antigo = document.querySelector('.modal-overlay');
        if (antigo) antigo.remove();
    
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
    
        const box = document.createElement('div');
        box.className = 'modal-box';
    
        const texto = document.createElement('p');
        texto.innerText = mensagem;
    
        const botao = document.createElement('button');
        botao.innerText = 'OK';
        botao.onclick = () => overlay.remove();
    
        box.appendChild(texto);
        box.appendChild(botao);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    async function carregarCursos() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                mostrarModal('Usuário não autenticado. Por favor, faça login novamente.');
                window.location.href = '../Login/Login.html';
                return;
            }

            const response = await fetch('http://localhost:8081/sec/listarCursos', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar cursos');
            }

            const cursos = await response.json();
            cursoDisciplina.innerHTML = '<option value="">Selecione um curso...</option>';
            cursos.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso.id_curso;
                option.textContent = curso.nome;
                cursoDisciplina.appendChild(option);
            });

            return cursos;
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar cursos. Por favor, tente novamente.');
        }
    }
    
    // Função para carregar professores
    async function carregarProfessores() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                mostrarModal('Usuário não autenticado. Por favor, faça login novamente.');
                window.location.href = '../../Login/Login.html';
                return;
            }

            const response = await fetch('http://localhost:8081/sec/listarProfessores', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar professores');
            }

            const professores = await response.json();
            professorDisciplina.innerHTML = '<option value="">Selecione um professor...</option>';
            
            professores.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id_professor;
                option.textContent = prof.nome + (prof.email ? ` (${prof.email})` : '');
                professorDisciplina.appendChild(option);
            });
            
            return professores;
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar professores. Por favor, tente novamente.');
        }
    }    // Função para carregar dados da matéria
    async function carregarDadosMateria() {
        try {
            const token = localStorage.getItem('token');
            const cursos = await carregarCursos();
            await carregarProfessores();
            
            // Primeiro, tente carregar a matéria diretamente pelo ID
            const response = await fetch(`http://localhost:8081/sec/listarMaterias/${cursoDisciplina.value}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Erro ao carregar dados da matéria');
            }
            
            const materias = await response.json();
            const materiaEncontrada = materias.find(m => m.id_materia === materiaId);
            
            if (!materiaEncontrada) {
                // Se não encontrar diretamente, tente buscar nos cursos
                let materiaFound = null;
                for (const curso of cursos) {
                    const materia = curso.materias?.find(m => m.id_materia === materiaId);
                    if (materia) {
                        materiaFound = materia;
                        cursoDisciplina.value = curso.id_curso;
                        break;
                    }
                }
                
                if (!materiaFound) {
                    mostrarModal('Matéria não encontrada');
                    window.location.href = 'ListarMaterias.html';
                    return;
                }
                
                // Preencher o formulário com os dados da matéria encontrada
                nomeDisciplina.value = materiaFound.nome;
                cargaHoraria.value = materiaFound.ch_total;
                frequencia.value = materiaFound.freq_min;
                descricao.value = materiaFound.descricao;
                
                // Verificar se há professor atribuído
                if (materiaFound.id_prof) {
                    professorDisciplina.value = materiaFound.id_prof;
                }
            } else {
                // Preencher o formulário com os dados da matéria encontrada diretamente
                nomeDisciplina.value = materiaEncontrada.nome;
                cargaHoraria.value = materiaEncontrada.ch_total;
                frequencia.value = materiaEncontrada.freq_min;
                descricao.value = materiaEncontrada.descricao;
                
                // Verificar se há professor atribuído
                if (materiaEncontrada.id_prof) {
                    professorDisciplina.value = materiaEncontrada.id_prof;
                } else if (materiaEncontrada.professor && materiaEncontrada.professor.id_professor) {
                    professorDisciplina.value = materiaEncontrada.professor.id_professor;
                }
            }
            
            // Desabilitar a mudança de curso
            cursoDisciplina.disabled = true;

        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar dados da matéria. Por favor, tente novamente.');
        }
    }

    // Função para salvar alterações
    async function salvarAlteracoes(event) {
        event.preventDefault();

        if (!nomeDisciplina.value || !cargaHoraria.value || !frequencia.value || !descricao.value) {
            mostrarModal('Por favor, preencha todos os campos obrigatórios.');
            return;
        }        try {
            const token = localStorage.getItem('token');
            const materiaData = {
                nome: nomeDisciplina.value,
                descricao: descricao.value,
                id_prof: professorDisciplina.value || null,
                ch_total: cargaHoraria.value.toString(),
                freq_min: frequencia.value.toString()
            };

            const response = await fetch(`http://localhost:8081/sec/editarMateria/${materiaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(materiaData)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar matéria');
            }

            mostrarModal('Matéria atualizada com sucesso!');
            window.location.href = 'ListarMaterias.html';
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao atualizar matéria. Por favor, tente novamente.');
        }
    }

    // Alterar o texto do botão de submit
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = 'Salvar Alterações';

    // Adicionar listener para o formulário
    form.addEventListener('submit', salvarAlteracoes);

    // Carregar dados iniciais
    await carregarDadosMateria();
});