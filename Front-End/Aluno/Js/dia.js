document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const dia = urlParams.get('dia');
  const status = urlParams.get('status');

  document.getElementById('dataDia').textContent = dia || 'Não especificado';
  document.getElementById('statusDia').textContent = status || 'Indefinido';
});
