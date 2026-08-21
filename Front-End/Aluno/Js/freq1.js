document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("freqChart").getContext("2d");

  new Chart(ctx, {
    type: "pie", 
    data: {
      labels: ["Presença", "Ausência"],
      datasets: [
        {
          data: [50, 50],
          backgroundColor: ["#00B000", "#D00000"],
          borderWidth: 0,
        },
      ],
    },
    options: {
       animation: {
      duration: 1250
      },
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
        datalabels: {
          color: "white",
          font: {
            weight: "bold",
            size: 18,
          },
          formatter: (value, context) => value + "%",
        },
      },
    },
    plugins: [ChartDataLabels],
  });
});

document.addEventListener('DOMContentLoaded', function () {
  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    headerToolbar: {
      end: 'today prev,next',
      start: 'title'
    },
    dateClick: function(info) {
      window.location.href = `freq2.html?data=${info.dateStr}`;
    }
  });
  calendar.render();

  // Buscar frequência geral do aluno
  fetch('/aluno/listMateria', {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  })
  .then(res => res.json())
  .then(data => {
    // Aqui você pode calcular a frequência geral e atualizar o gráfico
    // Exemplo: atualizar o gráfico com os dados reais
  });
});