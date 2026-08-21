document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('ListaTurmasTableBody');
    const searchInput = document.querySelector('.search-box input');
    let turmas = [];

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

    // Função para carregar turmas
    async function carregarTurmas() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                mostrarModal('Usuário não autenticado. Por favor, faça login novamente.');
                window.location.href = '../../Login/Login.html';
                return;
            }

            const response = await fetch('http://localhost:8081/sec/Turma/listar', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar turmas');
            }

            turmas = await response.json();
            exibirTurmas(turmas);
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar turmas. Por favor, tente novamente.');
        }
    }

    // Função para excluir turma
    async function excluirTurma(id_turma) {
        if (!confirm('Tem certeza que deseja excluir esta turma? Todos os alunos e professores vinculados serão desassociados.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8081/sec/Turma/deletar/${id_turma}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir turma');
            }

            mostrarModal('Turma excluída com sucesso!');
            carregarTurmas(); // Recarrega a lista
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao excluir turma. Por favor, tente novamente.');
        }
    }

    // Função para formatar data
    function formatarData(data) {
        if (!data) return 'N/A';
        return new Date(data).toLocaleDateString('pt-BR');
    }    // Função para exibir as turmas na tabela
    function exibirTurmas(turmas) {
        tableBody.innerHTML = '';
        
        turmas.forEach(turma => {            // Contar professores vinculados à turma através da relação professoresRelation
            const numProfessores = turma.professoresRelation ? turma.professoresRelation.length : 0;
            
            // Criar lista de nomes dos professores para o tooltip
            let tooltipProfessores = '';
            if (numProfessores > 0) {
                const nomesProfessores = turma.professoresRelation.map(rel => {
                    return rel.professor?.user?.nome || 'Professor sem nome';
                }).join('\\n');
                tooltipProfessores = `title="${nomesProfessores}"`;
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${turma.codigo}</td>
                <td>${turma.nome}</td>
                <td>${turma.curso?.nome || 'N/A'}</td>
                <td>${formatarData(turma.dt_inicio)}</td>
                <td>${turma.semestres}</td>
                <td>${turma.alunos?.length || 0}</td>
                <td class="cell-professores" ${tooltipProfessores}>${numProfessores}</td>
                <td>
                    <a href="consultarTurma.html?id=${turma.id_turma}">
                        <button class="visualizar">Visualizar</button>
                    </a>
                </td>
                <td>
                    <a href="editarTurma.html?id=${turma.id_turma}">
                        <button class="editar">Editar</button>
                    </a>
                </td>
                <td>
                    <button class="excluir" onclick="excluirTurma('${turma.id_turma}')">Excluir</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Função para filtrar turmas
    function filtrarTurmas(termo) {
        const termoLower = termo.toLowerCase();
        const turmasFiltradas = turmas.filter(turma => 
            turma.nome.toLowerCase().includes(termoLower) ||
            turma.id_turma.toString().includes(termoLower) ||
            (turma.curso?.nome && turma.curso.nome.toLowerCase().includes(termoLower))
        );
        exibirTurmas(turmasFiltradas);
    }

    // Event listeners
    searchInput.addEventListener('input', (e) => {
        filtrarTurmas(e.target.value);
    });

    // Tornar a função excluirTurma global
    window.excluirTurma = excluirTurma;

    // Carregar turmas ao iniciar
    carregarTurmas();
});