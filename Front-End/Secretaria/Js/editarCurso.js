document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('cursoForm');
    const params = new URLSearchParams(window.location.search);
    const cursoId = params.get('id');

    // Elementos do formulário
    const nomeCurso = document.getElementById('nomeCurso');
    const cargaHoraria = document.getElementById('cargaHoraria');
    const serie = document.getElementById('serie');
    const frequencia = document.getElementById('frequencia');
    const descricao = document.getElementById('descricao');
    const codigoCurso = document.getElementById('codigoCurso');

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


    // Carregar dados do curso
    async function carregarDadosCurso() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                mostrarModal('Usuário não autenticado. Por favor, faça login novamente.');
                window.location.href = '../../Login/Login.html';
                return;
            }

            const response = await fetch(`http://localhost:8081/sec/listarCursos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar dados do curso');
            }

            const cursos = await response.json();
            const curso = cursos.find(c => c.id_curso === cursoId);

            if (!curso) {
                mostrarModal('Curso não encontrado');
                window.location.href = 'ListarCursos.html';
                return;
            }

            // Preencher o formulário
            nomeCurso.value = curso.nome;
            cargaHoraria.value = curso.ch_total;
            serie.value = curso.periodo;
            frequencia.value = curso.freq_min;
            descricao.value = curso.descricao;
            codigoCurso.value = curso.codigo;
            codigoCurso.disabled = true; // O código não deve ser editável
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar dados do curso. Por favor, tente novamente.');
        }
    }

    // Salvar alterações do curso
    async function salvarAlteracoes(event) {
        event.preventDefault();

        if (!nomeCurso.value || !cargaHoraria.value || !serie.value || !frequencia.value || !descricao.value) {
            mostrarModal('Por favor, preencha todos os campos.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const cursoData = {
                nome: nomeCurso.value,
                periodo: serie.value,
                descricao: descricao.value,
                ch_total: cargaHoraria.value.toString(),
                freq_min: frequencia.value.toString()
            };

            const response = await fetch(`http://localhost:8081/sec/editarCurso/${cursoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cursoData)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar curso');
            }

            mostrarModal('Curso atualizado com sucesso!');
            window.location.href = 'ListarCursos.html';
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao atualizar curso. Por favor, tente novamente.');
        }
    }

    // Adicionar listener para o formulário
    form.addEventListener('submit', salvarAlteracoes);

    // Adicionar botão de salvar
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.textContent = 'Salvar Alterações';
    form.appendChild(saveButton);

    // Carregar dados do curso ao iniciar
    carregarDadosCurso();
});