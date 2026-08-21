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

// Função para verificar o token
function verificaToken() {
    console.log("Verificando token armazenado...");
    const token = localStorage.getItem('token');
    
    if (!token) {
        console.error("Token não encontrado no localStorage");
        mostrarModal("Token não encontrado. Faça login novamente.");
        window.location.href = "../../Login/Login.html";
        return;
    }
    
    console.log("Token encontrado:", token.substring(0, 15) + "...");
    
    // Log de outros dados importantes no localStorage
    const userId = localStorage.getItem('id_user') || localStorage.getItem('userId');
    console.log("ID do usuário no localStorage:", userId);
    
    // Se tivermos 'id_user' mas não 'userId', vamos padronizar
    if (localStorage.getItem('id_user') && !localStorage.getItem('userId')) {
        localStorage.setItem('userId', localStorage.getItem('id_user'));
    }
    
    fetch("http://localhost:8081/token", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log("Resposta da verificação do token:", response.status, response.statusText);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.error("Token expirado ou inválido (401 Unauthorized)");
                
                // Remover token inválido do localStorage
                localStorage.removeItem('token');
                
                mostrarModal("Sua sessão expirou. Por favor, faça login novamente.");
                window.location.href = "../../Login/Login.html";
            } else {
                console.error(`Erro na verificação do token: ${response.status} - ${response.statusText}`);
                throw new Error(`Falha na verificação do token: ${response.status}`);
            }
        } else {
            console.log("Token válido, usuário autenticado com sucesso");
        }
    })
    .catch(error => {
        console.error("Erro durante a verificação do token:", error);
        
        if (error.message && error.message.includes('Failed to fetch')) {
            console.error("Erro de conexão com o servidor");
            mostrarModal("Não foi possível conectar ao servidor. Verifique sua conexão de internet e se o servidor está em execução.");
        }
    });
}

// Executa a verificação assim que a página carregar
document.addEventListener('DOMContentLoaded', verificaToken);