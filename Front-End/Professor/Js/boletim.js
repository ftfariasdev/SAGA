document.addEventListener("DOMContentLoaded", function () {
    const tableBody = document.getElementById("boletimTableBody");

    const data = [
        { materia: "Sistemas Web", bimestre1: 10, bimestre2: 9, frequencia: "100 Horas" },
        { materia: "Sistemas Web", bimestre1: 5, bimestre2: 6, frequencia: "100 Horas" },
        { materia: "Sistemas Web", bimestre1: 10, bimestre2: 8, frequencia: "100 Horas" },
        { materia: "Sistemas Web", bimestre1: 3, bimestre2: 10, frequencia: "10 Horas" },
        { materia: "Sistemas Web", bimestre1: 10, bimestre2: 9, frequencia: "100 Horas" },
        { materia: "Sistemas Web", bimestre1: 10, bimestre2: 2, frequencia: "100 Horas" }
    ];

    data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.materia}</td>
            <td>${item.bimestre1}</td>
            <td>${item.bimestre2}</td>
            <td>${item.frequencia}</td>
        `;
        tableBody.appendChild(row);
    });
});
