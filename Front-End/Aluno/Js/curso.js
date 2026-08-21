document.addEventListener("DOMContentLoaded", async function () {
    const tableBody = document.getElementById("courseTableBody");
    const token = localStorage.getItem("token");

    if (!token) {
        alert("Usuário não autenticado!");
        window.location.href = "../../login.html";
        return;
    }

    try {
        const response = await fetch("http://localhost:8081/aluno/listMateria", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Erro ao buscar informações do curso");
        }

        const data = await response.json();

        // Supondo que data seja um array de objetos com materia, cargaHoraria, professor
        tableBody.innerHTML = ""; // Limpa a tabela antes de preencher
        data.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.materia}</td>
                <td>${item.cargaHoraria}</td>
                <td>${item.professor}</td>
            `;
            tableBody.appendChild(row);
        });

        // Caso não haja dados
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3">Nenhuma matéria encontrada.</td></tr>`;
        }
    } catch (error) {
        console.error(error);
        tableBody.innerHTML = `<tr><td colspan="3">Erro ao carregar dados do curso.</td></tr>`;
    }
});
