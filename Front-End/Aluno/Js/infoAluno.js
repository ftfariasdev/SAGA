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

        const data = await response.json();

        // Preencher os campos do formulário com os dados
        document.getElementById('nome').value = data.nome || '';
        document.getElementById('email').value = data.email || '';
        document.getElementById('nascimento').value = data.dt_nasc ? new Date(data.dt_nasc).toLocaleDateString() : '';
        document.getElementById('matricula').value = data.matricula || '';
        document.getElementById('telefone').value = data.telefone || '';
        document.getElementById('turma').value = data.turma || '';

    } catch (error) {
        console.error('Erro:', error);
    }
}

// Chamar a função quando a página carregar
document.addEventListener('DOMContentLoaded', buscarInformacoesUsuario);