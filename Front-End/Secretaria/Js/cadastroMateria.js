document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('disciplinaForm');
    const cursosSelect = document.getElementById('cursoDisciplina');
    const professoresSelect = document.getElementById('professorDisciplina');

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
            
            // Limpa o select
            cursosSelect.innerHTML = '<option value="">Selecione um curso...</option>';
            
            // Adiciona os cursos ao select
            cursos.forEach(curso => {
                const option = document.createElement('option');
                option.value = curso.id_curso;
                option.textContent = curso.nome;
                cursosSelect.appendChild(option);
            });
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
                window.location.href = '../Login/Login.html';
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

            // Limpa o select
            professoresSelect.innerHTML = '<option value="">Selecione um professor...</option>';

            // Adiciona os professores ao select
            professores.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id_professor;
                option.textContent = prof.nome + (prof.email ? ` (${prof.email})` : '');
                professoresSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar professores. Por favor, tente novamente.');
        }
    }

    // Função para cadastrar matéria
    async function cadastrarMateria(event) {
        event.preventDefault();

        const nomeDisciplina = document.getElementById('nomeDisciplina').value;
        const cargaHoraria = document.getElementById('cargaHorariaDisc').value;
        const frequencia = document.getElementById('frequenciaDisciplina').value;
        const descricao = document.getElementById('descricaoDisciplina').value;
        const cursoId = cursosSelect.value;
        const professorId = professoresSelect.value; // Pega o professor selecionado

        if (!nomeDisciplina || !cargaHoraria || !frequencia || !descricao || !cursoId || !professorId) {
            mostrarModal('Por favor, preencha todos os campos.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                mostrarModal('Usuário não autenticado. Por favor, faça login novamente.');
                window.location.href = '../Login/Login.html';
                return;
            }

            // Inclui o id_prof no cadastro da matéria
            const materiaData = {
                nome: nomeDisciplina,
                descricao: descricao,
                ch_total: cargaHoraria.toString(),
                freq_min: frequencia.toString(),
                id_prof: professorId
            };

            const response = await fetch(`http://localhost:8081/sec/materia/${cursoId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(materiaData)
            });

            if (!response.ok) {
                throw new Error('Erro ao cadastrar matéria');
            }

            const result = await response.json();
            mostrarModal('Matéria cadastrada com sucesso!');
            form.reset();
            
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao cadastrar matéria. Por favor, tente novamente.');
        }
    }

    // Adiciona o evento de submit ao formulário
    form.addEventListener('submit', cadastrarMateria);

    // Carrega os cursos e professores ao iniciar a página
    carregarCursos();
    carregarProfessores();
});