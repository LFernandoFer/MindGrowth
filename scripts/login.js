/**
 * MindGrowth - login.js
 * Fluxo de autenticação e redirecionamento por perfil (ALUNO, PROFESSOR, COORDENADOR)
 */

function validaFormularioLogin() {
    limparMensagens();

    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;

    if (!validaCampoVazio(usuario, 'Usuário / E-mail')) return false;
    if (!validaCampoVazio(senha, 'Senha')) return false;

    return true;
}

async function realizarLogin(event) {
    if (event) event.preventDefault();

    if (!validaFormularioLogin()) {
        return;
    }

    const loginInput = document.getElementById('usuario').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value;
    const apiBase = (typeof DataStore !== 'undefined' && DataStore.getApiBase) ? DataStore.getApiBase() : 'http://localhost:3000';

    try {
        // Tentativa de autenticação direta no backend Node.js / MySQL
        const response = await fetch(`${apiBase}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: loginInput, senha: senha }),
            signal: AbortSignal.timeout(3000)
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
            setAuthUser(data.user);
            exibirSucesso('Login realizado com sucesso via MySQL! Redirecionando...');
            setTimeout(function () {
                redirecionarPorPerfil(data.user.tipo_usuario);
            }, 800);
            return;
        } else if (response.status === 401 || response.status === 403) {
            exibirErro(data.error || 'Usuário ou senha incorretos.');
            return;
        }
    } catch (e) {
        console.warn('API offline, utilizando validação local de fallback:', e);
    }

    // Fallback local se o servidor não estiver respondendo
    const usuarios = DataStore.getUsuarios();
    const user = usuarios.find(u =>
        (u.username.toLowerCase() === loginInput || u.email.toLowerCase() === loginInput) &&
        (u.senha_hash === senha || (u.senha && u.senha === senha))
    );

    if (!user) {
        exibirErro('Usuário/E-mail ou senha incorretos.');
        return;
    }

    if (user.ativo === false) {
        exibirErro('Esta conta está desativada ou aguardando aprovação da coordenação.');
        return;
    }

    setAuthUser({
        id_usuario: user.id_usuario,
        nome: user.nome,
        username: user.username,
        email: user.email,
        tipo_usuario: user.tipo_usuario
    });

    exibirSucesso('Login realizado com sucesso! Redirecionando...');

    setTimeout(function () {
        redirecionarPorPerfil(user.tipo_usuario);
    }, 800);
}

function redirecionarPorPerfil(tipoUsuario) {
    switch (tipoUsuario) {
        case 'ALUNO':
            window.location.href = 'aluno.html';
            break;
        case 'PROFESSOR':
            window.location.href = 'professor.html';
            break;
        case 'COORDENADOR':
            window.location.href = 'relatorios.html';
            break;
        default:
            window.location.href = '../index.html';
    }
}

// Facilitador de demonstração rápida (preencher credenciais de teste)
function preencherDemo(username, senha) {
    document.getElementById('usuario').value = username;
    document.getElementById('senha').value = senha;
    realizarLogin();
}

document.addEventListener('DOMContentLoaded', function () {
    const formLogin = document.getElementById('formLogin');

    if (formLogin) {
        formLogin.addEventListener('submit', realizarLogin);
    }
});
