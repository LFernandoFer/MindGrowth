/**
 * MindGrowth - professor.js
 * Painel de Gestão e Avaliação da Turma pelo Docente
 */

let usuarioAtual = null;
let turmasProfessor = [];

document.addEventListener('DOMContentLoaded', function () {
    // Autenticação
    usuarioAtual = requireAuth(['PROFESSOR', 'COORDENADOR']);
    if (!usuarioAtual) return;

    // Atualizar cabeçalho do professor
    document.getElementById('nomeProfessor').textContent = usuarioAtual.nome;
    document.getElementById('emailProfessor').textContent = usuarioAtual.email;

    // Carregar turmas e disciplinas vinculadas
    turmasProfessor = DataStore.getTurmasDoProfessor(usuarioAtual.id_usuario);
    
    // Se não tiver turmas específicas cadastradas (ou for coordenador), carrega todas para demonstração
    if (turmasProfessor.length === 0) {
        const todasTurmas = DataStore.getTurmas();
        const todasDiscs = DataStore.getDisciplinas();
        turmasProfessor = todasTurmas.map(t => ({
            id_turma: t.id_turma,
            nome_turma: t.nome_turma,
            id_disciplina: todasDiscs[0].id_disciplina,
            nome_disciplina: todasDiscs[0].nome
        }));
    }

    carregarFiltros();
    atualizarPainelTurma();

    // Event listeners
    document.getElementById('selectTurma').addEventListener('change', atualizarDisciplinasPorTurma);
    document.getElementById('selectDisciplina').addEventListener('change', atualizarPainelTurma);
    document.getElementById('selectPeriodo').addEventListener('change', atualizarPainelTurma);
    document.getElementById('btnIniciarEtapa').addEventListener('click', iniciarEtapaAvaliacao);
});

function carregarFiltros() {
    const selectTurma = document.getElementById('selectTurma');
    const selectPeriodo = document.getElementById('selectPeriodo');

    // Turmas únicas
    const turmasUnicas = [];
    const idsVistos = new Set();
    turmasProfessor.forEach(item => {
        if (!idsVistos.has(item.id_turma)) {
            idsVistos.add(item.id_turma);
            turmasUnicas.push(item);
        }
    });

    selectTurma.innerHTML = turmasUnicas.map(t => `<option value="${t.id_turma}">${t.nome_turma}</option>`).join('');

    // Períodos
    const periodos = DataStore.getPeriodos();
    selectPeriodo.innerHTML = periodos.map(p => `<option value="${p.id_periodo}">${p.nome}</option>`).join('');

    atualizarDisciplinasPorTurma();
}

function atualizarDisciplinasPorTurma() {
    const selectTurma = document.getElementById('selectTurma');
    const selectDisciplina = document.getElementById('selectDisciplina');
    const idTurmaSelecionada = Number(selectTurma.value);

    const discsDaTurma = turmasProfessor.filter(item => Number(item.id_turma) === idTurmaSelecionada);
    
    if (discsDaTurma.length > 0) {
        selectDisciplina.innerHTML = discsDaTurma.map(d => `<option value="${d.id_disciplina}">${d.nome_disciplina}</option>`).join('');
    } else {
        const todasDiscs = DataStore.getDisciplinas().filter(d => d.ativo);
        selectDisciplina.innerHTML = todasDiscs.map(d => `<option value="${d.id_disciplina}">${d.nome}</option>`).join('');
    }

    atualizarPainelTurma();
}

function atualizarPainelTurma() {
    const idTurma = Number(document.getElementById('selectTurma').value);
    const idDisciplina = Number(document.getElementById('selectDisciplina').value);
    const idPeriodo = Number(document.getElementById('selectPeriodo').value);

    const alunos = DataStore.getAlunosPorTurma(idTurma);
    const avaliacoes = DataStore.getAvaliacoes();
    const competencias = DataStore.getCompetencias();
    const totalComps = competencias.length;

    let countAAConcluidas = 0;
    let countAPConcluidas = 0;
    let somaNotasFinais = 0;
    let countNotasFinais = 0;

    const tbody = document.getElementById('tabelaAlunosTurmaBody');

    if (alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum aluno matriculado nesta turma.</td></tr>`;
        atualizarKPIs(0, 0, 0, 0);
        return;
    }

    tbody.innerHTML = alunos.map(aluno => {
        const avsAluno = avaliacoes.filter(a =>
            Number(a.id_matricula) === Number(aluno.id_matricula) &&
            Number(a.id_disciplina) === Number(idDisciplina) &&
            Number(a.id_periodo) === Number(idPeriodo)
        );

        // Status AA
        const compsComAA = avsAluno.filter(a => a.nota_autoavaliacao !== null && a.nota_autoavaliacao !== undefined);
        let statusAAHtml = '';
        let mediaAA = 0;
        if (compsComAA.length >= totalComps) {
            mediaAA = (compsComAA.reduce((acc, a) => acc + Number(a.nota_autoavaliacao), 0) / compsComAA.length).toFixed(1);
            statusAAHtml = `<span class="badge badge-sucesso">✅ Concluída (${mediaAA})</span>`;
            countAAConcluidas++;
        } else if (compsComAA.length > 0) {
            statusAAHtml = `<span class="badge badge-alerta">⏳ Parcial (${compsComAA.length}/${totalComps})</span>`;
        } else {
            statusAAHtml = `<span class="badge badge-pendente">⚠️ Pendente</span>`;
        }

        // Status AP
        const compsComAP = avsAluno.filter(a => a.nota_professor !== null && a.nota_professor !== undefined);
        let statusAPHtml = '';
        let mediaAP = 0;
        if (compsComAP.length >= totalComps) {
            mediaAP = (compsComAP.reduce((acc, a) => acc + Number(a.nota_professor), 0) / compsComAP.length).toFixed(1);
            statusAPHtml = `<span class="badge badge-sucesso">✅ Avaliado (${mediaAP})</span>`;
            countAPConcluidas++;
        } else if (compsComAP.length > 0) {
            statusAPHtml = `<span class="badge badge-alerta">⏳ Em andamento (${compsComAP.length}/${totalComps})</span>`;
        } else {
            statusAPHtml = `<span class="badge badge-pendente">⚠️ Pendente</span>`;
        }

        // Nota Final média
        const compsComNF = avsAluno.filter(a => a.nota_final !== null && a.nota_final !== undefined);
        let notaFinalHtml = '-';
        if (compsComNF.length > 0) {
            const mediaNF = Number((compsComNF.reduce((acc, a) => acc + Number(a.nota_final), 0) / compsComNF.length).toFixed(2));
            somaNotasFinais += mediaNF;
            countNotasFinais++;
            const cor = mediaNF >= 4.0 ? 'badge-sucesso' : (mediaNF >= 3.0 ? 'badge-alerta' : 'badge-perigo');
            notaFinalHtml = `<span class="badge ${cor}"><strong>${mediaNF.toFixed(2)}</strong></span>`;
        }

        return `
            <tr>
                <td><strong>${aluno.nome}</strong></td>
                <td>MAT-${String(aluno.id_matricula).padStart(4, '0')}</td>
                <td class="text-center">${statusAAHtml}</td>
                <td class="text-center">${statusAPHtml}</td>
                <td class="text-center">${notaFinalHtml}</td>
                <td class="acoes-col">
                    <button type="button" class="btn btn-sm btn-primario" onclick="irParaAvaliacao(${aluno.id_matricula}, ${idTurma}, ${idDisciplina}, ${idPeriodo})">
                        ✍️ Avaliar
                    </button>
                    <button type="button" class="btn btn-sm btn-excluir" title="Excluir/Resetar avaliação" onclick="confirmarExclusao(${aluno.id_matricula}, ${idDisciplina}, ${idPeriodo}, '${aluno.nome}')">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    const mediaGeralTurma = countNotasFinais > 0 ? (somaNotasFinais / countNotasFinais).toFixed(2) : '0.0';
    const pendenciasProf = alunos.length - countAPConcluidas;

    atualizarKPIs(alunos.length, countAAConcluidas, pendenciasProf, mediaGeralTurma);
}

function atualizarKPIs(total, aaConcluidas, apPendentes, media) {
    document.getElementById('kpiTotalAlunos').textContent = total;
    document.getElementById('kpiAAConcluidas').textContent = aaConcluidas;
    document.getElementById('kpiAPPendentes').textContent = apPendentes;
    document.getElementById('kpiMediaTurma').textContent = media;
}

function irParaAvaliacao(idMatricula, idTurma, idDisciplina, idPeriodo) {
    window.location.href = `avaliacao.html?matricula=${idMatricula}&turma=${idTurma}&disciplina=${idDisciplina}&periodo=${idPeriodo}`;
}

function iniciarEtapaAvaliacao() {
    const idTurma = Number(document.getElementById('selectTurma').value);
    const idDisciplina = Number(document.getElementById('selectDisciplina').value);
    const idPeriodo = Number(document.getElementById('selectPeriodo').value);

    const criados = DataStore.inicializarEtapaAvaliacao(idTurma, idDisciplina, idPeriodo, usuarioAtual.id_usuario);
    alert(`Ciclo de avaliação aberto! ${criados} registros inicializados para preenchimento.`);
    atualizarPainelTurma();
}

function confirmarExclusao(idMatricula, idDisciplina, idPeriodo, nomeAluno) {
    if (confirm(`Deseja realmente resetar/excluir as avaliações de ${nomeAluno} para este período e disciplina?`)) {
        DataStore.excluirAvaliacaoEtapa(idMatricula, idDisciplina, idPeriodo);
        alert('Registros da etapa excluídos com sucesso.');
        atualizarPainelTurma();
    }
}
