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

function mostrarModalConfirm(mensagem) {
    return new Promise((resolve) => {
        const antigo = document.querySelector('.modal-overlay');
        if (antigo) antigo.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const box = document.createElement('div');
        box.className = 'modal-box';

        const texto = document.createElement('p');
        texto.innerText = mensagem;

        const btnOk = document.createElement('button');
        btnOk.innerText = 'OK';
        btnOk.onclick = () => {
            overlay.remove();
            resolve(true);
        };

        const btnCancel = document.createElement('button');
        btnCancel.innerText = 'Cancelar';
        btnCancel.style.marginLeft = '10px';
        btnCancel.onclick = () => {
            overlay.remove();
            resolve(false);
        };

        box.appendChild(texto);
        box.appendChild(btnOk);
        box.appendChild(btnCancel);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarModal("Token não encontrado. Faça login novamente.");
        window.location.href = "../../Login/Login.html";
        return;
    }

    const tableBody = document.getElementById("ListaUsuariosTableBody");

    fetch("http://localhost:8081/sec/listarUsuarios", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Erro na requisição: " + response.status);
            }
            return response.json();
        })
        .then(data => {
            data.forEach(item => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${item.matricula}</td>
                    <td>${item.nome}</td>
                    <td>${item.email}</td>
                    <td>${new Date(item.dt_nasc).toLocaleDateString()}</td>
                    <td><button class="btn-editar" data-id="${item.id_user}">Editar</button></td>
                    <td><button class="btn-excluir" data-id="${item.id_user}">Excluir</button></td>
                `;
                tableBody.appendChild(row);
            });

            // Adiciona os event listeners para os botões após inserir as linhas
            document.querySelectorAll('.btn-editar').forEach(btn => {
                btn.addEventListener('click', function() {
                    editar(this.getAttribute('data-id'));
                });
            });
            document.querySelectorAll('.btn-excluir').forEach(btn => {
                btn.addEventListener('click', function() {
                    excluir(this.getAttribute('data-id'));
                });
            });
        })
        .catch(error => {
            console.error("Erro ao buscar os usuários:", error);
            tableBody.innerHTML = "<tr><td colspan='6'>Erro ao carregar os dados.</td></tr>";
        });
});

// Função de edição
function editar(id_user) {
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarModal("Token não encontrado. Faça login novamente.");
        window.location.href = "../../Front-End/Login/Login.html";
        return;
    }
    // Redireciona para página de edição com o id_user do usuário
    // Usamos encodeURIComponent para garantir que o id_user seja seguro na URL
    window.location.href = `editarUsuario.html?id_user=${encodeURIComponent(id_user)}`;
    console.log(`Redirecionando para edição do usuário: ${id_user}`);
}


// Função de exclusão
async function excluir(id_user) {
    const token = localStorage.getItem('token');
    if (!token) {
        mostrarModal("Token não encontrado. Faça login novamente.", () => {
            window.location.href = "../../Login/Login.html";
        });
        return;
    }

    const confirmado = await mostrarModalConfirm('Tem certeza que deseja excluir este usuário?');
    if (!confirmado) {
        return;
    }

    console.log(`Tentando excluir usuário com ID: ${id_user}`);

    fetch(`http://localhost:8081/sec/excluirUsuario/${id_user}`, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (!response.ok) {
                console.error(`Erro na resposta: ${response.status} - ${response.statusText}`);

                // Tentar obter mais informações do corpo da resposta
                return response.text().then(text => {
                    try {
                        // Tenta converter para JSON se possível
                        const errorData = JSON.parse(text);
                        throw new Error(`Erro ${response.status}: ${errorData.message || text}`);
                    } catch (e) {
                        // Se não for JSON válido, usa o texto como está
                        throw new Error(`Erro ${response.status}: ${text || 'Sem detalhes do servidor'}`);
                    }
                });
            }

            // Verifica se há conteúdo na resposta
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();
            } else {
                return null; // Retorna null quando não há JSON na resposta
            }
        })
        .then(data => {
            mostrarModal("Usuário excluído com sucesso!", () => {
                // Recarrega a página para atualizar a lista somente após clicar em OK
                window.location.reload();
            });
        })
        .catch(error => {
            console.error("Erro ao excluir usuário:", error);
            mostrarModal(`Erro ao excluir usuário: ${error.message}`);
        });
}

// Função de pesquisa
function searchFunction() {
    var input = document.getElementById("listInput");
    var filter = input.value.toUpperCase();
    var table = document.getElementById("listTable");
    var trs = table.tBodies[0].getElementsByTagName("tr");

    for (var i = 0; i < trs.length; i++) {
        var tds = trs[i].getElementsByTagName("td");
        trs[i].style.display = "none";

        for (var j = 0; j < 4; j++) { // quais colunas vão ser lidas
            if (tds[j] && tds[j].innerHTML.toUpperCase().indexOf(filter) > -1) {
                trs[i].style.display = "";
                break;
            }
        }
    }
}