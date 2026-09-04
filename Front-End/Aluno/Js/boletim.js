document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("boletimTableBody");
    const bimestreSelect = document.getElementById("bimestreSelect");

    // Adiciona opções dos bimestres
    bimestreSelect.innerHTML = `
        <option value="1">1º Bimestre</option>
        <option value="2">2º Bimestre</option>
        <option value="3">3º Bimestre</option>
        <option value="4">4º Bimestre</option>
    `;

    // Função para buscar e exibir dados do bimestre selecionado
    async function carregarBimestre(bimestre) {
        tableBody.innerHTML = "<tr><td colspan='4'>Carregando...</td></tr>";
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8081/aluno/bimestre/${bimestre}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) {
                tableBody.innerHTML = `<tr><td colspan='4'>Erro ao carregar dados do bimestre.</td></tr>`;
                return;
            }
            const data = await response.json();

            tableBody.innerHTML = "";
            if (data.materias && data.materias.length > 0) {
                data.materias.forEach(item => {
                    tableBody.innerHTML += `
                        <tr>
                            <td>${item.nome}</td>
                            <td>${item.notaB1 !== undefined && item.notaB1 !== null && item.notaB1 !== "-" ? item.notaB1 : "Sem nota"}</td>
                            <td>${item.notaB2 !== undefined && item.notaB2 !== null && item.notaB2 !== "-" ? item.notaB2 : "Sem nota"}</td>
                            <td>${item.frequencia ?? "-"}</td>
                        </tr>
                    `;
                });
            } else {
                tableBody.innerHTML = "<tr><td colspan='4'>Nenhuma matéria encontrada para este bimestre.</td></tr>";
            }
        } catch (err) {
            tableBody.innerHTML = `<tr><td colspan='4'>Erro ao carregar dados.</td></tr>`;
        }
    }

    // Evento de mudança do select
    bimestreSelect.addEventListener("change", function () {
        const bimestre = this.value;
        carregarBimestre(bimestre);
    });

    // Carrega o 1º bimestre ao iniciar
    carregarBimestre("1");
});
