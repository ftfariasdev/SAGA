document.addEventListener('DOMContentLoaded', async () => {
  const menu = document.getElementById('menuSuspenso');
  const perfil = document.querySelector('.perfil');
  const circulo = document.querySelector('.circulo');
  const perfilNome = document.querySelector('.perfil b');
  const menuNomeElement = document.querySelector('#menuSuspenso p');

  // Carregar dados do usuário do localStorage
  carregarDadosUsuario();
  
  // Se tiver userId, tentar buscar mais informações da API
  const userId = localStorage.getItem('userId');
  if (userId) {
    try {
      await buscarDadosUsuarioApi(userId);
    } catch (error) {
      console.error('Erro ao buscar dados atualizados:', error);
    }
  }

  function toggleMenu() {
    if (menu) {
      menu.classList.toggle('ativo');
    }
  }

  // Adiciona o evento de clique no perfil
  if (perfil) {
    perfil.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
  }

  // Fecha o menu ao clicar fora
  document.addEventListener('click', (e) => {
    if (menu && perfil && !perfil.contains(e.target)) {
      menu.classList.remove('ativo');
    }
  });

  // Adiciona funcionalidade ao botão de sair
  const btnSair = document.querySelector('.sair');
  if (btnSair) {
    btnSair.addEventListener('click', () => {
      localStorage.clear();
      // Redirecionar para a página de login
      window.location.href = '../../Login/Login.html';
    });
  }
  
  // Função para carregar dados do usuário do localStorage
  function carregarDadosUsuario() {
    const nomeUsuario = localStorage.getItem('nomeUsuario');
    const emailUsuario = localStorage.getItem('emailUsuario');
    const fotoPerfilURL = localStorage.getItem('fotoPerfil');
    
    console.log('Dados do localStorage:', { nomeUsuario, emailUsuario, fotoPerfilURL });
    
    // Atualizar a interface com os dados do localStorage
    if (perfilNome && nomeUsuario) {
      perfilNome.textContent = nomeUsuario.split(' ')[0]; // Apenas o primeiro nome
    }
    
    if (menuNomeElement && nomeUsuario) {
      menuNomeElement.innerHTML = `${nomeUsuario}<br><small>${emailUsuario || ''}</small>`;
    }
    
    // Configurar foto de perfil se disponível
    if (circulo && fotoPerfilURL) {
      circulo.style.backgroundImage = `url(${fotoPerfilURL})`;
      circulo.style.backgroundSize = 'cover';
      circulo.style.backgroundPosition = 'center';
    }
  }
  
  // Função para buscar dados atualizados da API
  async function buscarDadosUsuarioApi(userId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('Token não encontrado');
      return;
    }
    
    console.log('Buscando dados do usuário da API:', userId);
    console.log('Token:', token);
    
    try {
      // Requisição para obter informações do usuário
      const response = await fetch(`http://localhost:8081/info/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Falha ao buscar informações do usuário: ${response.status}`);
      }
      
      const userData = await response.json();
      console.log('Dados obtidos da API:', userData);
      
      // Atualizar localStorage com dados completos
      localStorage.setItem('nomeUsuario', userData.nome);
      localStorage.setItem('emailUsuario', userData.email);
      
      if (userData.ft_perfil) {
        localStorage.setItem('fotoPerfil', userData.ft_perfil);
      }
      
      // Atualizar interface com os dados
      if (perfilNome) {
        perfilNome.textContent = userData.nome.split(' ')[0]; // Primeiro nome
      }
      
      if (menuNomeElement) {
        menuNomeElement.innerHTML = `${userData.nome}<br><small>${userData.email}</small>`;
      }
      
      // Configurar foto de perfil
      if (circulo && userData.ft_perfil) {
        circulo.style.backgroundImage = `url(${userData.ft_perfil})`;
        circulo.style.backgroundSize = 'cover';
        circulo.style.backgroundPosition = 'center';
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      // Continue usando os dados do localStorage em caso de erro
    }
  }
});