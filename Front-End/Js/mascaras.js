// Função para formatar CPF (000.000.000-00)
function formatarCPF(valor) {
    // Remove tudo que não é dígito
    valor = valor.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }
    
    // Aplica a máscara progressivamente
    if (valor.length >= 4) {
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    }
    if (valor.length >= 8) {
        valor = valor.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    }
    if (valor.length >= 12) {
        valor = valor.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    }
    
    return valor;
}

// Função para aplicar máscara de CPF (000.000.000-00)
function aplicarMascaraCPF(campo) {
    // Aplica máscara ao valor inicial se existir
    if (campo.value) {
        campo.value = formatarCPF(campo.value);
    }
    
    campo.addEventListener('input', function(e) {
        e.target.value = formatarCPF(e.target.value);
    });
    
    // Remove caracteres não numéricos ao colar
    campo.addEventListener('paste', function(e) {
        setTimeout(() => {
            e.target.value = formatarCPF(e.target.value);
        }, 100);
    });
}

// Função para formatar telefone (XX XXXXX-XXXX)
function formatarTelefone(valor) {
    // Remove tudo que não é dígito
    valor = valor.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }
    
    // Aplica a máscara progressivamente
    if (valor.length >= 3) {
        valor = valor.replace(/(\d{2})(\d)/, '$1 $2');
    }
    if (valor.length >= 9) {
        valor = valor.replace(/(\d{2}) (\d{5})(\d)/, '$1 $2-$3');
    }
    
    return valor;
}

// Função para aplicar máscara de telefone (XX XXXXX-XXXX)
function aplicarMascaraTelefone(campo) {
    // Aplica máscara ao valor inicial se existir
    if (campo.value) {
        campo.value = formatarTelefone(campo.value);
    }
    
    campo.addEventListener('input', function(e) {
        e.target.value = formatarTelefone(e.target.value);
    });
    
    // Remove caracteres não numéricos ao colar
    campo.addEventListener('paste', function(e) {
        setTimeout(() => {
            e.target.value = formatarTelefone(e.target.value);
        }, 100);
    });
}

// Função para obter valor limpo do CPF (apenas números)
function obterCPFLimpo(valorComMascara) {
    return valorComMascara.replace(/\D/g, '');
}

// Função para obter valor limpo do telefone (apenas números)
function obterTelefoneLimpo(valorComMascara) {
    return valorComMascara.replace(/\D/g, '');
}

// Função para inicializar máscaras automaticamente
function inicializarMascaras() {
    // Aplica máscara nos campos de CPF
    const camposCPF = document.querySelectorAll('#cpf, input[name="cpf"]');
    camposCPF.forEach(campo => aplicarMascaraCPF(campo));
    
    // Aplica máscara nos campos de telefone
    const camposTelefone = document.querySelectorAll('#telefone, input[name="telefone"]');
    camposTelefone.forEach(campo => aplicarMascaraTelefone(campo));
}

// Função para aplicar máscaras após carregamento de dados via AJAX
function aplicarMascarasAposDados() {
    // Esta função pode ser chamada após carregar dados do servidor
    inicializarMascaras();
}

// Inicializa as máscaras quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', inicializarMascaras);

// Também inicializa quando a página estiver completamente carregada (caso haja dados carregados via script)
window.addEventListener('load', function() {
    // Pequeno delay para garantir que todos os scripts tenham executado
    setTimeout(inicializarMascaras, 500);
});
