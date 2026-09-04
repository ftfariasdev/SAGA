// Desativar temporariamente o Service Worker para resolver problemas de CORS
if (navigator.serviceWorker) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
    console.log('Service Workers foram desativados para resolver problemas de CORS');
  });
}

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = loginForm.querySelector('button[type="submit"]');
    
    // Criar um elemento para mensagens de erro, se ainda não existir
    let errorMessageElement = document.getElementById('errorMessage');
    if (!errorMessageElement) {
        errorMessageElement = document.createElement('div');
        errorMessageElement.id = 'errorMessage';
        errorMessageElement.className = 'alert alert-danger mt-3 d-none';
        errorMessageElement.setAttribute('role', 'alert');
        loginForm.insertAdjacentElement('afterend', errorMessageElement);
    }
    
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        // Mostrar estado de carregamento
        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';
        hideErrorMessage();
        
        // Obter os valores dos campos
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            // Verificar conexão com o servidor antes da requisição principal
            const testConnection = await fetch('http://localhost:8081/health', { 
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                timeout: 5000 // timeout de 5 segundos
            }).catch(error => {
                throw new Error('Servidor não está respondendo. Verifique se o backend está rodando.');
            });
            
            // Configuração da requisição principal
            const response = await fetch('http://localhost:8081/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                // Removido credentials: 'include' para resolver problema de CORS
                mode: 'cors', // Garantir que CORS esteja habilitado
                cache: 'no-cache',
                body: JSON.stringify({
                    email: email,
                    senha: password
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Login bem-sucedido
                // Salvar o token e dados do usuário no localStorage para uso posterior
                localStorage.setItem('token', data.token);
         
                // Armazenar o tipo de usuário para uso posterior
                if (data.tipo) {
                    localStorage.setItem('tipo', data.tipo);
                }
                if (data.id_user) {
                    localStorage.setItem('userId', data.id_user);
                }

                if (data.nome) {
                    localStorage.setItem('nomeUsuario', data.nome);
                }
                
                if (data.email) {
                    localStorage.setItem('emailUsuario', data.email);
                }
                
                if (data.ft_perfil) {
                    localStorage.setItem('fotoPerfil', data.ft_perfil);
                }
                
                // Verificar o tipo de usuário e redirecionar para a página adequada
                if (data.tipo !== undefined) {
                    // Converter valores numéricos para strings se necessário
                    switch(data.tipo) {
                        case 'professor':
                        case 2: // Assumindo que 2 é o código para professor
                            window.location.href = '../Professor/Page/HomeProfessor.html';
                            break;
                        case 'secretaria':
                        case 1: // Assumindo que 1 é o código para secretaria
                            window.location.href = '../Secretaria/Page/HomeSecretaria.html';
                            break;
                        case 'aluno':
                        case 3: // Assumindo que 3 é o código para aluno
                            window.location.href = '../Aluno/Page/HomeAluno.html';
                            break;
                        default:
                            console.log('Tipo de usuário recebido:', data.tipo);
                            showErrorMessage('Tipo de usuário não reconhecido (código: ' + data.tipo + ')');
                            resetLoginButton();                    }
                } else {
                    // Redirecionamento padrão se o tipo não for especificado
                    window.location.href = '../Login/Login.html';                }} else {
                // Login falhou
                const errorMessage = data.error || 'Verifique suas credenciais';
                // Mostrar erro na página sem alerta
                showErrorMessage('Erro de login: ' + errorMessage);
                resetLoginButton();
            }
        } catch (error) {
            console.error('Erro ao realizar login:', error);
            showErrorMessage(error.message || 'Erro ao conectar ao servidor. Verifique se o backend está rodando.');
            resetLoginButton();
        }
    });
    
    // Adicionar ouvintes de evento para melhorar UX
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    // Remover mensagens de erro quando o usuário começar a digitar novamente
    emailInput.addEventListener('input', hideErrorMessage);
    passwordInput.addEventListener('input', hideErrorMessage);
    
    function showErrorMessage(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.classList.remove('d-none');
    }
    
    function hideErrorMessage() {
        errorMessageElement.textContent = '';
        errorMessageElement.classList.add('d-none');
    }
    
    function resetLoginButton() {
        loginButton.disabled = false;
        loginButton.textContent = 'Entrar';
    }
    
    // --- INÍCIO: Login com Google ---
    window.handleGoogleCredentialResponse = async function(response) {
        // O id_token do Google
        const id_token = response.credential;
        try {
            const res = await fetch('http://localhost:8081/login/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ id_token })
            });
            const data = await res.json();
            if (res.ok) {
                // Salva dados no localStorage igual ao login normal
                localStorage.setItem('token', data.token);
                if (data.tipo) localStorage.setItem('tipo', data.tipo);
                if (data.id_user) localStorage.setItem('userId', data.id_user);
                if (data.nome) localStorage.setItem('nomeUsuario', data.nome);
                if (data.emailDoBanco) localStorage.setItem('emailUsuario', data.emailDoBanco);
                if (data.ft_perfil) localStorage.setItem('fotoPerfil', data.ft_perfil);

                // Redireciona conforme o tipo
                switch(data.tipo) {
                    case 'professor':
                    case 2:
                        window.location.href = '../Professor/Page/HomeProfessor.html';
                        break;
                    case 'secretaria':
                    case 1:
                        window.location.href = '../Secretaria/Page/HomeSecretaria.html';
                        break;
                    case 'aluno':
                    case 3:                        window.location.href = '../Aluno/Page/HomeAluno.html';
                        break;
                    default:
                        window.location.href = '../Login/Login.html';
                }} else {
                const errorMessage = data.error || 'Tente novamente.';                // Verificar se é o erro específico de usuário não cadastrado
                if (errorMessage.includes('Cadastro não existe')) {
                    // Mostrar alerta separado com instruções claras
                    alert('Cadastro não existe. Entre em contato com a secretaria para realizar seu cadastro.');
                    // Não redirecionar, apenas resetar a interface se necessário
                    if (loginButton) {
                        resetLoginButton();
                    }
                } else {
                    // Mostrar erro na página
                    showErrorMessage('Erro no login com Google: ' + errorMessage);
                }
            }
        } catch (error) {
            showErrorMessage('Erro ao conectar com o servidor: ' + error.message);
        }
    };

    // Renderiza o botão do Google
    window.onload = function () {
        google.accounts.id.initialize({
            client_id: '893107006356-bsmaaq8od6hoi8b9vn92mof6i84gdf2k.apps.googleusercontent.com',
            callback: handleGoogleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.getElementById("googleSignInBtn"),
            { theme: "outline", size: "large", width: "100%" }
        );
    };
    // --- FIM: Login com Google ---
});