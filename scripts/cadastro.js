/**
 * MindGrowth - cadastro.js
 * Fluxo de cadastro de novos usuários compatível com BD v2.0
 */

function validaFormularioCadastro() {
    limparMensagens();

    const nome = document.getElementById('nome').value;
    const usuario = document.getElementById('usuarioLogin').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const telefone = document.getElementById('telefone').value;
    const idade = document.getElementById('idade').value;

    if (!validaCampoVazio(nome, 'Nome')) return false;
    if (!validaCampoVazio(usuario, 'Usuário')) return false;
    if (!validaCampoVazio(email, 'E-mail')) return false;
    if (!validaEmail(email)) return false;
    if (!validaCampoVazio(senha, 'Senha')) return false;
    if (!validaSenha(senha)) return false;
    if (!validaCampoVazio(confirmarSenha, 'Confirmar senha')) return false;
    if (!validaConfirmarSenha(senha, confirmarSenha)) return false;
    if (!validaTelefone(telefone)) return false;
    if (!validaIdade(idade)) return false;
    if (!validaSexo()) return false;
    if (!validaTermos()) return false;

    return true;
}

async function cadastrarUsuario(event) {
    event.preventDefault();

    if (!validaFormularioCadastro()) {
        return;
    }

    const nome = document.getElementById('nome').value.trim();
    const username = document.getElementById('usuarioLogin').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value;
    const telefone = document.getElementById('telefone').value.trim();
    const perfilSelect = document.getElementById('perfil').value.toUpperCase();
    const sexoMasc = document.getElementById('sexoMasc').checked;
    const sexo = sexoMasc ? 'MASCULINO' : 'FEMININO';
    const apiBase = (typeof DataStore !== 'undefined' && DataStore.getApiBase) ? DataStore.getApiBase() : 'http://localhost:3000';

    try {
        // Envio direto para o banco de dados MySQL via API Node.js
        const response = await fetch(`${apiBase}/api/usuarios/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome,
                username,
                email,
                senha,
                telefone,
                sexo,
                perfil: perfilSelect
            }),
            signal: AbortSignal.timeout(3000)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (typeof DataStore !== 'undefined' && DataStore.sync) {
                await DataStore.sync();
            }
            exibirSucesso('Cadastro realizado e salvo no MySQL! Redirecionando para o login...');
            setTimeout(function () {
                window.location.href = 'login.html';
            }, 1200);
            return;
        } else if (response.status === 409) {
            exibirErro(data.error || 'Nome de usuário ou e-mail já cadastrado.');
            return;
        }
    } catch (e) {
        console.warn('API offline, utilizando cadastro local de fallback:', e);
    }

    // Fallback local caso backend esteja offline
    const usuarios = DataStore.getUsuarios();

    if (usuarios.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        exibirErro('Este nome de usuário já está em uso.');
        return;
    }

    if (usuarios.some(u => u.email.toLowerCase() === email)) {
        exibirErro('Este e-mail já está cadastrado.');
        return;
    }

    const novoId = Date.now();
    const novoUsuario = {
        id_usuario: novoId,
        nome: nome,
        username: username,
        email: email,
        senha_hash: senha,
        telefone: telefone,
        sexo: sexo,
        tipo_usuario: perfilSelect,
        ativo: true,
        criado_em: new Date().toISOString()
    };

    usuarios.push(novoUsuario);
    setTableData('USUARIOS', usuarios);

    if (perfilSelect === 'ALUNO') {
        const matriculas = DataStore.getMatriculas();
        matriculas.push({
            id_matricula: Date.now() + 1,
            id_aluno: novoId,
            id_turma: 1,
            id_ano_letivo: 1,
            data_matricula: new Date().toISOString().split('T')[0],
            status: 'CURSANDO'
        });
        setTableData('MATRICULAS', matriculas);
    }

    exibirSucesso('Cadastro realizado com sucesso! Redirecionando para o login...');

    setTimeout(function () {
        window.location.href = 'login.html';
    }, 1500);
}

document.addEventListener('DOMContentLoaded', function () {
    const formCad = document.getElementById('formCad');

    if (formCad) {
        formCad.addEventListener('submit', cadastrarUsuario);
    }
});
