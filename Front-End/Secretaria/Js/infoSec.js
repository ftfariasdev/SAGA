// Função para buscar informações do usuário
async function buscarInformacoesUsuario() {
    try {
        // Pegar o ID do usuário do localStorage
        const id_user = localStorage.getItem('userId');
        
        // Pegar o token do localStorage
        const token = localStorage.getItem('token');

        if (!id_user || !token) {
            console.error('ID do usuário ou token não encontrado');
            return;
        }

        // Fazer a requisição para a API
        const response = await fetch(`http://localhost:8081/info/${id_user}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar informações');
        }

        const data = await response.json();        // Preencher os campos do formulário com os dados
        document.getElementById('nome').value = data.nome || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('nascimento').value = data.dt_nasc ? new Date(data.dt_nasc).toLocaleDateString() : '';
        document.getElementById('matricula').value = data.matricula || '';
          // Armazenar e carregar a foto do perfil
        const fotoPerfil = data.foto || localStorage.getItem('fotoPerfil') || '';
        localStorage.setItem('fotoPerfil', fotoPerfil);
        
        // Verificar se o elemento da foto existe e definir a imagem como background
        const fotoElement = document.querySelector('.photo-placeholder');
        if (fotoElement && fotoPerfil) {
            fotoElement.style.backgroundImage = `url('${fotoPerfil}')`;
            fotoElement.style.backgroundSize = 'cover';
            fotoElement.style.backgroundPosition = 'center';
        }
          document.getElementById('telefone').value = data.telefone || '';
        document.getElementById('cpf').value = data.cpf || '';

        // Aplicar máscaras após carregar os dados
        if (typeof aplicarMascarasAposDados === 'function') {
            aplicarMascarasAposDados();
        }

    } catch (error) {
        console.error('Erro:', error);
    }
}

// Função para carregar a foto do perfil a partir do localStorage
function carregarFotoPerfil() {
    const fotoPerfil = localStorage.getItem('fotoPerfil');
    const fotoElement = document.querySelector('.photo-placeholder');
    
    if (fotoPerfil && fotoElement) {
        fotoElement.style.backgroundImage = `url('${fotoPerfil}')`;
        fotoElement.style.backgroundSize = 'cover';
        fotoElement.style.backgroundPosition = 'center';
    }
}

// Chamar as funções quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    carregarFotoPerfil(); // Carrega a foto do localStorage primeiro
    buscarInformacoesUsuario(); // Depois busca os dados atualizados da API
});