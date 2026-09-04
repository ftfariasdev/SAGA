document.addEventListener("DOMContentLoaded", async () => {
    const tabela = document.getElementById("tabelaLancamento");
    const btnLancar = document.querySelector(".btn-lancar");
    const selectModulo = document.getElementById("selectModulo");
    const selectMateria = document.getElementById("selectMateria");
    const selectBimestre = document.getElementById("selectBimestre");

    let alunos = [];
    let id_turma = "";
    let id_professor = "";
    let id_materia = "";
    let bimestreAtual = "";

    const token = localStorage.getItem("token");
    const id_user = localStorage.getItem("userId");

    function mostrarModal(mensagem, callback) {
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
    botao.onclick = () => {
        overlay.remove();
        if (typeof callback === 'function') callback();
    };

    box.appendChild(texto);
    box.appendChild(botao);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

    // Busca o id_professor pelo id_user
    async function buscarIdProfessor() {
        if (!id_user) return "";
        const resp = await fetch(`http://localhost:8081/professor/user/${id_user}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (resp.ok) {
            const prof = await resp.json();
            return prof.id_professor;
        }
        return "";
    }

    // Popula o select de módulos (turmas)
    async function popularModulos() {
        const resp = await fetch(`http://localhost:8081/prof/turmas/${id_professor}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (resp.ok) {
            const turmas = await resp.json();
            selectModulo.innerHTML = `<option value="">Selecione o Módulo</option>`;
            turmas.forEach(turma => {
                selectModulo.innerHTML += `<option value="${turma.id_turma}">${turma.nome}</option>`;
            });
        }
    }

    // Popula o select de matérias conforme o professor
    async function popularMaterias() {
        const resp = await fetch(`http://localhost:8081/prof/materias/${id_professor}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (resp.ok) {
            const materias = await resp.json();
            selectMateria.innerHTML = `<option value="">Selecione a Matéria</option>`;
            materias.forEach(materia => {
                selectMateria.innerHTML += `<option value="${materia.id_materia}">${materia.nome}</option>`;
            });
        }
    }    // Busca alunos da turma selecionada
    async function buscarAlunos() {
        if (!id_turma || !id_materia || !bimestreAtual) {
            tabela.innerHTML = "";
            return;
        }
        const resp = await fetch(`http://localhost:8081/prof/alunos-turma/${id_turma}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alunos = resp.ok ? await resp.json() : [];
        renderTabela();
    }

    // Renderiza a tabela de alunos com inputs de notas
    function renderTabela() {
        tabela.innerHTML = "";
        alunos.forEach((aluno, idx) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${idx + 1}</td>
                <td>${aluno.nome}</td>
                <td><input type="number" min="0" max="10" step="0.1" class="nota-aluno" data-id="${aluno.id_aluno}" placeholder="0.0"></td>
            `;
            tabela.appendChild(row);
        });
    }

    // Eventos de mudança nos selects
    selectModulo.addEventListener("change", () => {
        id_turma = selectModulo.value;
        verificarFormularioPreenchido();
    });
    
    selectMateria.addEventListener("change", () => {
        id_materia = selectMateria.value;
        verificarFormularioPreenchido();
    });
    
    selectBimestre.addEventListener("change", () => {
        bimestreAtual = selectBimestre.value;
        verificarFormularioPreenchido();
    });
    
    // Verifica se todos os selects foram preenchidos
    function verificarFormularioPreenchido() {
        if (id_turma && id_materia && bimestreAtual) {
            buscarAlunos();
        }
    }    // Lançar notas
    btnLancar.addEventListener("click", async () => {
        if (!id_professor || !id_turma || !id_materia || !bimestreAtual) {
            mostrarModal("Selecione módulo, matéria e bimestre!");
            return;
        }
        
        // Coleta as notas preenchidas
        const notas = Array.from(document.querySelectorAll(".nota-aluno")).map(input => ({
            id_aluno: input.dataset.id,
            valor: parseFloat(input.value)
        })).filter(n => !isNaN(n.valor));

        if (notas.length === 0) {
            mostrarModal("Nenhuma nota preenchida para lançamento!");
            return;
        }

        try {
            // Define o texto do bimestre baseado no valor selecionado
            const textosBimestres = {
                "1": "1º Bimestre",
                "2": "2º Bimestre",
                "3": "3º Bimestre",
                "4": "4º Bimestre"
            };
            
            const bimestreTexto = textosBimestres[bimestreAtual];
            
            const response = await fetch("http://localhost:8081/prof/lancarNotas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_professor,
                    id_turma,
                    id_materia,
                    tipo_avaliacao: "Prova",
                    bimestre: bimestreTexto,
                    notas: notas
                })
            });

            if (response.ok) {
                mostrarModal(`Notas do ${bimestreTexto} lançadas com sucesso!`);
                
                // Limpa os campos de notas
                document.querySelectorAll(".nota-aluno").forEach(input => {
                    input.value = "";
                });
            } else {
                const error = await response.json();
                throw new Error(error.erro || 'Erro ao lançar notas');
            }
        } catch (error) {
            mostrarModal(`Erro ao lançar notas: ${error.message}`);
            console.error("Erro:", error);
        }
    });

    // Inicialização: buscar id_professor antes de popular selects
    id_professor = await buscarIdProfessor();
    if (!id_professor) {
        mostrarModal("Usuário não é professor ou não está cadastrado corretamente!");
        return;
    }
    await popularModulos();
    await popularMaterias();
});
