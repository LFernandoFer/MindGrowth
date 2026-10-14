/**
 * MindGrowth - aluno.js
 * Painel do Aluno, Formulário de Autoavaliação e Histórico
 */

let usuarioAtual = null;
let matriculaAtual = null;
let radarChartInstance = null;

document.addEventListener('DOMContentLoaded', function () {
    // Validação de autenticação
    usuarioAtual = requireAuth(['ALUNO']);
    if (!usuarioAtual) return;

    // Carregar dados da matrícula
    matriculaAtual = DataStore.getMatriculaAluno(usuarioAtual.id_usuario);

    // Atualizar cabeçalho do aluno
    document.getElementById('nomeAluno').textContent = usuarioAtual.nome;
    document.getElementById('emailAluno').textContent = usuarioAtual.email;
    
    if (matriculaAtual) {
        document.getElementById('turmaAluno').textContent = matriculaAtual.turma_nome + ' (' + matriculaAtual.ano_escolar_nome + ')';
        document.getElementById('matriculaNum').textContent = 'MAT-' + String(matriculaAtual.id_matricula).padStart(4, '0');
    } else {
        document.getElementById('turmaAluno').textContent = 'Não vinculada';
        document.getElementById('matriculaNum').textContent = 'Pendente';
    }

    // Preencher selects de disciplina e período
    carregarFiltros();

    // Renderizar formulário de competências
    renderizarCompetencias();

    // Carregar histórico e gráfico
    carregarHistoricoAluno();

    // Event listeners
    document.getElementById('formAutoavaliacao').addEventListener('submit', salvarAutoavaliacao);
    document.getElementById('selectDisciplina').addEventListener('change', atualizarValoresExistentes);
    document.getElementById('selectPeriodo').addEventListener('change', atualizarValoresExistentes);
});

function carregarFiltros() {
    const selectDisc = document.getElementById('selectDisciplina');
    const selectPer = document.getElementById('selectPeriodo');

    const disciplinas = DataStore.getDisciplinas().filter(d => d.ativo);
    selectDisc.innerHTML = disciplinas.map(d => `<option value="${d.id_disciplina}">${d.nome}</option>`).join('');

    const periodos = DataStore.getPeriodos();
    selectPer.innerHTML = periodos.map(p => `<option value="${p.id_periodo}">${p.nome}</option>`).join('');
}

function renderizarCompetencias() {
    const container = document.getElementById('containerCompetencias');
    const competencias = DataStore.getCompetencias().filter(c => c.ativo);

    container.innerHTML = competencias.map((comp) => {
        return `
            <div class="card-competencia" data-id="${comp.id_competencia}">
                <div class="competencia-header">
                    <span class="competencia-categoria">${comp.categoria || 'Geral'}</span>
                    <h3 class="competencia-titulo">${comp.nome}</h3>
                </div>
                <p class="competencia-desc">${comp.descricao}</p>

                <div class="likert-group">
                    <span class="likert-label">Sua Autoavaliação (1 a 5):</span>
                    <div class="likert-options">
                        ${[1, 2, 3, 4, 5].map(val => `
                            <label class="likert-option" title="Nota ${val}">
                                <input type="radio" name="comp_${comp.id_competencia}" value="${val}" required>
                                <span class="likert-btn">${val}</span>
                                <span class="likert-subtext">${getRotuloLikert(val)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    atualizarValoresExistentes();
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

function atualizarValoresExistentes() {
    if (!matriculaAtual) return;

    const idDisc = Number(document.getElementById('selectDisciplina').value);
    const idPer = Number(document.getElementById('selectPeriodo').value);

    const avaliacoes = DataStore.getAvaliacoesRegistro(matriculaAtual.id_matricula, idDisc, idPer);
    const competencias = DataStore.getCompetencias();

    competencias.forEach(comp => {
        const radios = document.querySelectorAll(`input[name="comp_${comp.id_competencia}"]`);
        const registro = avaliacoes.find(a => Number(a.id_competencia) === Number(comp.id_competencia));

        radios.forEach(r => {
            if (registro && registro.nota_autoavaliacao && Number(r.value) === Number(registro.nota_autoavaliacao)) {
                r.checked = true;
            } else if (!registro || !registro.nota_autoavaliacao) {
                r.checked = false;
            }
        });
    });

    const statusBanner = document.getElementById('statusPreenchimento');
    if (avaliacoes.length > 0 && avaliacoes.some(a => a.nota_autoavaliacao !== null)) {
        statusBanner.innerHTML = `<span class="badge badge-info">ℹ️ Você já enviou respostas para esta disciplina/período. Enviar novamente atualizará sua autoavaliação.</span>`;
    } else {
        statusBanner.innerHTML = '';
    }
}

function salvarAutoavaliacao(event) {
    event.preventDefault();

    if (!matriculaAtual) {
        alert('Você precisa estar matriculado em uma turma para registrar autoavaliações.');
        return;
    }

    const idDisc = Number(document.getElementById('selectDisciplina').value);
    const idPer = Number(document.getElementById('selectPeriodo').value);
    const competencias = DataStore.getCompetencias();

    const notas = {};
    let todasPreenchidas = true;

    competencias.forEach(comp => {
        const selecionado = document.querySelector(`input[name="comp_${comp.id_competencia}"]:checked`);
        if (selecionado) {
            notas[comp.id_competencia] = Number(selecionado.value);
        } else {
            todasPreenchidas = false;
        }
    });

    if (!todasPreenchidas) {
        alert('Por favor, avalie todas as competências de 1 a 5 antes de enviar.');
        return;
    }

    DataStore.salvarAutoavaliacaoAluno(matriculaAtual.id_matricula, idDisc, idPer, notas);

    const msg = document.getElementById('msgSucesso');
    msg.textContent = '✅ Autoavaliação salva com sucesso!';
    msg.style.display = 'block';

    setTimeout(() => {
        msg.style.display = 'none';
    }, 4000);

    carregarHistoricoAluno();
}

function carregarHistoricoAluno() {
    if (!matriculaAtual) return;

    const avaliacoes = DataStore.getAvaliacoes().filter(a => Number(a.id_matricula) === Number(matriculaAtual.id_matricula));
    const disciplinas = DataStore.getDisciplinas();
    const periodos = DataStore.getPeriodos();
    const competencias = DataStore.getCompetencias();
    const professores = DataStore.getUsuarios();

    const tbody = document.getElementById('tabelaHistoricoBody');
    if (!tbody) return;

    if (avaliacoes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center">Nenhuma avaliação registrada até o momento.</td></tr>`;
        renderizarGraficoRadar([], []);
        return;
    }

    tbody.innerHTML = avaliacoes.map(av => {
        const disc = disciplinas.find(d => Number(d.id_disciplina) === Number(av.id_disciplina));
        const per = periodos.find(p => Number(p.id_periodo) === Number(av.id_periodo));
        const comp = competencias.find(c => Number(c.id_competencia) === Number(av.id_competencia));
        const prof = professores.find(u => Number(u.id_usuario) === Number(av.id_professor));

        const notaAA = av.nota_autoavaliacao !== null && av.nota_autoavaliacao !== undefined ? Number(av.nota_autoavaliacao).toFixed(1) : '-';
        const notaAP = av.nota_professor !== null && av.nota_professor !== undefined ? Number(av.nota_professor).toFixed(1) : '<span class="badge badge-pendente">Aguardando Docente</span>';
        
        let notaFinalHtml = '-';
        if (av.nota_final !== null && av.nota_final !== undefined) {
            const nf = Number(av.nota_final);
            const classeBadge = nf >= 4 ? 'badge-sucesso' : (nf >= 3 ? 'badge-alerta' : 'badge-perigo');
            notaFinalHtml = `<span class="badge ${classeBadge}"><strong>${nf.toFixed(2)}</strong></span>`;
        }

        return `
            <tr>
                <td><strong>${comp ? comp.nome : 'Competência'}</strong></td>
                <td>${disc ? disc.nome : '-'}</td>
                <td>${per ? per.nome : '-'}</td>
                <td class="text-center"><strong>${notaAA}</strong></td>
                <td class="text-center">${notaAP}</td>
                <td class="text-center">${notaFinalHtml}</td>
                <td>${av.observacao ? `<em>"${av.observacao}"</em>` : '<span class="text-muted">Sem observações</span>'}</td>
            </tr>
        `;
    }).join('');

    // Preparar dados para o gráfico radar (média das competências do aluno)
    const labels = [];
    const dadosAA = [];
    const dadosAP = [];

    competencias.forEach(comp => {
        labels.push(comp.nome.split(' ')[0] + ' ' + (comp.nome.split(' ')[1] || ''));
        const avsComp = avaliacoes.filter(a => Number(a.id_competencia) === Number(comp.id_competencia));

        const somaAA = avsComp.reduce((acc, a) => acc + (a.nota_autoavaliacao ? Number(a.nota_autoavaliacao) : 0), 0);
        const countAA = avsComp.filter(a => a.nota_autoavaliacao !== null && a.nota_autoavaliacao !== undefined).length;
        dadosAA.push(countAA > 0 ? (somaAA / countAA).toFixed(2) : 0);

        const somaAP = avsComp.reduce((acc, a) => acc + (a.nota_professor ? Number(a.nota_professor) : 0), 0);
        const countAP = avsComp.filter(a => a.nota_professor !== null && a.nota_professor !== undefined).length;
        dadosAP.push(countAP > 0 ? (somaAP / countAP).toFixed(2) : 0);
    });

    renderizarGraficoRadar(labels, dadosAA, dadosAP);
}

function renderizarGraficoRadar(labels, dadosAA, dadosAP = []) {
    const canvas = document.getElementById('chartRadarAluno');
    if (!canvas || typeof Chart === 'undefined') return;

    if (radarChartInstance) {
        radarChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Minha Autoavaliação (AA)',
                    data: dadosAA,
                    backgroundColor: 'rgba(91, 163, 217, 0.25)',
                    borderColor: '#1a4f8b',
                    borderWidth: 2,
                    pointBackgroundColor: '#1a4f8b',
                    pointRadius: 4
                },
                {
                    label: 'Avaliação do Professor (AP)',
                    data: dadosAP,
                    backgroundColor: 'rgba(46, 204, 113, 0.25)',
                    borderColor: '#27ae60',
                    borderWidth: 2,
                    pointBackgroundColor: '#27ae60',
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
                    ticks: {
                        stepSize: 1,
                        backdropColor: 'transparent'
                    },
                    pointLabels: {
                        font: {
                            size: 11,
                            weight: '600'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}
