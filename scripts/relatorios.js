/**
 * MindGrowth - relatorios.js
 * Módulo de Inteligência de Dados, Relatórios Analíticos e Dashboards com Chart.js
 */

let usuarioAtual = null;
let radarChartInstance = null;
let barChartInstance = null;
let evolutionChartInstance = null;

document.addEventListener('DOMContentLoaded', function () {
    // Autenticação (Professor ou Coordenador)
    usuarioAtual = requireAuth(['PROFESSOR', 'COORDENADOR', 'ALUNO']);
    if (!usuarioAtual) return;

    // Cabeçalho
    document.getElementById('nomeUsuarioRelatorio').textContent = usuarioAtual.nome;
    document.getElementById('perfilUsuarioRelatorio').textContent = usuarioAtual.tipo_usuario === 'COORDENADOR' ? 'Coordenação Pedagógica' : 'Corpo Docente';

    carregarFiltros();
    gerarRelatorios();

    // Event listeners de filtros
    document.getElementById('filtroTurma').addEventListener('change', gerarRelatorios);
    document.getElementById('filtroDisciplina').addEventListener('change', gerarRelatorios);
    document.getElementById('filtroPeriodo').addEventListener('change', gerarRelatorios);
    document.getElementById('btnImprimirRelatorio').addEventListener('click', () => window.print());
});

function carregarFiltros() {
    const selectTurma = document.getElementById('filtroTurma');
    const selectDisc = document.getElementById('filtroDisciplina');
    const selectPer = document.getElementById('filtroPeriodo');

    const turmas = DataStore.getTurmas();
    selectTurma.innerHTML = `<option value="todas">Todas as Turmas</option>` +
        turmas.map(t => `<option value="${t.id_turma}">${t.nome_turma}</option>`).join('');

    const disciplinas = DataStore.getDisciplinas().filter(d => d.ativo);
    selectDisc.innerHTML = `<option value="todas">Todas as Disciplinas</option>` +
        disciplinas.map(d => `<option value="${d.id_disciplina}">${d.nome}</option>`).join('');

    const periodos = DataStore.getPeriodos();
    selectPer.innerHTML = `<option value="todos">Todos os Períodos</option>` +
        periodos.map(p => `<option value="${p.id_periodo}">${p.nome}</option>`).join('');
}

function gerarRelatorios() {
    const idTurmaFiltro = document.getElementById('filtroTurma').value;
    const idDiscFiltro = document.getElementById('filtroDisciplina').value;
    const idPerFiltro = document.getElementById('filtroPeriodo').value;

    const matriculas = DataStore.getMatriculas();
    const todasAvaliacoes = DataStore.getAvaliacoes();
    const competencias = DataStore.getCompetencias().filter(c => c.ativo);
    const alunos = DataStore.getUsuarios().filter(u => u.tipo_usuario === 'ALUNO');
    const disciplinas = DataStore.getDisciplinas();
    const periodos = DataStore.getPeriodos();

    // Filtrar matrículas pela turma
    let matriculasFiltradas = matriculas;
    if (idTurmaFiltro !== 'todas') {
        matriculasFiltradas = matriculas.filter(m => Number(m.id_turma) === Number(idTurmaFiltro));
    }
    const idsMatriculaValidas = new Set(matriculasFiltradas.map(m => Number(m.id_matricula)));

    // Filtrar avaliações
    const avaliacoesFiltradas = todasAvaliacoes.filter(av => {
        const matchMat = idsMatriculaValidas.has(Number(av.id_matricula));
        const matchDisc = idDiscFiltro === 'todas' || Number(av.id_disciplina) === Number(idDiscFiltro);
        const matchPer = idPerFiltro === 'todos' || Number(av.id_periodo) === Number(idPerFiltro);
        return matchMat && matchDisc && matchPer;
    });

    // 1. Cálculos de KPIs Gerais
    const avsComNF = avaliacoesFiltradas.filter(a => a.nota_final !== null && a.nota_final !== undefined);
    const avsComAA = avaliacoesFiltradas.filter(a => a.nota_autoavaliacao !== null && a.nota_autoavaliacao !== undefined);
    const avsComAP = avaliacoesFiltradas.filter(a => a.nota_professor !== null && a.nota_professor !== undefined);

    const mediaGeralNF = avsComNF.length > 0
        ? (avsComNF.reduce((acc, a) => acc + Number(a.nota_final), 0) / avsComNF.length).toFixed(2)
        : '0.0';

    const mediaGeralAA = avsComAA.length > 0
        ? (avsComAA.reduce((acc, a) => acc + Number(a.nota_autoavaliacao), 0) / avsComAA.length).toFixed(2)
        : '0.0';

    const mediaGeralAP = avsComAP.length > 0
        ? (avsComAP.reduce((acc, a) => acc + Number(a.nota_professor), 0) / avsComAP.length).toFixed(2)
        : '0.0';

    document.getElementById('kpiMediaGeral').textContent = mediaGeralNF;
    document.getElementById('kpiMediaAA').textContent = mediaGeralAA;
    document.getElementById('kpiMediaAP').textContent = mediaGeralAP;
    document.getElementById('kpiTotalAvaliacoes').textContent = avaliacoesFiltradas.length;

    // 2. Análise por Competência (Médias de AA, AP e NF)
    const labelsComps = [];
    const mediasAA = [];
    const mediasAP = [];
    const mediasNF = [];

    let melhorComp = { nome: '-', media: -1 };
    let menorComp = { nome: '-', media: 999 };

    competencias.forEach(comp => {
        labelsComps.push(comp.nome);
        const avsComp = avaliacoesFiltradas.filter(a => Number(a.id_competencia) === Number(comp.id_competencia));

        const compAA = avsComp.filter(a => a.nota_autoavaliacao !== null && a.nota_autoavaliacao !== undefined);
        const mAA = compAA.length > 0 ? Number((compAA.reduce((acc, a) => acc + Number(a.nota_autoavaliacao), 0) / compAA.length).toFixed(2)) : 0;
        mediasAA.push(mAA);

        const compAP = avsComp.filter(a => a.nota_professor !== null && a.nota_professor !== undefined);
        const mAP = compAP.length > 0 ? Number((compAP.reduce((acc, a) => acc + Number(a.nota_professor), 0) / compAP.length).toFixed(2)) : 0;
        mediasAP.push(mAP);

        const compNF = avsComp.filter(a => a.nota_final !== null && a.nota_final !== undefined);
        const mNF = compNF.length > 0 ? Number((compNF.reduce((acc, a) => acc + Number(a.nota_final), 0) / compNF.length).toFixed(2)) : 0;
        mediasNF.push(mNF);

        if (mNF > 0 && mNF > melhorComp.media) melhorComp = { nome: comp.nome, media: mNF };
        if (mNF > 0 && mNF < menorComp.media) menorComp = { nome: comp.nome, media: mNF };
    });

    document.getElementById('kpiPontoForte').textContent = melhorComp.media > 0 ? `${melhorComp.nome} (${melhorComp.media.toFixed(1)})` : 'Em análise';
    document.getElementById('kpiPontoAtencao').textContent = menorComp.media < 900 ? `${menorComp.nome} (${menorComp.media.toFixed(1)})` : 'Em análise';

    // 3. Renderização dos Gráficos com Chart.js
    renderizarGraficos(labelsComps, mediasAA, mediasAP, mediasNF, periodos, todasAvaliacoes, idsMatriculaValidas);

    // 4. Renderização da Tabela Analítica
    renderizarTabelaConsolidada(matriculasFiltradas, alunos, competencias, avaliacoesFiltradas, disciplinas, periodos);
}

function renderizarGraficos(labels, dadosAA, dadosAP, dadosNF, periodos, todasAvaliacoes, idsMatriculaValidas) {
    if (typeof Chart === 'undefined') return;

    // A. Gráfico Radar Comparativo (Aluno vs Professor)
    const ctxRadar = document.getElementById('chartRadarGeral');
    if (ctxRadar) {
        if (radarChartInstance) radarChartInstance.destroy();
        radarChartInstance = new Chart(ctxRadar.getContext('2d'), {
            type: 'radar',
            data: {
                labels: labels.map(l => l.length > 18 ? l.substring(0, 18) + '...' : l),
                datasets: [
                    {
                        label: 'Autoavaliação Alunos (AA)',
                        data: dadosAA,
                        backgroundColor: 'rgba(91, 163, 217, 0.3)',
                        borderColor: '#1a4f8b',
                        borderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'Avaliação Professores (AP)',
                        data: dadosAP,
                        backgroundColor: 'rgba(46, 204, 113, 0.3)',
                        borderColor: '#27ae60',
                        borderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'Índice Consolidado (NFskill)',
                        data: dadosNF,
                        backgroundColor: 'rgba(243, 156, 18, 0.15)',
                        borderColor: '#e67e22',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        min: 0,
                        max: 5,
                        ticks: { stepSize: 1, backdropColor: 'transparent' },
                        pointLabels: { font: { size: 11, weight: '600' } }
                    }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // B. Gráfico de Barras (Ranking de Competências)
    const ctxBar = document.getElementById('chartBarGeral');
    if (ctxBar) {
        if (barChartInstance) barChartInstance.destroy();
        barChartInstance = new Chart(ctxBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels.map(l => l.length > 20 ? l.substring(0, 20) + '...' : l),
                datasets: [{
                    label: 'Média NFskill',
                    data: dadosNF,
                    backgroundColor: dadosNF.map(v => v >= 4 ? '#2ecc71' : (v >= 3 ? '#f39c12' : '#e74c3c')),
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 0, max: 5, ticks: { stepSize: 1 } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    // C. Gráfico de Linha (Evolução Temporal por Período)
    const ctxEvo = document.getElementById('chartEvolucaoPeriodos');
    if (ctxEvo) {
        if (evolutionChartInstance) evolutionChartInstance.destroy();

        const labelsPer = periodos.map(p => p.nome);
        const dadosEvoNF = periodos.map(p => {
            const avsP = todasAvaliacoes.filter(a => idsMatriculaValidas.has(Number(a.id_matricula)) && Number(a.id_periodo) === Number(p.id_periodo) && a.nota_final);
            return avsP.length > 0 ? (avsP.reduce((acc, a) => acc + Number(a.nota_final), 0) / avsP.length).toFixed(2) : null;
        });

        evolutionChartInstance = new Chart(ctxEvo.getContext('2d'), {
            type: 'line',
            data: {
                labels: labelsPer,
                datasets: [{
                    label: 'Evolução da Média Geral NFskill',
                    data: dadosEvoNF,
                    borderColor: '#1a4f8b',
                    backgroundColor: 'rgba(26, 79, 139, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { min: 1, max: 5, ticks: { stepSize: 1 } }
                },
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
}

function renderizarTabelaConsolidada(matriculas, usuarios, competencias, avaliacoes, disciplinas, periodos) {
    const tbody = document.getElementById('tabelaConsolidadaBody');
    if (!tbody) return;

    if (matriculas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum dado encontrado para os filtros selecionados.</td></tr>`;
        return;
    }

    tbody.innerHTML = matriculas.map(mat => {
        const aluno = usuarios.find(u => Number(u.id_usuario) === Number(mat.id_aluno));
        const avsMat = avaliacoes.filter(a => Number(a.id_matricula) === Number(mat.id_matricula));

        const avsComNF = avsMat.filter(a => a.nota_final !== null && a.nota_final !== undefined);
        const mediaAluno = avsComNF.length > 0
            ? (avsComNF.reduce((acc, a) => acc + Number(a.nota_final), 0) / avsComNF.length).toFixed(2)
            : '-';

        const classeBadge = mediaAluno !== '-' ? (Number(mediaAluno) >= 4 ? 'badge-sucesso' : (Number(mediaAluno) >= 3 ? 'badge-alerta' : 'badge-perigo')) : '';

        // Detalhes por competência
        const notasCompsHtml = competencias.map(comp => {
            const avComp = avsMat.find(a => Number(a.id_competencia) === Number(comp.id_competencia));
            const nf = avComp && avComp.nota_final ? Number(avComp.nota_final).toFixed(1) : '-';
            return `<span class="tag-nota" title="${comp.nome}: ${nf}">${comp.nome.substring(0, 4)}: <strong>${nf}</strong></span>`;
        }).join(' ');

        return `
            <tr>
                <td><strong>${aluno ? aluno.nome : 'Aluno'}</strong></td>
                <td>MAT-${String(mat.id_matricula).padStart(4, '0')}</td>
                <td>${avsMat.length} registro(s)</td>
                <td><div class="lista-mini-notas">${notasCompsHtml}</div></td>
                <td class="text-center">
                    ${mediaAluno !== '-' ? `<span class="badge ${classeBadge}"><strong>${mediaAluno}</strong></span>` : '<span class="text-muted">Pendente</span>'}
                </td>
            </tr>
        `;
    }).join('');
}
