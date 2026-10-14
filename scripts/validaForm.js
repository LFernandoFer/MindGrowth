function exibirErro(mensagem) {
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    if (successMessage) {
        successMessage.textContent = '';
    }

    if (errorMessage) {
        errorMessage.textContent = mensagem;
    }
}

function exibirSucesso(mensagem) {
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    if (errorMessage) {
        errorMessage.textContent = '';
    }

    if (successMessage) {
        successMessage.textContent = mensagem;
    }
}

function limparMensagens() {
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    if (errorMessage) {
        errorMessage.textContent = '';
    }

    if (successMessage) {
        successMessage.textContent = '';
    }
}

function validaCampoVazio(valor, nomeCampo) {
    if (!valor || valor.trim() === '') {
        exibirErro('O campo ' + nomeCampo + ' é obrigatório.');
        return false;
    }
    return true;
}

function validaSenha(senha) {
    if (senha.length < 6) {
        exibirErro('A senha deve ter pelo menos 6 caracteres.');
        return false;
    }
    return true;
}

function validaConfirmarSenha(senha, confirmarSenha) {
    if (senha !== confirmarSenha) {
        exibirErro('As senhas não coincidem.');
        return false;
    }
    return true;
}

function validaEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email)) {
        exibirErro('Informe um e-mail válido.');
        return false;
    }
    return true;
}

function validaTelefone(telefone) {
    if (!telefone || telefone.trim() === '') {
        return true;
    }

    const numeros = telefone.replace(/\D/g, '');

    if (numeros.length < 10 || numeros.length > 11) {
        exibirErro('Informe um telefone válido: (xx)xxxxx-xxxx');
        return false;
    }
    return true;
}

function validaIdade(idade) {
    if (!idade || idade === '') {
        return true;
    }

    const idadeNum = parseInt(idade, 10);

    if (isNaN(idadeNum) || idadeNum < 1 || idadeNum > 100) {
        exibirErro('Informe uma idade válida.');
        return false;
    }
    return true;
}

function validaSexo() {
    const sexoMasc = document.getElementById('sexoMasc');
    const sexoFem = document.getElementById('sexoFem');

    if (!sexoMasc || !sexoFem) {
        return true;
    }

    if (!sexoMasc.checked && !sexoFem.checked) {
        exibirErro('Selecione o sexo.');
        return false;
    }
    return true;
}

function validaTermos() {
    const termos = document.getElementById('termos');

    if (!termos) {
        return true;
    }

    if (!termos.checked) {
        exibirErro('Você deve concordar com os termos de uso.');
        return false;
    }
    return true;
}

function formatarTelefone(input) {
    let valor = input.value.replace(/\D/g, '');

    if (valor.length > 11) {
        valor = valor.substring(0, 11);
    }

    if (valor.length > 6) {
        input.value = '(' + valor.substring(0, 2) + ')' + valor.substring(2, 7) + '-' + valor.substring(7);
    } else if (valor.length > 2) {
        input.value = '(' + valor.substring(0, 2) + ')' + valor.substring(2);
    } else if (valor.length > 0) {
        input.value = '(' + valor;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const telefone = document.getElementById('telefone');

    if (telefone) {
        telefone.addEventListener('input', function () {
            formatarTelefone(telefone);
        });
    }
});
