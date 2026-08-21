document.addEventListener('DOMContentLoaded', async () => {
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

    // Verificar a autenticação
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarModal('Usuário não autenticado. Por favor, faça login novamente.');
        window.location.href = '../../Login/Login.html';
        return;
    }

    // Obter o ID da turma da URL
    const params = new URLSearchParams(window.location.search);
    const idTurma = params.get('id');
    
    if (!idTurma) {
        mostrarModal('ID da turma não informado. Redirecionando para a lista de turmas.');
        window.location.href = 'ListarTurmas.html';
        return;
    }

    // Elementos da interface
    const loadingIndicator = document.getElementById('loading-indicator');
    const turmaDetalhes = document.getElementById('turma-detalhes');
    const turmaTitulo = document.getElementById('turma-titulo');
    
    // Inicializar as abas
    inicializarAbas();
    
    // Inicializar filtros de busca
    inicializarFiltros();
    
    try {
        // Buscar dados da turma
        const turma = await buscarDetalhesTurma(idTurma, token);
        
        // Ocultar indicador de carregamento e mostrar detalhes
        loadingIndicator.style.display = 'none';
        turmaDetalhes.style.display = 'block';
        
        // Preencher dados da turma
        preencherDadosTurma(turma);
        
    } catch (error) {
        console.error('Erro ao carregar detalhes da turma:', error);
        loadingIndicator.textContent = 'Erro ao carregar informações da turma.';
        mostrarModal('Erro ao carregar detalhes da turma. Por favor, tente novamente.');
    }
});

/**
 * Busca os detalhes da turma na API
 */
async function buscarDetalhesTurma(idTurma, token) {
    const response = await fetch(`http://localhost:8081/sec/Turma/consultar/${idTurma}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Erro ao buscar detalhes da turma: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Preenche os dados da turma na interface
 */
function preencherDadosTurma(turma) {
    // Atualizar título da página
    document.getElementById('turma-titulo').textContent = `Turma: ${turma.nome}`;
    
    // Estatísticas
    document.getElementById('total-alunos').textContent = turma.total_alunos;
    document.getElementById('total-professores').textContent = turma.total_professores;
    
    // Informações da turma
    document.getElementById('turma-codigo').textContent = turma.codigo;
    document.getElementById('turma-nome').textContent = turma.nome;
    document.getElementById('turma-data-inicio').textContent = formatarData(turma.dt_inicio);
    document.getElementById('turma-semestres').textContent = turma.semestres;
    
    // Informações do curso
    document.getElementById('curso-nome').textContent = turma.curso.nome;
    document.getElementById('curso-codigo').textContent = turma.curso.codigo;
    document.getElementById('curso-periodo').textContent = turma.curso.periodo;
    document.getElementById('curso-ch-total').textContent = `${turma.curso.ch_total} horas`;
    document.getElementById('curso-freq-min').textContent = `${turma.curso.freq_min}%`;
    
    // Renderizar lista de alunos
    renderizarAlunos(turma.alunos);
    
    // Renderizar lista de professores
    renderizarProfessores(turma.professores);
}

/**
 * Renderiza a lista de alunos
 */
function renderizarAlunos(alunos) {
    const alunosLista = document.getElementById('alunos-lista');
    alunosLista.innerHTML = '';
    
    if (alunos.length === 0) {
        alunosLista.innerHTML = '<p class="loading">Nenhum aluno matriculado nesta turma.</p>';
        return;
    }
    
    alunos.forEach(aluno => {
        const alunoCard = document.createElement('div');
        alunoCard.className = 'card';
        alunoCard.dataset.nome = aluno.nome.toLowerCase();
        alunoCard.dataset.id = aluno.id_aluno;
        
        const fotoUrl = aluno.foto || '../Img/Pessoa.svg';
        
        alunoCard.innerHTML = `
            <div class="card-header">
                <div class="card-foto" style="background-image: url('${fotoUrl}')"></div>
                <h3 class="card-nome">${aluno.nome}</h3>
            </div>
            <div class="card-content">
                <p class="card-info"><strong>Matrícula:</strong> ${aluno.matricula}</p>
                <p class="card-info card-email"><strong>Email:</strong> ${aluno.email}</p>
                <p class="card-info"><strong>Telefone:</strong> ${aluno.telefone}</p>
                <p class="card-info"><strong>Data de Nascimento:</strong> ${formatarData(aluno.data_nascimento)}</p>
                <button class="remover-btn" data-id="${aluno.id_aluno}" onclick="removerAluno('${aluno.id_aluno}', '${aluno.nome}')">Remover da Turma</button>
            </div>
        `;
        
        alunosLista.appendChild(alunoCard);
    });
}

/**
 * Renderiza a lista de professores
 */
function renderizarProfessores(professores) {
    const professoresLista = document.getElementById('professores-lista');
    professoresLista.innerHTML = '';
    
    if (professores.length === 0) {
        professoresLista.innerHTML = '<p class="loading">Nenhum professor associado a esta turma.</p>';
        return;
    }
    
    const idTurma = new URLSearchParams(window.location.search).get('id');
    
    professores.forEach(professor => {
        const professorCard = document.createElement('div');
        professorCard.className = 'card';
        professorCard.dataset.nome = professor.nome.toLowerCase();
        professorCard.dataset.id = professor.id_professor;
        
        const fotoUrl = professor.foto || '../Img/Prof.svg';
        
        professorCard.innerHTML = `
            <div class="card-header">
                <div class="card-foto" style="background-image: url('${fotoUrl}')"></div>
                <h3 class="card-nome">${professor.nome}</h3>
            </div>
            <div class="card-content">
                <p class="card-info card-email"><strong>Email:</strong> ${professor.email}</p>
                <p class="card-info"><strong>Telefone:</strong> ${professor.telefone}</p>
                <button class="remover-btn" data-id="${professor.id_professor}" 
                    onclick="removerProfessor('${professor.id_professor}', '${idTurma}', '${professor.nome}')">
                    Remover da Turma
                </button>
            </div>
        `;
        
        professoresLista.appendChild(professorCard);
    });
}

/**
 * Inicializa o funcionamento das abas
 */
function inicializarAbas() {
    const abas = document.querySelectorAll('.tab-button');
    const conteudos = document.querySelectorAll('.tab-content');
    
    abas.forEach(aba => {
        aba.addEventListener('click', () => {
            // Remover classe active de todas as abas
            abas.forEach(a => a.classList.remove('active'));
            
            // Adicionar classe active na aba clicada
            aba.classList.add('active');
            
            // Esconder todos os conteúdos de aba
            conteudos.forEach(c => c.classList.remove('active'));
            
            // Mostrar conteúdo correspondente
            const tabId = aba.dataset.tab + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
}

/**
 * Inicializa os filtros de busca
 */
function inicializarFiltros() {
    const buscaAlunos = document.getElementById('busca-alunos');
    const buscaProfessores = document.getElementById('busca-professores');
    
    buscaAlunos.addEventListener('input', () => {
        filtrarCards('alunos-lista', buscaAlunos.value.toLowerCase());
    });
    
    buscaProfessores.addEventListener('input', () => {
        filtrarCards('professores-lista', buscaProfessores.value.toLowerCase());
    });
}

/**
 * Filtra os cards de acordo com a busca
 */
function filtrarCards(listaId, termoBusca) {
    const cards = document.querySelectorAll(`#${listaId} .card`);
    
    cards.forEach(card => {
        const nome = card.dataset.nome;
        if (nome.includes(termoBusca)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Formata uma data para o formato brasileiro (DD/MM/YYYY)
 */
function formatarData(dataString) {
    if (!dataString) return 'N/A';
    
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

/**
 * Remove um aluno da turma
 */
async function removerAluno(idAluno, nomeAluno) {
    if (!confirm(`Tem certeza que deseja remover o aluno ${nomeAluno} desta turma?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8081/sec/Turma/removerAluno/${idAluno}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao remover aluno: ${response.status}`);
        }
        
        mostrarModal(`Aluno ${nomeAluno} removido da turma com sucesso!`);
        
        // Recarregar os dados da turma
        const params = new URLSearchParams(window.location.search);
        const idTurma = params.get('id');
        const turma = await buscarDetalhesTurma(idTurma, token);
        preencherDadosTurma(turma);
        
    } catch (error) {
        console.error('Erro ao remover aluno:', error);
        mostrarModal('Erro ao remover aluno da turma. Por favor, tente novamente.');
    }
}

/**
 * Remove um professor da turma
 */
async function removerProfessor(idProfessor, idTurma, nomeProfessor) {
    if (!confirm(`Tem certeza que deseja remover o professor ${nomeProfessor} desta turma?`)) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8081/sec/Turma/removerProfessor/${idProfessor}/${idTurma}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erro ao remover professor: ${response.status}`);
        }
        
        mostrarModal(`Professor ${nomeProfessor} removido da turma com sucesso!`);
        
        // Recarregar os dados da turma
        const turma = await buscarDetalhesTurma(idTurma, token);
        preencherDadosTurma(turma);
        
    } catch (error) {
        console.error('Erro ao remover professor:', error);
        mostrarModal('Erro ao remover professor da turma. Por favor, tente novamente.');
    }
}

// Tornar as funções de remoção globais para serem acessadas via onclick
window.removerAluno = removerAluno;
window.removerProfessor = removerProfessor;