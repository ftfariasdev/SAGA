document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('ListaCursosTableBody');
    const searchInput = document.querySelector('.search-box input');
    let cursos = [];

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

    // Função para carregar os cursos
    async function carregarCursos() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                mostrarModal('Usuário não autenticado. Por favor, faça login novamente.');
                window.location.href = '../Login/Login.html';
                return;
            }

            const response = await fetch('http://localhost:8081/sec/listarCursos', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar cursos');
            }

            cursos = await response.json();
            exibirCursos(cursos);
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao carregar cursos. Por favor, tente novamente.');
        }
    }

    // Função para excluir curso
    async function excluirCurso(id_curso) {
        if (!confirm('Tem certeza que deseja excluir este curso?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8081/sec/excluirCurso/${id_curso}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao excluir curso');
            }

            mostrarModal('Curso excluído com sucesso!');
            carregarCursos(); // Recarrega a lista
        } catch (error) {
            console.error('Erro:', error);
            mostrarModal('Erro ao excluir curso. Por favor, tente novamente.');
        }
    }

    // Função para exibir os cursos na tabela
    function exibirCursos(cursos) {
        tableBody.innerHTML = '';
        
        cursos.forEach(curso => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${curso.codigo}</td>
                <td>${curso.nome}</td>
                
                <td>
                    <a href="editarCurso.html?id=${curso.id_curso}">
                        <button class="editar">Editar</button>
                    </a>
                </td>
                <td>
                    <button class="excluir" onclick="excluirCurso('${curso.id_curso}')">Excluir</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Função para filtrar cursos
    function filtrarCursos(termo) {
        const termoLower = termo.toLowerCase();
        const cursosFiltrados = cursos.filter(curso => 
            curso.nome.toLowerCase().includes(termoLower) ||
            curso.id_curso.toString().includes(termoLower)
        );
        exibirCursos(cursosFiltrados);
    }

    // Event listener para pesquisa
    searchInput.addEventListener('input', (e) => {
        filtrarCursos(e.target.value);
    });

    // Tornar a função excluirCurso global
    window.excluirCurso = excluirCurso;

    // Carregar cursos ao iniciar
    carregarCursos();
});
// função de pesquisa
function searchFunction() {
    var input = document.getElementById("listInput");
    var filter = input.value.toUpperCase();
    var table = document.getElementById("listTable");
    var trs = table.tBodies[0].getElementsByTagName("tr");

    for (var i = 0; i < trs.length; i++) {
        var tds = trs[i].getElementsByTagName("td");
        trs[i].style.display = "none";

        for (var j = 0; j < 2; j++) { // verifica as primeiras duas colunas 
            if (tds[j].innerHTML.toUpperCase().indexOf(filter) > -1) {
                trs[i].style.display = ""; // mostra as colunas se forem encontradas
                break; 
            }
        }
    }
}
