document.addEventListener("DOMContentLoaded", function() {
    // Elementos do DOM
    const selectPerson = document.getElementById("selectPerson");
    const formFields = document.querySelector(".form-grid");
    const btnCadastrar = document.getElementById("btnCadastrar");
    const photoUploadButton = document.querySelector(".profile-photo button");
    let fotoPerfilBase64 = ""; // Variável para armazenar a foto em base64
    
    // Função para redimensionar e otimizar imagem
    async function resizeImage(base64Str, maxWidth = 400, maxHeight = 400, quality = 0.7) {
        return new Promise((resolve) => {
            // Criar uma imagem a partir do base64
            const img = new Image();
            img.src = base64Str;
            
            img.onload = function() {
                // Calcular dimensões proporcionais
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
                
                // Criar canvas para redimensionar
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                // Desenhar imagem redimensionada
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converter para base64 com qualidade reduzida
                const newBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(newBase64);
            };
        });
    }
    
    // Campos adicionais para aluno (apenas necessário para tipo 3 - Aluno)
    const camposAdicionaisAluno = `
        <div class="input-group half-width turma-field">
            <label for="id_turma">Turma:</label>
            <select id="id_turma">
                <option value="">Selecione uma turma</option>
                <!-- As turmas serão carregadas dinamicamente -->
            </select>
        </div>
    `;
    
    // Função para carregar turmas disponíveis (apenas para alunos)
    async function carregarTurmas() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                mostrarModal("Token não encontrado. Faça login novamente.");
                window.location.href = "../../Login/Login.html";
                return;
            }
            
            const response = await fetch("http://localhost:8081/sec/Turma/listar", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                }
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao carregar turmas: ${response.status}`);
            }
            
            const turmas = await response.json();
            const selectTurma = document.getElementById("id_turma");
            
            // Limpar opções existentes
            selectTurma.innerHTML = '<option value="">Selecione uma turma</option>';
            
            // Adicionar turmas do servidor
            turmas.forEach(turma => {
                const option = document.createElement("option");
                option.value = turma.id_turma;
                option.textContent = turma.nome;
                selectTurma.appendChild(option);
            });
            
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
            mostrarModal("Erro ao carregar a lista de turmas. Por favor, tente novamente.");
        }
    }

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
    
    function atualizarFormulario() {
        const tipoUsuario = selectPerson.value;
        
        // Remover campo de turma se existir
        const campoTurmaExistente = document.querySelector(".turma-field");
        if (campoTurmaExistente) {
            campoTurmaExistente.remove();
        }
        
        // Adicionar campo de turma apenas para alunos
        if (tipoUsuario === "3") {
            // Inserir campo de turma antes do botão
            const btnExistente = document.querySelector(".form-grid button");
            
            // Criar div para campo de turma
            const divTurma = document.createElement("div");
            divTurma.className = "input-group half-width turma-field";
            divTurma.innerHTML = `
                <label for="id_turma">Turma:</label>
                <div class="seletor-modulo">
                <select id="id_turma">
                    <option value="">Selecione uma turma</option>
                </select>
                </div>
            `;
            
            // Inserir antes do botão
            formFields.insertBefore(divTurma, btnExistente);
            
            // Carregar turmas disponíveis
            carregarTurmas();
        }
    }
    
    // Evento para mudar o tipo de usuário
    selectPerson.addEventListener("change", atualizarFormulario);
    
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

    // Função para upload de foto
    photoUploadButton.addEventListener("click", function() {
        // Criar input de arquivo invisível
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        
        fileInput.addEventListener("change", async function(e) {
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
            
            reader.onload = async function(event) {
                // Redimensionar a imagem para reduzir o tamanho
                const resizedImage = await resizeImage(event.target.result);
                
                // Exibir a imagem
                photoPlaceholder.style.backgroundImage = `url(${resizedImage})`;
                photoPlaceholder.style.backgroundSize = "cover";
                photoPlaceholder.style.backgroundPosition = "center";
                
                // Armazenar a imagem em base64
                fotoPerfilBase64 = resizedImage;
                
                console.log(`Tamanho da imagem após otimização: ~${Math.round(resizedImage.length / 1024)}KB`);
            };
            
            reader.readAsDataURL(file);
        });
        
        // Simular clique no input
        fileInput.click();
    });
    
    // Evento de cadastro
    btnCadastrar.addEventListener("click", async function(event) {
        event.preventDefault();
        
        const tipoUsuario = selectPerson.value;
        const nome = document.getElementById("nome").value;
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;
        const dt_nasc = document.getElementById("nascimento").value
            ? new Date(document.getElementById("nascimento").value).toISOString()
            : "";
        const telefone = document.getElementById("telefone").value;
        const cpf = document.getElementById("cpf").value;
        const ft_perfil = fotoPerfilBase64; // Usar a imagem em base64
        
        // Validação básica
        if (!nome || !email || !senha || !dt_nasc || !telefone || !cpf) {
            mostrarModal("Preencha todos os campos obrigatórios!");
            return;
        }
        
        // Recuperar o token do localStorage
        const token = localStorage.getItem("token");
        if (!token && tipoUsuario !== "1") { // Verificação apenas para rotas que exigem token
            mostrarModal("Token não encontrado. Faça login novamente.", () => {
                window.location.href = "../../Login/Login.html";
            });
            return;
        }
        
        // Dados base para envio
        const dadosParaEnviar = {
            nome,
            email,
            senha,
            dt_nasc,
            telefone,
            cpf,
            ft_perfil
        };
        
        // Adicionar id_turma se for aluno
        if (tipoUsuario === "3") {
            const id_turma = document.getElementById("id_turma").value;
            if (!id_turma) {
                mostrarModal("Selecione uma turma para o aluno!");
                return;
            }
            dadosParaEnviar.id_turma = id_turma;
        }
        
        // Definir endpoint com base no tipo de usuário
        let endpoint;
        let requiresToken = true;
        
        switch (tipoUsuario) {
            case "3":
                endpoint = "http://localhost:8081/sec/cadAluno";
                break;
            case "2":
                endpoint = "http://localhost:8081/sec/cadProfessor";
                break;
            case "1":
                endpoint = "http://localhost:8081/sec/cadSecretaria";
                requiresToken = false; // A rota de secretaria não exige token
                break;
            default:
                mostrarModal("Tipo de usuário inválido!");
                return;
        }
        
        try {
            // Configuração do cabeçalho da requisição
            const headers = {
                "Content-Type": "application/json"
            };
            
            // Adicionar token se necessário
            if (requiresToken) {
                headers["Authorization"] = "Bearer " + token;
            }
            
            console.log("Enviando dados:", dadosParaEnviar);
            console.log("Endpoint:", endpoint);
            
            // Enviar requisição para a API
            const response = await fetch(endpoint, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(dadosParaEnviar)
            });
            
            // Verificar status da resposta
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ${response.status}`);
            }
            
            const result = await response.json();
            
            // Verificar se há erro na resposta
            if (result.error) {
                throw new Error(result.error);
            }
            
            mostrarModal(result.message || "Cadastro realizado com sucesso!");
            
            // Limpar campos após cadastro
            document.getElementById("nome").value = "";
            document.getElementById("email").value = "";
            document.getElementById("senha").value = "";
            document.getElementById("nascimento").value = "";
            document.getElementById("telefone").value = "";
            document.getElementById("cpf").value = "";
            document.querySelector(".photo-placeholder").style.backgroundImage = "";
            fotoPerfilBase64 = "";
            
            // Se for aluno, recarregar select de turma
            if (tipoUsuario === "3") {
                document.getElementById("id_turma").value = "";
            }
            
        } catch (error) {
            console.error("Erro ao cadastrar:", error);
            mostrarModal(`Erro ao realizar cadastro: ${error.message}`);
        }
    });
    
    // Inicializar o formulário com base no tipo inicial
    atualizarFormulario();
});