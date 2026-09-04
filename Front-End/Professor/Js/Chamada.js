document.addEventListener("DOMContentLoaded", async function () {
    const tableBody = document.getElementById("listaChamadaBody");
    const turmaHeader = document.getElementById("turmaHeader");

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

    // Recupera token e id_user do localStorage
    const token = localStorage.getItem("token");
    const id_user = localStorage.getItem("userId");    if (!token || !id_user) {
        mostrarModal("Usuário não autenticado!");
        window.location.href = "../../Login/Login.html";
        return;
    }

    // Busca o id_professor pelo id_user
    let id_professor = null;
    try {
        const resp = await fetch(`http://localhost:8081/professor/user/${id_user}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error();
        const prof = await resp.json();
        id_professor = prof.id_professor;
    } catch (e) {
        mostrarModal("Erro ao buscar professor.");
        return;
    }

    if (!id_professor) {
        mostrarModal("Professor não encontrado.");
        return;
    }

    // Busca as turmas do professor
    let turmas = [];
    try {
        const turmasResp = await fetch(`http://localhost:8081/prof/turmas/${id_professor}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        turmas = await turmasResp.json();
    } catch (e) {
        mostrarModal("Erro ao buscar turmas.");
        return;
    }

    // Busca as matérias do professor
    let materias = [];
    try {
        const materiasResp = await fetch(`http://localhost:8081/prof/materias/${id_professor}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        materias = await materiasResp.json();
    } catch (e) {
        mostrarModal("Erro ao buscar matérias.");
        return;
    }

    // Limpa o cabeçalho e monta o novo
    if (turmaHeader) turmaHeader.textContent = "Chamada";

    // Monta a tabela cruzando turmas e matérias
    tableBody.innerHTML = ""; // Limpa antes de montar

    // Adiciona o cabeçalho da tabela conforme a imagem
    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>Módulo</th>
            <th>Matéria</th>
            <th>Total de aulas Semanais</th>
            <th></th>
        </tr>
    `;
    tableBody.parentNode.insertBefore(thead, tableBody);

    let encontrou = false;
    turmas.forEach(turma => {
        materias.forEach(materia => {
            if (materia.id_curso === turma.id_curso) {
                encontrou = true;
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${turma.curso.nome}</td>
                    <td>${materia.nome}</td>
                    <td>${materia.ch_total}</td>
                    <td>
                        <button class="btn-selecionar" 
                            data-id-turma="${turma.id_turma}" 
                            data-id-materia="${materia.id_materia}">
                            Selecionar
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            }
        });
    });

    if (!encontrou) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="4" style="text-align:center;">Nenhuma turma/matéria encontrada.</td>`;
        tableBody.appendChild(row);
    }    // Evento do botão Selecionar
    tableBody.addEventListener("click", function (e) {
        if (e.target.classList.contains("btn-selecionar")) {
            const id_turma = e.target.getAttribute("data-id-turma");
            const id_materia = e.target.getAttribute("data-id-materia");
            const row = e.target.closest("tr");
            
            // Pegar os nomes da turma e matéria a partir das células da tabela
            const nomeTurma = row.cells[0].textContent;
            const nomeMateria = row.cells[1].textContent;
            
            localStorage.setItem("id_turma_selecionada", id_turma);
            localStorage.setItem("id_materia_selecionada", id_materia);
            localStorage.setItem("selectedTurmaNome", nomeTurma);
            localStorage.setItem("selectedMateriaNome", nomeMateria);
            
            window.location.href = "Chamada2.html";
        }
    });
});
