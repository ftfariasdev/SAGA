document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarModal('Usuário não autenticado. Por favor, faça login novamente.');
        window.location.href = '../../Login/Login.html';
        return;
    }

    // Carregar a lista de cursos para o select
    carregarCursos();

    // Configurar o formulário para envio
    const form = document.getElementById('cadastrarTurmaForm');
    if (form) {
        form.addEventListener('submit', cadastrarTurma);
    }
});

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

// Função para carregar cursos disponíveis para o select
async function carregarCursos() {
    const token = localStorage.getItem('token');
    const selectCursos = document.getElementById('cursosSelect');

    try {
        const response = await fetch('http://localhost:8081/sec/listarCursos', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar cursos');
        }

        const cursos = await response.json();
        console.log('Cursos recebidos:', cursos); // Adicionando log para debug

        // Limpar opções existentes, exceto a primeira
        while (selectCursos.options.length > 1) {
            selectCursos.remove(1);
        }

        // Adicionar cursos ao select
        cursos.forEach(curso => {
            console.log('Processando curso:', curso); // Log para cada curso
            const option = document.createElement('option');
            // Verificando ambas as possibilidades de nome da propriedade do ID
            const cursoId = curso.id_curso;
            option.value = cursoId;
            option.textContent = curso.nome;
            selectCursos.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar cursos:', error);
        mostrarModal('Não foi possível carregar a lista de cursos. Por favor, tente novamente mais tarde.');
    }
}

// Função para cadastrar uma nova turma
async function cadastrarTurma(event) {
    event.preventDefault(); const nomeTurma = document.getElementById('nomeTurma').value.trim();
    const dataInicio = document.getElementById('dataInicio').value;
    const semestres = document.getElementById('semestres').value;
    const idCurso = document.getElementById('cursosSelect').value;

    // Validações básicas
    if (!nomeTurma) {
        mostrarModal('Por favor, informe o nome da turma');
        return;
    }

    if (!dataInicio) {
        mostrarModal('Por favor, selecione a data de início');
        return;
    }

    if (!semestres || parseInt(semestres) < 1) {
        mostrarModal('Por favor, informe um número válido de semestres');
        return;
    }

    if (!idCurso) {
        mostrarModal('Por favor, selecione um curso');
        return;
    }

    const token = localStorage.getItem('token');
    try {
        console.log('Enviando dados:', {
            nome: nomeTurma,
            dt_inicio: dataInicio,
            semestres: semestres.toString(), // Convertendo para string
            id_curso: idCurso
        });

        const response = await fetch('http://localhost:8081/sec/Turma/cadastrar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nome: nomeTurma,
                dt_inicio: dataInicio,
                semestres: semestres.toString(), // Convertendo para string
                id_curso: idCurso
            })
        });

        const responseData = await response.json();
        console.log('Resposta recebida:', responseData);

        if (!response.ok) {
            throw new Error(responseData.erro || responseData.error || responseData.message || 'Erro ao cadastrar turma');
        }

        mostrarModal('Turma cadastrada com sucesso!');

        // Limpar o formulário
        document.getElementById('cadastrarTurmaForm').reset();

        // Opcional: redirecionar para a lista de turmas
        window.location.href = 'ListarTurmas.html';

    } catch (error) {
        console.error('Erro no cadastro de turma:', error);
        mostrarModal(`Erro ao cadastrar turma: ${error.message}`);
    }
}