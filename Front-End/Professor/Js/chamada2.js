document.addEventListener("DOMContentLoaded", async function () {
    const tableBody = document.getElementById("Chamada2TableBody");
    const btnLancar = document.querySelector(".botao-lancar");
    const dataChamada = document.getElementById("dataChamada");
    const titulo = document.querySelector("h1.titulo-centralizado");
    
    // Função para formatar data no formato YYYY-MM-DD
    function formatarDataParaInput(data) {
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
    }
    
    // Definir a data atual como padrão no seletor de data
    const hoje = new Date();
    dataChamada.value = formatarDataParaInput(hoje);
    
    // Adicionar event listener para quando a data for alterada
    dataChamada.addEventListener('change', function() {
        console.log('Data alterada para:', this.value);
        // Aqui você pode adicionar lógica adicional se necessário
        // Por exemplo, recarregar dados ou validar a nova data
    });

    const token = localStorage.getItem("token");
    const id_user = localStorage.getItem("userId");
    const id_turma = localStorage.getItem("id_turma_selecionada");
    const id_materia = localStorage.getItem("id_materia_selecionada");
    
    // Recuperar informações da turma e matéria para exibir no título
    const nomeTurma = localStorage.getItem("selectedTurmaNome") || "Turma";
    const nomeMateria = localStorage.getItem("selectedMateriaNome") || "Matéria";
    
    if (titulo) {
        titulo.textContent = `Chamada - ${nomeTurma} - ${nomeMateria}`;
    }    if (!token || !id_user || !id_turma || !id_materia) {
        await mostrarModal("Dados de chamada não encontrados!");
        window.location.href = "Chamada.html";
        return;
    }function mostrarModal(mensagem) {
        return new Promise((resolve) => {
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
                resolve();
            };
        
            box.appendChild(texto);
            box.appendChild(botao);
            overlay.appendChild(box);
            document.body.appendChild(overlay);
        });
    }
    // Busca o id_professor pelo id_user
    let id_professor = null;
    try {
        const resp = await fetch(`http://localhost:8081/professor/user/${id_user}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error();
        const prof = await resp.json();
        id_professor = prof.id_professor;    } catch (e) {
        await mostrarModal("Erro ao buscar professor.");
        return;
    }// Busca alunos da turma
    let alunos = [];
    try {
        const resp = await fetch(`http://localhost:8081/prof/alunos/${id_turma}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!resp.ok) throw new Error("Resposta não ok");
        alunos = await resp.json();
        console.log("Alunos carregados:", alunos);    } catch (e) {
        console.error("Erro ao buscar alunos:", e);
        await mostrarModal("Erro ao buscar alunos da turma.");
        return;
    }

    // Monta a tabela
    alunos.forEach((aluno, idx) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${idx + 1}</td>
            <td>${aluno.nome}</td>
            <td>
                <button class="status-btn verde" data-status="P" data-id="${aluno.id_aluno}">P</button>
            </td>
        `;
        tableBody.appendChild(row);
    });    // Alterna status ao clicar
    tableBody.querySelectorAll(".status-btn").forEach(btn => {
        btn.addEventListener("click", function () {
            if (btn.dataset.status === "P") {
                btn.dataset.status = "F";
                btn.textContent = "F";
                btn.classList.remove("verde");
                btn.classList.add("vermelho");
            } else {
                btn.dataset.status = "P";
                btn.textContent = "P";
                btn.classList.remove("vermelho");
                btn.classList.add("verde");
            }
        });
    });

    // Carregar chamada existente para a data atual (se houver)
    await carregarChamadaExistente(dataChamada.value);
      // Lançar presença
    btnLancar.addEventListener("click", async function (e) {
        e.preventDefault(); // Previne o comportamento padrão do botão
        
        // Verificar se a data foi selecionada
        if (!dataChamada.value) {
            await mostrarModal("Por favor, selecione uma data para a chamada.");
            return;
        }
        
        try {
            console.log("Iniciando lançamento de chamada...");
            
            // Monta array de presenças
            const presencas = [];
            tableBody.querySelectorAll(".status-btn").forEach(btn => {
                presencas.push({
                    id_aluno: btn.dataset.id, // Corrigido para string (UUID)
                    presente: btn.dataset.status === "P"
                });
            });            if (presencas.length === 0) {
                await mostrarModal("Nenhum aluno encontrado para lançar presença.");
                return;
            }

            console.log("Dados para envio:", {
                id_professor,
                id_turma,
                data: dataChamada.value,
                presencas
            });            // Desabilita o botão durante o envio
            btnLancar.disabled = true;

            // Envia chamada para o backend
            const resp = await fetch("http://localhost:8081/prof/chamada", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_professor,
                    id_turma,
                    data: dataChamada.value,
                    presencas
                })
            });

            const result = await resp.json();
              if (resp.ok) {
                await mostrarModal("Chamada lançada com sucesso!");
                window.location.href = "Chamada.html";            } else {
                console.error("Erro retornado pela API:", result);
                await mostrarModal(result.erro || "Erro ao lançar chamada.");
                btnLancar.disabled = false; // Reabilita o botão em caso de erro
            }        } catch (e) {
            console.error("Erro ao lançar chamada:", e);
            await mostrarModal("Erro ao lançar chamada: " + (e.message || "Erro desconhecido"));
            btnLancar.disabled = false; // Reabilita o botão em caso de erro
        }
    });
      // Função para carregar chamada existente para a data selecionada
    async function carregarChamadaExistente(data) {
        try {
            const resp = await fetch(`http://localhost:8081/prof/chamada/${id_turma}/data?data=${data}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (resp.ok) {
                const chamadaExistente = await resp.json();
                console.log('Chamada existente encontrada:', chamadaExistente);
                
                // Atualizar os botões de presença com os dados existentes
                if (chamadaExistente.presencas) {
                    chamadaExistente.presencas.forEach(presenca => {
                        const btn = tableBody.querySelector(`[data-id="${presenca.id_aluno}"]`);
                        if (btn) {
                            if (presenca.presente) {
                                btn.dataset.status = "P";
                                btn.textContent = "P";
                                btn.classList.remove("vermelho");
                                btn.classList.add("verde");
                            } else {
                                btn.dataset.status = "F";
                                btn.textContent = "F";
                                btn.classList.remove("verde");
                                btn.classList.add("vermelho");
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.log('Nenhuma chamada existente encontrada para esta data');
        }
    }
    
    // Atualizar event listener para carregar dados quando a data mudar
    dataChamada.addEventListener('change', function() {
        console.log('Data alterada para:', this.value);
        // Resetar todos os botões para presença (padrão)
        tableBody.querySelectorAll(".status-btn").forEach(btn => {
            btn.dataset.status = "P";
            btn.textContent = "P";
            btn.classList.remove("vermelho");
            btn.classList.add("verde");
        });
        // Carregar chamada existente se houver
        carregarChamadaExistente(this.value);
    });
});
