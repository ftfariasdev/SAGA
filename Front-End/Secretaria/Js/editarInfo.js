document.addEventListener('DOMContentLoaded', async function () {
    // Elementos do DOM
    const nomeInput = document.getElementById('nome');
    const nascimentoInput = document.getElementById('nascimento');
    const matriculaInput = document.getElementById('matricula');
    const emailInput = document.getElementById('email');
    const telefoneInput = document.getElementById('telefone');
    const cpfInput = document.getElementById('cpf');
    const fotoPerfil = document.querySelector('.photo-placeholder');
    const btnSalvar = document.getElementById('btnSalvar');
    const btnCancelar = document.getElementById('btnCancelar');
    const uploadPhotoBtn = document.querySelector('.upload-photo');
    const photoInput = document.getElementById('photoInput');
    
    // Variável para armazenar a foto em base64
    let fotoPerfilBase64 = '';
    let userData = null;

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


    // Verificar se o usuário está autenticado
    async function verificarToken() {
        const token = localStorage.getItem('token');
        if (!token) {
            mostrarErroConexao('Sessão expirada', 'Você precisa fazer login novamente.');
            setTimeout(() => {
                window.location.href = '../Login/Login.html';
            }, 2000);
            return null;
        }

        try {
            const response = await fetch('http://localhost:8081/token', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Token inválido');
            }

            return token;
        } catch (error) {
            mostrarErroConexao('Erro de autenticação', 'Sua sessão expirou ou é inválida. Por favor, faça login novamente.');
            setTimeout(() => {
                window.location.href = '../Login/Login.html';
            }, 2000);
            return null;
        }
    }

    // Função para mostrar erro de conexão
    function mostrarErroConexao(titulo, mensagem) {
        const modalHTML = `
        <div class="error-modal-container" id="errorModal">
            <div class="error-modal">
                <div class="error-modal-header">
                    <h2>${titulo}</h2>
                </div>
                <div class="error-modal-body">
                    <p>${mensagem}</p>
                    <div class="error-modal-tips">
                        <h3>Verifique se:</h3>
                        <ul>
                            <li>O servidor back-end está rodando na porta 8081</li>
                            <li>Não há nenhum firewall bloqueando a conexão</li>
                            <li>O endereço está correto (http://localhost:8081)</li>
                        </ul>
                    </div>
                </div>
                <div class="error-modal-footer">
                    <button class="retry-button">Tentar novamente</button>
                </div>
            </div>
        </div>
        `;

        // Adicionar o modal ao body
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer.firstElementChild);

        // Adicionar CSS para o modal
        const style = document.createElement('style');
        style.textContent = `
            .error-modal-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            
            .error-modal {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                max-width: 500px;
                width: 90%;
                padding: 20px;
            }
            
            .error-modal-header {
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
                margin-bottom: 15px;
            }
            
            .error-modal-header h2 {
                margin: 0;
                color: #e74c3c;
            }
            
            .error-modal-body {
                margin-bottom: 20px;
            }
            
            .error-modal-tips {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 4px;
                margin-top: 15px;
            }
            
            .error-modal-tips h3 {
                margin-top: 0;
                font-size: 16px;
            }
            
            .error-modal-tips ul {
                margin-bottom: 0;
                padding-left: 20px;
            }
            
            .error-modal-footer {
                text-align: right;
            }
            
            .retry-button {
                background-color: #2196F3;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .retry-button:hover {
                background-color: #0b7dda;
            }
        `;
        document.head.appendChild(style);

        // Adicionar evento para o botão de tentar novamente
        document.querySelector('.retry-button').addEventListener('click', function() {
            document.body.removeChild(document.getElementById('errorModal'));
            carregarInformacoesUsuario();
        });
    }

    // Função para redimensionar e otimizar imagens
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

    // Carregar informações do usuário
    async function carregarInformacoesUsuario() {
        const token = await verificarToken();
        if (!token) return;

        // Recuperar o ID do usuário do localStorage
        const userId = localStorage.getItem('id_user');
        if (!userId) {
            mostrarErroConexao('Erro', 'ID do usuário não encontrado. Por favor, faça login novamente.');
            setTimeout(() => {
                window.location.href = '../Login/Login.html';
            }, 2000);
            return;
        }

        try {
            // URL da requisição
            const url = `http://localhost:8081/info/${userId}`;
            
            // Fazer a requisição
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Verificar se a resposta foi bem sucedida
            if (!response.ok) {
                if (response.status === 401) {
                    mostrarErroConexao('Sessão expirada', 'Sua sessão expirou. Por favor, faça login novamente.');
                    setTimeout(() => {
                        window.location.href = '../Login/Login.html';
                    }, 2000);
                    return;
                }
                throw new Error(`Erro ao buscar informações: ${response.status}`);
            }

            // Converter resposta para JSON
            userData = await response.json();

            // Preencher os campos do formulário
            nomeInput.value = userData.nome || '';
            
            // Formatar a data de nascimento (YYYY-MM-DDT00:00:00.000Z para YYYY-MM-DD para input type date)
            if (userData.dt_nasc) {
                const data = new Date(userData.dt_nasc);
                const ano = data.getFullYear();
                const mes = String(data.getMonth() + 1).padStart(2, '0');
                const dia = String(data.getDate()).padStart(2, '0');
                nascimentoInput.value = `${ano}-${mes}-${dia}`;
            } else {
                nascimentoInput.value = '';
            }
            
            matriculaInput.value = userData.matricula || '';
            emailInput.value = userData.email || '';
            telefoneInput.value = userData.telefone || '';
            cpfInput.value = userData.cpf || '';

            // Definir a foto de perfil
            if (userData.ft_perfil) {
                fotoPerfil.style.backgroundImage = `url(${userData.ft_perfil})`;
                fotoPerfilBase64 = userData.ft_perfil;
            }

        } catch (error) {
            console.error('Erro ao carregar informações:', error);
            mostrarErroConexao('Erro de conexão', 'Não foi possível carregar as informações do usuário. Por favor, tente novamente mais tarde.');
        }
    }

    // Salvar alterações
    async function salvarAlteracoes() {
        const token = await verificarToken();
        if (!token) return;

        // Recuperar o ID do usuário do localStorage
        const userId = localStorage.getItem('id_user');
        if (!userId) {
            mostrarErroConexao('Erro', 'ID do usuário não encontrado. Por favor, faça login novamente.');
            setTimeout(() => {
                window.location.href = '../Login/Login.html';
            }, 2000);
            return;
        }

        try {
            // Preparar dados para envio
            const dadosAtualizados = {
                id_user: userId,
                nome: nomeInput.value,
                email: emailInput.value,
                dt_nasc: nascimentoInput.value,
                telefone: telefoneInput.value,
                ft_perfil: fotoPerfilBase64
            };

            // Fazer a requisição de atualização
            const response = await fetch('http://localhost:8081/editarInfo', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dadosAtualizados)
            });

            // Verificar se a resposta foi bem sucedida
            if (!response.ok) {
                if (response.status === 401) {
                    mostrarErroConexao('Sessão expirada', 'Sua sessão expirou. Por favor, faça login novamente.');
                    setTimeout(() => {
                        window.location.href = '../Login/Login.html';
                    }, 2000);
                    return;
                }
                
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro ao atualizar informações: ${response.status}`);
            }

            // Exibir mensagem de sucesso
            mostrarModal('Informações atualizadas com sucesso!');
            
            // Redirecionar para a página de informações
            window.location.href = 'info.html';

        } catch (error) {
            console.error('Erro ao salvar alterações:', error);
            mostrarModal(`Erro ao salvar alterações: ${error.message}`);
        }
    }

    // Eventos
    
    // Evento para o botão de salvar
    btnSalvar.addEventListener('click', salvarAlteracoes);
    
    // Evento para o botão de cancelar
    btnCancelar.addEventListener('click', function() {
        window.location.href = 'info.html';
    });

    // Evento para o botão de upload de foto
    uploadPhotoBtn.addEventListener('click', function() {
        photoInput.click();
    });

    // Evento para quando uma foto é selecionada
    photoInput.addEventListener('change', async function() {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            
            // Verificar se o arquivo é uma imagem
            if (!file.type.match('image.*')) {
                mostrarModal('Por favor, selecione uma imagem.');
                return;
            }
            
            // Verificar o tamanho do arquivo (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                mostrarModal('A imagem deve ter no máximo 5MB.');
                return;
            }
            
            // Ler o arquivo como base64
            const reader = new FileReader();
            reader.onload = async function(e) {
                // Redimensionar a imagem antes de armazenar
                fotoPerfilBase64 = await resizeImage(e.target.result);
                
                // Exibir a imagem
                fotoPerfil.style.backgroundImage = `url(${fotoPerfilBase64})`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Carregar as informações do usuário ao iniciar a página
    carregarInformacoesUsuario();
});
