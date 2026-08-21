document.addEventListener("DOMContentLoaded", async function () {
    // Variável para armazenar a foto em base64
    let fotoPerfilBase64 = "";
    let usuarioAtual = null;

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


    // Extrai o ID da URL
    const params = new URLSearchParams(window.location.search);
    const id_usuario = params.get("id_user");
    console.log("URL atual:", window.location.href); // Log da URL completa
    console.log("ID do usuário extraído da URL:", id_usuario);

    if (!id_usuario) {
        mostrarModal("ID do usuário não encontrado na URL.");
        return;
    }

    // Recupera o token do localStorage
    const token = localStorage.getItem("token");
    if (!token) {
        mostrarModal("Token não encontrado. Faça login novamente.");
        window.location.href = "../../Login/Login.html";
        return;
    }

    // Função para redimensionar imagem com melhor otimização
    function resizeImage(base64Str, maxWidth = 400, maxHeight = 400) {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calcular novas dimensões mantendo a proporção
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * maxWidth / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * maxHeight / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);

                // Recuperar tamanho aproximado da imagem
                const originalSizeKB = Math.round(base64Str.length / 1024);

                // Ajustar a qualidade com base no tamanho da imagem original
                let quality = 0.7; // Qualidade padrão

                if (originalSizeKB > 1000) {
                    quality = 0.5; // Para imagens maiores que 1MB
                }
                if (originalSizeKB > 5000) {
                    quality = 0.3; // Para imagens maiores que 5MB
                }

                // Retornar imagem redimensionada como base64 com qualidade ajustada
                const optimizedImage = canvas.toDataURL("image/jpeg", quality);

                // Log para debug
                console.log(`Imagem original: ~${originalSizeKB}KB, Imagem otimizada: ~${Math.round(optimizedImage.length / 1024)}KB`);

                resolve(optimizedImage);
            };
        });
    }

    // Configurar o botão de upload de foto
    const photoUploadButton = document.querySelector(".profile-photo button");
    photoUploadButton.addEventListener("click", function () {
        // Criar input de arquivo invisível
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";

        fileInput.addEventListener("change", async function (e) {
            const file = e.target.files[0];
            if (!file) return;

            // Verificar tamanho do arquivo
            if (file.size > 10 * 1024 * 1024) { // Maior que 10MB
                mostrarModal("A imagem é muito grande. Por favor, selecione uma imagem menor que 10MB.");
                return;
            }

            // Visualizar a imagem selecionada
            const photoPlaceholder = document.querySelector(".photo-placeholder");
            const reader = new FileReader();

            reader.onload = async function (event) {
                try {
                    // Redimensionar a imagem para reduzir o tamanho
                    const resizedImage = await resizeImage(event.target.result);

                    // Exibir a imagem
                    photoPlaceholder.style.backgroundImage = `url(${resizedImage})`;
                    photoPlaceholder.style.backgroundSize = "cover";
                    photoPlaceholder.style.backgroundPosition = "center";

                    // Armazenar a imagem em base64
                    fotoPerfilBase64 = resizedImage;
                } catch (error) {
                    console.error("Erro ao processar imagem:", error);
                    mostrarModal("Ocorreu um erro ao processar a imagem.");
                }
            };

            reader.readAsDataURL(file);
        });

        // Simular clique no input
        fileInput.click();
    });

    // Função para carregar e exibir os campos adicionais específicos por tipo de usuário
    async function carregarCamposEspecificos(tipo, id_user) {
        // Remover campos específicos existentes
        const camposEspecificos = document.querySelector(".campos-especificos");
        if (camposEspecificos) {
            camposEspecificos.remove();
        }

        // Container para os campos específicos
        const containerCampos = document.createElement("div");
        containerCampos.className = "campos-especificos";

        // Inserir antes do botão
        const form = document.querySelector(".form-grid");
        const botao = form.querySelector("button");

        try {
            if (tipo === 3) { // Aluno
                // Carregar dados do aluno
                const alunoResponse = await fetch(`http://localhost:8081/sec/consultarAluno/${id_user}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    }
                });

                if (!alunoResponse.ok) {
                    console.warn("Não foi possível carregar dados adicionais do aluno");
                } else {
                    const alunoData = await alunoResponse.json();

                    // Carregar turmas disponíveis
                    const turmasResponse = await fetch("http://localhost:8081/sec/Turma/listar", {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        }
                    });

                    if (turmasResponse.ok) {
                        const turmas = await turmasResponse.json();

                        // Campo de turma
                        containerCampos.innerHTML = `
                            <div class="input-group half-width">
                                <label for="id_turma">Turma:</label>
                                <select id="id_turma">
                                    <option value="" selected disabled style="color: gray;">Selecione uma turma</option>
                                    ${turmas.map(turma =>
                            `<option value="${turma.id_turma}" ${alunoData.id_turma === turma.id_turma ? 'selected' : ''}>
                                            ${turma.nome}
                                        </option>`
                        ).join('')}
                                </select>
                            </div>
                        `;
                    }
                }
            } else if (tipo === 2) { // Professor
                // Carregar dados do professor
                const professorResponse = await fetch(`http://localhost:8081/sec/consultarProfessor/${id_user}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    }
                });

                // Carregar turmas disponíveis para associar ao professor
                const turmasResponse = await fetch("http://localhost:8081/sec/Turma/listar", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    }
                });

                // Carregar turmas já associadas ao professor
                const turmasProfessorResponse = await fetch(`http://localhost:8081/sec/listarTurmasProfessor/${id_user}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    }
                }).catch(error => {
                    console.warn("Não foi possível carregar turmas do professor:", error);
                    return { ok: false };
                });

                if (!professorResponse.ok) {
                    console.warn("Não foi possível carregar dados adicionais do professor");
                } else {
                    const professorData = await professorResponse.json();
                    let turmasAssociadas = [];

                    if (turmasProfessorResponse && turmasProfessorResponse.ok) {
                        turmasAssociadas = await turmasProfessorResponse.json();
                    }

                    // Construir HTML base para os campos específicos de professor
                    let htmlCampos = `
                    <div class="input-group half-width" style="visibility: hidden;">
                    <label for="especialidade">Especialidade:</label>
                    <input type="text" id="especialidade">
                </div>
                <div class="input-group half-width" style="visibility: hidden;">
                    <label for="matricula">Matrícula:</label>
                    <input type="text" id="matricula" readonly>
                </div>
    
                    `;

                    // Adicionar seleção de turmas se disponível
                    if (turmasResponse.ok) {
                        const turmas = await turmasResponse.json();

                        // Criar div para seleção de turmas
                        htmlCampos += `
                        
                        `;
                    }

                    containerCampos.innerHTML = htmlCampos;
                }
            } else if (tipo === 1) { // Secretaria
                // Carregar dados da secretaria
                const secretariaResponse = await fetch(`http://localhost:8081/sec/consultarSecretaria/${id_user}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    }
                });

                if (!secretariaResponse.ok) {
                    console.warn("Não foi possível carregar dados adicionais da secretaria");
                } else {
                    const secretariaData = await secretariaResponse.json();

                    // Campos específicos de secretaria
                    containerCampos.innerHTML = `

                    `;
                }
            }

            // Adicionar os campos ao formulário
            if (containerCampos.innerHTML !== "") {
                form.insertBefore(containerCampos, botao);
            }

        } catch (error) {
            console.error("Erro ao carregar campos específicos:", error);
        }
    }

    try {
        // Faz a requisição para a API
        const response = await fetch(`http://localhost:8081/sec/consultarUsuario/${id_usuario}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            },
        });

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        const usuario = await response.json();
        usuarioAtual = usuario; // Salva referência para uso posterior        // Preenche os campos do formulário com os dados recebidos
        document.getElementById("nome").value = usuario.nome || "";
        document.getElementById("email").value = usuario.email || "";
        document.getElementById("telefone").value = usuario.telefone || "";
        document.getElementById("cpf").value = usuario.cpf || "";

        // Aplicar máscaras após carregar os dados
        if (typeof aplicarMascarasAposDados === 'function') {
            aplicarMascarasAposDados();
        }

        // Formata a data de nascimento para o input datetime-local
        if (usuario.dt_nasc) {
            const dt = new Date(usuario.dt_nasc);
            document.getElementById("nascimento").value = dt.toISOString().slice(0, 16);
        }

        // Exibe a foto de perfil, se existir
        if (usuario.ft_perfil) {
            const photoPlaceholder = document.querySelector(".photo-placeholder");
            photoPlaceholder.style.backgroundImage = `url(${usuario.ft_perfil})`;
            photoPlaceholder.style.backgroundSize = "cover";
            photoPlaceholder.style.backgroundPosition = "center";
            fotoPerfilBase64 = usuario.ft_perfil;
        }

        // Carregar campos específicos de acordo com o tipo de usuário
        await carregarCamposEspecificos(usuario.tipo, id_usuario);
    } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
        mostrarModal("Erro ao carregar os dados do usuário. Verifique o console para mais detalhes.");
    }

    // Captura o evento de envio do formulário
    document.getElementById("form-editar-usuario").addEventListener("submit", async function (event) {
        event.preventDefault();
        console.log("Formulário enviado");

        const id_usuario = new URLSearchParams(window.location.search).get("id_user");
        console.log("ID do usuário no envio do formulário:", id_usuario);

        if (!id_usuario) {
            mostrarModal("ID do usuário não encontrado na URL.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            mostrarModal("Token não encontrado. Faça login novamente.");
            window.location.href = "../../Front-End/Login/Login.html";
            return;
        }

        const nome = document.getElementById("nome").value;
        const email = document.getElementById("email").value;
        const telefone = document.getElementById("telefone").value;
        const cpf = document.getElementById("cpf").value;
        const dt_nasc = new Date(document.getElementById("nascimento").value).toISOString();
        const senha = document.getElementById("senha").value;

        // Dados para enviar ao servidor
        const dadosParaEnviar = {
            nome,
            email,
            telefone,
            dt_nasc
        };

        // Adicionar senha apenas se foi preenchida
        if (senha.trim() !== "") {
            dadosParaEnviar.senha = senha;
        }

        // Adicionar CPF apenas se foi preenchido
        if (cpf.trim() !== "") {
            dadosParaEnviar.cpf = cpf;
        }

        // Adicionar foto de perfil se foi alterada
        if (fotoPerfilBase64) {
            dadosParaEnviar.ft_perfil = fotoPerfilBase64;
        }

        // Campos específicos para cada tipo de usuário
        if (usuarioAtual) {
            if (usuarioAtual.tipo === 3) { // Aluno
                const id_turma = document.getElementById("id_turma")?.value;
                if (id_turma) {
                    // Enviar requisição separada para atualizar turma do aluno
                    try {
                        await fetch(`http://localhost:8081/sec/atualizarTurmaAluno/${id_usuario}`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer " + token,
                            },
                            body: JSON.stringify({ id_turma })
                        });
                    } catch (error) {
                        console.error("Erro ao atualizar turma do aluno:", error);
                    }
                }
            } else if (usuarioAtual.tipo === 2) { // Professor
                // Atualizar especialidade do professor
                const especialidade = document.getElementById("especialidade")?.value;
                if (especialidade) {
                    // Enviar requisição separada para atualizar especialidade do professor
                    try {
                        await fetch(`http://localhost:8081/sec/atualizarEspecialidadeProfessor/${id_usuario}`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer " + token,
                            },
                            body: JSON.stringify({ especialidade })
                        });
                    } catch (error) {
                        console.error("Erro ao atualizar especialidade do professor:", error);
                    }
                }

                // Atualizar turmas do professor
                const turmasSelect = document.getElementById("turmas_professor");
                if (turmasSelect) {
                    // Obter todas as turmas selecionadas
                    const turmasSelecionadas = Array.from(turmasSelect.selectedOptions).map(option => option.value);

                    // Enviar requisição para atualizar turmas do professor
                    try {
                        await fetch(`http://localhost:8081/sec/atualizarTurmasProfessor/${id_usuario}`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer " + token,
                            },
                            body: JSON.stringify({ turmas: turmasSelecionadas })
                        });
                    } catch (error) {
                        console.error("Erro ao atualizar turmas do professor:", error);
                    }
                }
            } else if (usuarioAtual.tipo === 1) { // Secretaria
                const setor = document.getElementById("setor")?.value;
                if (setor) {
                    // Enviar requisição separada para atualizar setor da secretaria
                    try {
                        await fetch(`http://localhost:8081/sec/atualizarSetorSecretaria/${id_usuario}`, {
                            method: "PUT",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer " + token,
                            },
                            body: JSON.stringify({ setor })
                        });
                    } catch (error) {
                        console.error("Erro ao atualizar setor da secretaria:", error);
                    }
                }
            }
        }

        console.log("Dados a serem enviados:", dadosParaEnviar);

        try {
            const response = await fetch(`http://localhost:8081/sec/editarUsuario/${id_usuario}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token,
                },
                body: JSON.stringify(dadosParaEnviar)
            });

            console.log("Status da resposta:", response.status);

            if (!response.ok) {
                const responseText = await response.text();
                console.error("Texto da resposta de erro:", responseText);

                let errorMessage = `Erro ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage += `: ${errorData.erro || errorData.message || 'Erro desconhecido'}`;
                    if (errorData.detalhes) {
                        errorMessage += ` - ${errorData.detalhes}`;
                    }
                } catch (e) {
                    errorMessage += `: ${responseText || 'Sem detalhes disponíveis'}`;
                }

                throw new Error(errorMessage);
            }

            mostrarModal("Dados atualizados com sucesso!");
            window.location.href = "ListarUsuarios.html"; // Redireciona após sucesso
        } catch (error) {
            console.error("Erro ao editar os dados do usuário:", error);
            mostrarModal(`Erro ao salvar os dados do usuário: ${error.message}`);
        }
    });
});