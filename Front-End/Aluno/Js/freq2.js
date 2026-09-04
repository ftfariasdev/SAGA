document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    headerToolbar: {
      end: 'today prev,next',
      start: 'title'
    },
  });
  calendar.render();

  const tableBody = document.getElementById('freq2TableBody');
  const urlParams = new URLSearchParams(window.location.search);
  const data = urlParams.get('data');

  if (data) {
    const token = localStorage.getItem('token');
    if (!token) {
      tableBody.innerHTML = '<tr><td colspan="3">Token de acesso não encontrado.</td></tr>';
      return;
    }

    fetch(`http://localhost:8081/aluno/presencas-dia?data=${data}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(presencas => {
      tableBody.innerHTML = '';
      if (presencas.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3">Nenhuma aula encontrada para este dia.</td></tr>';
      } else {
        presencas.forEach(item => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${item.materia}</td>
            <td>${item.professor}</td>
            <td style="color: ${item.presente ? '#00B000' : '#D00000'}; font-weight: bold;">
              ${item.presente ? 'Presente' : 'Falta'}
            </td>
          `;
          tableBody.appendChild(tr);
        });
      }
    })
    .catch(error => {
      console.error('Erro ao buscar presenças:', error);
      tableBody.innerHTML = '<tr><td colspan="3">Erro ao carregar dados de frequência.</td></tr>';
    });
  } else {
    tableBody.innerHTML = '<tr><td colspan="3">Data não informada.</td></tr>';
  }
});
