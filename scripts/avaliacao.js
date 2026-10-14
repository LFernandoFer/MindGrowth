/**
 * MindGrowth - avaliacao.js
 * Tela de Avaliação das Competências com cálculo automatizado em tempo real de NFskill = (AA + AP) / 2
 */

let usuarioAtual = null;
let idMatricula = null;
let idTurma = null;
let idDisciplina = null;
let idPeriodo = null;
let dadosAluno = null;
let avaliacoesExistentes = [];

document.addEventListener('DOMContentLoaded', function () {
    usuarioAtual = requireAuth(['PROFESSOR', 'COORDENADOR']);
    if (!usuarioAtual) return;

    // Extrair parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    idMatricula = Number(params.get('matricula')) || 1;
    idTurma = Number(params.get('turma')) || 1;
    idDisciplina = Number(params.get('disciplina')) || 1;
    idPeriodo = Number(params.get('periodo')) || 1;

    carregarContexto();
    renderizarFormularioAvaliacao();

    document.getElementById('formAvaliacaoDocente').addEventListener('submit', salvarAvaliacao);
});

function carregarContexto() {
    const matriculas = DataStore.getMatriculas();
    const mat = matriculas.find(m => Number(m.id_matricula) === idMatricula);
    const usuarios = DataStore.getUsuarios();
    const turmas = DataStore.getTurmas();
    const disciplinas = DataStore.getDisciplinas();
    const periodos = DataStore.getPeriodos();

    if (mat) {
        const u = usuarios.find(usr => Number(usr.id_usuario) === Number(mat.id_aluno));
        dadosAluno = {
            id_matricula: mat.id_matricula,
            nome: u ? u.nome : 'Aluno',
            email: u ? u.email : ''
        };
    } else {
        dadosAluno = { id_matricula: 1, nome: 'Luís Fernando Ferreira Júnior', email: 'aluno@unifafibe.edu.br' };
    }

    const turmaObj = turmas.find(t => Number(t.id_turma) === idTurma);
    const discObj = disciplinas.find(d => Number(d.id_disciplina) === idDisciplina);
    const perObj = periodos.find(p => Number(p.id_periodo) === idPeriodo);

    document.getElementById('infoAlunoNome').textContent = dadosAluno.nome;
    document.getElementById('infoAlunoMatricula').textContent = 'MAT-' + String(dadosAluno.id_matricula).padStart(4, '0');
    document.getElementById('infoTurma').textContent = turmaObj ? turmaObj.nome_turma : 'Turma';
    document.getElementById('infoDisciplina').textContent = discObj ? discObj.nome : 'Disciplina';
    document.getElementById('infoPeriodo').textContent = perObj ? perObj.nome : 'Período';
    document.getElementById('infoProfessor').textContent = usuarioAtual.nome;

    avaliacoesExistentes = DataStore.getAvaliacoesRegistro(idMatricula, idDisciplina, idPeriodo);
}

function renderizarFormularioAvaliacao() {
    const container = document.getElementById('gradeAvaliacaoDocente');
    const competencias = DataStore.getCompetencias().filter(c => c.ativo);

    let obsGeral = '';

    container.innerHTML = competencias.map(comp => {
        const registro = avaliacoesExistentes.find(a => Number(a.id_competencia) === Number(comp.id_competencia));
        const notaAA = (registro && registro.nota_autoavaliacao !== null && registro.nota_autoavaliacao !== undefined)
            ? Number(registro.nota_autoavaliacao)
            : null;

        const notaAP = (registro && registro.nota_professor !== null && registro.nota_professor !== undefined)
            ? Number(registro.nota_professor)
            : null;

        if (registro && registro.observacao) {
            obsGeral = registro.observacao;
        }

        const notaAAHtml = notaAA !== null
            ? `<div class="valor-aa-destaque">${notaAA.toFixed(1)} <span class="sub-rotulo">(${getRotuloLikert(notaAA)})</span></div>`
            : `<div class="valor-aa-pendente">⚠️ Autoavaliação não respondida</div>`;

        return `
            <div class="card-avaliacao-item" data-comp-id="${comp.id_competencia}" data-aa="${notaAA !== null ? notaAA : ''}">
                <div class="avaliacao-item-topo">
                    <div>
                        <span class="competencia-categoria">${comp.categoria || 'Socioemocional'}</span>
                        <h3>${comp.nome}</h3>
                    </div>
                </div>
                <p class="competencia-desc">${comp.descricao}</p>

                <div class="painel-calculo-comparativo">
                    <!-- Coluna 1: Autoavaliação do Aluno -->
                    <div class="col-calc col-aa">
                        <label>Autoavaliação do Aluno (AA):</label>
                        ${notaAAHtml}
                    </div>

                    <!-- Coluna 2: Nota do Professor (AP) -->
                    <div class="col-calc col-ap">
                        <label>Sua Nota Docente (AP):</label>
                        <div class="likert-options-prof">
                            ${[1, 2, 3, 4, 5].map(val => `
                                <label class="likert-option-prof" title="Nota ${val}">
                                    <input type="radio" 
                                           name="ap_${comp.id_competencia}" 
                                           value="${val}" 
                                           ${notaAP === val ? 'checked' : ''} 
                                           onchange="recalcularLinha(${comp.id_competencia})">
                                    <span class="likert-btn-prof">${val}</span>
                                    <span class="likert-subtext-prof">${getRotuloLikert(val)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Coluna 3: Cálculo em Tempo Real do NFskill -->
                    <div class="col-calc col-nf">
                        <label>Índice Final (NFskill):</label>
                        <div class="box-nf-resultado" id="boxNf_${comp.id_competencia}">
                            <span class="nf-valor" id="valNf_${comp.id_competencia}">-</span>
                            <span class="nf-formula">NF = (AA + AP) / 2</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const campoObs = document.getElementById('observacoesGerais');
    if (campoObs && obsGeral) {
        campoObs.value = obsGeral;
    }

    // Calcular notas iniciais para todas as competências
    competencias.forEach(comp => {
        recalcularLinha(comp.id_competencia);
    });

    atualizarMediaGeral();
}

function getRotuloLikert(valor) {
    switch (Number(valor)) {
        case 1: return 'Muito Baixo';
        case 2: return 'Baixo';
        case 3: return 'Regular';
        case 4: return 'Bom';
        case 5: return 'Excelente';
        default: return '';
    }
}

function recalcularLinha(idCompetencia) {
    const card = document.querySelector(`.card-avaliacao-item[data-comp-id="${idCompetencia}"]`);
    if (!card) return;

    const rawAA = card.getAttribute('data-aa');
    const notaAA = rawAA !== '' ? Number(rawAA) : null;

    const radioAP = document.querySelector(`input[name="ap_${idCompetencia}"]:checked`);
    const notaAP = radioAP ? Number(radioAP.value) : null;

    const valEl = document.getElementById(`valNf_${idCompetencia}`);
    const boxEl = document.getElementById(`boxNf_${idCompetencia}`);

    if (notaAP !== null) {
        let nfCalculado;
        if (notaAA !== null) {
            // Fórmula do Artigo: NF_skill = (AA + AP) / 2
            nfCalculado = (notaAA + notaAP) / 2;
        } else {
            nfCalculado = notaAP; // Fallback se o aluno não fez AA
        }

        valEl.textContent = nfCalculado.toFixed(2);
        boxEl.className = 'box-nf-resultado ' + (nfCalculado >= 4 ? 'nf-alto' : (nfCalculado >= 3 ? 'nf-medio' : 'nf-baixo'));
    } else {
        valEl.textContent = '-';
        boxEl.className = 'box-nf-resultado';
    }

    atualizarMediaGeral();
}

function atualizarMediaGeral() {
    const competencias = DataStore.getCompetencias().filter(c => c.ativo);
    let soma = 0;
    let preenchidas = 0;

    competencias.forEach(comp => {
        const valEl = document.getElementById(`valNf_${comp.id_competencia}`);
        if (valEl && valEl.textContent !== '-') {
            soma += Number(valEl.textContent);
            preenchidas++;
        }
    });

    const mediaGeralEl = document.getElementById('mediaGeralCalculada');
    if (mediaGeralEl) {
        if (preenchidas > 0) {
            const mediaGeral = (soma / preenchidas).toFixed(2);
            mediaGeralEl.textContent = `${mediaGeral} (${preenchidas}/${competencias.length} competências)`;
        } else {
            mediaGeralEl.textContent = 'Aguardando atribuição das notas';
        }
    }
}

function salvarAvaliacao(event) {
    event.preventDefault();

    const competencias = DataStore.getCompetencias().filter(c => c.ativo);
    const notasAP = {};
    let algumaPreenchida = false;

    competencias.forEach(comp => {
        const radio = document.querySelector(`input[name="ap_${comp.id_competencia}"]:checked`);
        if (radio) {
            notasAP[comp.id_competencia] = Number(radio.value);
            algumaPreenchida = true;
        }
    });

    if (!algumaPreenchida) {
        alert('Por favor, selecione as notas do professor (AP) antes de salvar.');
        return;
    }

    const obs = document.getElementById('observacoesGerais').value.trim();

    DataStore.salvarAvaliacaoProfessor(
        idMatricula,
        idDisciplina,
        idPeriodo,
        usuarioAtual.id_usuario,
        notasAP,
        obs
    );

    const msg = document.getElementById('msgSucessoAvaliacao');
    msg.textContent = '🎉 Avaliação registrada com sucesso! NFskill calculado e consolidado.';
    msg.style.display = 'block';

    setTimeout(() => {
        window.location.href = 'professor.html';
    }, 1800);
}
