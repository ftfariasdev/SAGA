document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('ListaDisciplinaTableBody');
    const searchInput = document.querySelector('.search-box input');
    const cursosSelect = document.getElementById('cursosSelect');
    let materias = [];
    let cursos = [];


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

            cursos = await response.json();
            preencherSelectCursos(cursos);
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar cursos. Por favor, tente novamente.');
        }
    }

    // Função para preencher o select de cursos
    function preencherSelectCursos(cursos) {
        cursosSelect.innerHTML = '<option value="">Todos os Cursos</option>';
        cursos.forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.id_curso;
            option.textContent = curso.nome;
            cursosSelect.appendChild(option);
        });
    }

    // Função para carregar matérias
    async function carregarMaterias(id_curso = '') {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                mostrarModal('Usuário não autenticado. Por favor, faça login novamente.');
                window.location.href = '../Login/Login.html';
                return;
            }

            if (!id_curso) {
                // Se nenhum curso for selecionado, carrega todas as matérias através dos cursos
                const cursosResponse = await fetch('http://localhost:8081/sec/listarCursos', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!cursosResponse.ok) {
                    throw new Error('Erro ao carregar cursos');
                }

                const cursosData = await cursosResponse.json();
                materias = cursosData.flatMap(curso => 
                    curso.materias.map(materia => ({
                        ...materia,
                        curso_nome: curso.nome
                    }))
                );
            } else {
                // Se um curso específico for selecionado, carrega apenas suas matérias
                const materiasResponse = await fetch(`http://localhost:8081/sec/listarMaterias/${id_curso}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!materiasResponse.ok) {
                    throw new Error('Erro ao carregar matérias');
                }

                const materiasData = await materiasResponse.json();
                const cursoSelecionado = cursos.find(c => c.id_curso === id_curso);
                materias = materiasData.map(materia => ({
                    ...materia,
                    curso_nome: cursoSelecionado.nome
                }));
            }

            exibirMaterias(materias);
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar matérias. Por favor, tente novamente.');
        }
    }

    // Função para excluir matéria
    async function excluirMateria(id_materia) {
        if (!confirm('Tem certeza que deseja excluir esta matéria?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8081/sec/excluirMateria/${id_materia}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir matéria');
            }

            mostrarModal('Matéria excluída com sucesso!');
            carregarMaterias(cursosSelect.value); // Recarrega a lista
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao excluir matéria. Por favor, tente novamente.');
        }
    }

    // Função para exibir as matérias na tabela
    function exibirMaterias(materias) {
        tableBody.innerHTML = '';
        
        materias.forEach(materia => {
            // Verificar se há um professor associado à matéria
            let nomeProfessor = 'Não atribuído';
            if (materia.professor && materia.professor.user) {
                nomeProfessor = materia.professor.user.nome;
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${materia.codigo || ''}</td>
                <td>${materia.nome || ''}</td>
                <td>${materia.ch_total || ''}</td>
                <td>${materia.freq_min || ''}</td>
                <td>${materia.curso_nome || 'N/A'}</td>
                
                <td>
                    <a href="editarMateria.html?id=${materia.id_materia}">
                        <button class="editar">Editar</button>
                    </a>
                </td>
                <td>
                    <button class="excluir" onclick="excluirMateria('${materia.id_materia}')">Excluir</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Função para filtrar matérias
    function filtrarMaterias(termo) {
        const termoLower = termo.toLowerCase();
        const materiasFiltradas = materias.filter(materia => 
            materia.nome.toLowerCase().includes(termoLower) ||
            materia.id_materia.toString().includes(termoLower) ||
            (materia.curso_nome && materia.curso_nome.toLowerCase().includes(termoLower))
        );
        exibirMaterias(materiasFiltradas);
    }

    // Event listeners
    searchInput.addEventListener('input', (e) => {
        filtrarMaterias(e.target.value);
    });

    cursosSelect.addEventListener('change', (e) => {
        carregarMaterias(e.target.value);
    });

    // Tornar a função excluirMateria global
    window.excluirMateria = excluirMateria;

    // Carregar dados iniciais
    await carregarCursos();
    await carregarMaterias();
});