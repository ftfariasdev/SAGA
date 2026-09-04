document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("courseTableBody");

    const data = [
        { materia: "Sistemas Web", cargaHoraria: "100 Horas", totalAulas: 30 },
        { materia: "Sistemas Web", cargaHoraria: "100 Horas", totalAulas: 30 },
        { materia: "Sistemas Web", cargaHoraria: "100 Horas", totalAulas: 30 },
        { materia: "Sistemas Web", cargaHoraria: "100 Horas", totalAulas: 30 },
        { materia: "Sistemas Web", cargaHoraria: "100 Horas", totalAulas: 30 },
        { materia: "Sistemas Web", cargaHoraria: "100 Horas", totalAulas: 30 }
    ];

    data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.materia}</td>
            <td>${item.cargaHoraria}</td>
            <td>${item.totalAulas}</td>
        `;
        tableBody.appendChild(row);
    });
});
