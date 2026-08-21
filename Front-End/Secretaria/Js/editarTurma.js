document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('editarTurmaForm');
    const cursosSelect = document.getElementById('cursosSelect');
    const params = new URLSearchParams(window.location.search);
    const turmaId = params.get('id');

    // Elementos do formulário
    const nomeTurma = document.getElementById('nomeTurma');
    const dataInicio = document.getElementById('dataInicio');
    const semestres = document.getElementById('semestres');

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


    // Função para carregar cursos
    async function carregarCursos() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                mostrarModal('Usuário não autenticado. Por favor, faça login novamente.');
                window.location.href = '../../Login/Login.html';
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
            cursosSelect.innerHTML = '<option value="">Selecione um curso...</option>';
            cursos.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso.id_curso;
                option.textContent = curso.nome;
                cursosSelect.appendChild(option);
            });

            return cursos;
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar cursos. Por favor, tente novamente.');
        }
    }

    // Função para carregar dados da turma
    async function carregarDadosTurma() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8081/sec/Turma/listar', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar dados da turma');
            }

            const turmas = await response.json();
            const turma = turmas.find(t => t.id_turma === turmaId);

            if (!turma) {
                mostrarModal('Turma não encontrada');
                window.location.href = 'ListarTurmas.html';
                return;
            }

            // Preencher o formulário
            nomeTurma.value = turma.nome;
            dataInicio.value = turma.dt_inicio.split('T')[0]; // Formata a data para YYYY-MM-DD
            semestres.value = turma.semestres;
            cursosSelect.value = turma.id_curso;

        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar dados da turma. Por favor, tente novamente.');
        }
    }

    // Função para salvar alterações
    async function salvarAlteracoes(event) {
        event.preventDefault();

        if (!nomeTurma.value || !dataInicio.value || !semestres.value || !cursosSelect.value) {
            mostrarModal('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const turmaData = {
                nome: nomeTurma.value,
                dt_inicio: dataInicio.value,
                semestres: parseInt(semestres.value),
                id_curso: cursosSelect.value
            };

            const response = await fetch(`http://localhost:8081/sec/Turma/editar/${turmaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(turmaData)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar turma');
            }

            mostrarModal('Turma atualizada com sucesso!');
            window.location.href = 'ListarTurmas.html';
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao atualizar turma. Por favor, tente novamente.');
        }
    }

    // Adicionar listener para o formulário
    form.addEventListener('submit', salvarAlteracoes);

    // Carregar dados iniciais
    await carregarCursos();
    await carregarDadosTurma();
});
