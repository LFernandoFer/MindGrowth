 /**
 * MindGrowth - dataStore.js
 * Camada de gerenciamento de dados e persistência (compatível com Banco de Dados v2.0)
 * Integrado ao Back-end Node.js e MySQL (XAMPP/phpMyAdmin)
 */

const MG_STORAGE_PREFIX = 'mindgrowth_';

// URL base da API Node.js
const API_BASE = window.location.protocol.startsWith('http') ? '' : 'http://localhost:3000';

// Chaves de armazenamento local (cache / fallback)
const KEYS = {
    USUARIOS: MG_STORAGE_PREFIX + 'usuarios',
    NIVEIS_ENSINO: MG_STORAGE_PREFIX + 'niveis_ensino',
    ANOS_ESCOLARES: MG_STORAGE_PREFIX + 'anos_escolares',
    ANOS_LETIVOS: MG_STORAGE_PREFIX + 'anos_letivos',
    TURMAS: MG_STORAGE_PREFIX + 'turmas',
    MATRICULAS: MG_STORAGE_PREFIX + 'matriculas',
    DISCIPLINAS: MG_STORAGE_PREFIX + 'disciplinas',
    PROFESSOR_TURMA_DISCIPLINA: MG_STORAGE_PREFIX + 'ptd',
    PERIODOS_AVALIATIVOS: MG_STORAGE_PREFIX + 'periodos',
    COMPETENCIAS: MG_STORAGE_PREFIX + 'competencias',
    AVALIACOES: MG_STORAGE_PREFIX + 'avaliacoes',
    SOLICITACOES_PROFESSOR: MG_STORAGE_PREFIX + 'solicitacoes',
    AUTH_USER: MG_STORAGE_PREFIX + 'auth_user'
};

// Dados Iniciais / Seed com nomes genéricos (alinhados ao mindgrowth.sql)
const SEED_DATA = {
    niveis_ensino: [
        { id_nivel: 1, nome: 'Ensino Fundamental' },
        { id_nivel: 2, nome: 'Ensino Médio' }
    ],
    anos_letivos: [
        { id_ano_letivo: 1, ano: 2026, ativo: true }
    ],
    anos_escolares: [
        { id_ano_escolar: 1, id_nivel: 1, descricao: '6º Ano', ordem_exibicao: 1 },
        { id_ano_escolar: 2, id_nivel: 1, descricao: '7º Ano', ordem_exibicao: 2 },
        { id_ano_escolar: 3, id_nivel: 1, descricao: '8º Ano', ordem_exibicao: 3 },
        { id_ano_escolar: 4, id_nivel: 1, descricao: '9º Ano', ordem_exibicao: 4 },
        { id_ano_escolar: 5, id_nivel: 2, descricao: '1º Ano EM', ordem_exibicao: 10 },
        { id_ano_escolar: 6, id_nivel: 2, descricao: '2º Ano EM', ordem_exibicao: 11 },
        { id_ano_escolar: 7, id_nivel: 2, descricao: '3º Ano EM', ordem_exibicao: 12 }
    ],
    turmas: [
        { id_turma: 1, id_ano_escolar: 4, id_ano_letivo: 1, nome_turma: '9º Ano A', periodo: 'MANHA' },
        { id_turma: 2, id_ano_escolar: 5, id_ano_letivo: 1, nome_turma: '1º Ano EM A', periodo: 'MANHA' },
        { id_turma: 3, id_ano_escolar: 7, id_ano_letivo: 1, nome_turma: '3º Ano EM A', periodo: 'MANHA' }
    ],
    disciplinas: [
        { id_disciplina: 1, nome: 'Língua Portuguesa', descricao: 'Comunicação, leitura e expressão textual', ativo: true },
        { id_disciplina: 2, nome: 'Matemática', descricao: 'Raciocínio lógico e resolução de problemas', ativo: true },
        { id_disciplina: 3, nome: 'Ciências / Biologia', descricao: 'Investigação científica e pensamento crítico', ativo: true },
        { id_disciplina: 4, nome: 'História e Sociedade', descricao: 'Cidadania, empatia e contexto social', ativo: true },
        { id_disciplina: 5, nome: 'Projeto de Vida', descricao: 'Autoconhecimento e planejamento socioemocional', ativo: true }
    ],
    periodos_avaliativos: [
        { id_periodo: 1, id_ano_letivo: 1, nome: '1º Bimestre', ordem_periodo: 1, data_inicio: '2026-02-01', data_fim: '2026-04-30' },
        { id_periodo: 2, id_ano_letivo: 1, nome: '2º Bimestre', ordem_periodo: 2, data_inicio: '2026-05-01', data_fim: '2026-07-15' },
        { id_periodo: 3, id_ano_letivo: 1, nome: '3º Bimestre', ordem_periodo: 3, data_inicio: '2026-08-01', data_fim: '2026-09-30' },
        { id_periodo: 4, id_ano_letivo: 1, nome: '4º Bimestre', ordem_periodo: 4, data_inicio: '2026-10-01', data_fim: '2026-12-15' }
    ],
    competencias: [
        {
            id_competencia: 1,
            nome: 'Responsabilidade',
            categoria: 'Autogestão',
            descricao: 'Capacidade de cumprir prazos, gerenciar compromissos e demonstrar pontualidade e dedicação às atividades.',
            ativo: true
        },
        {
            id_competencia: 2,
            nome: 'Trabalho em Equipe & Relações Interpessoais',
            categoria: 'Habilidades Sociais',
            descricao: 'Habilidade de colaborar de forma respeitosa, ouvir os colegas e construir soluções coletivas.',
            ativo: true
        },
        {
            id_competencia: 3,
            nome: 'Pensamento Crítico & Senso Crítico',
            categoria: 'Cognitivo-Comportamental',
            descricao: 'Capacidade de analisar informações, questionar com fundamentos lógicos e propor argumentos construtivos.',
            ativo: true
        },
        {
            id_competencia: 4,
            nome: 'Comunicação Assertiva',
            categoria: 'Expressão',
            descricao: 'Habilidade de expressar ideias com clareza, respeito e empatia, tanto oralmente quanto por escrito.',
            ativo: true
        },
        {
            id_competencia: 5,
            nome: 'Inteligência Emocional & Empatia',
            categoria: 'Socioemocional',
            descricao: 'Autoconsciência sobre as próprias emoções, autocontrole e sensibilidade para compreender o ponto de vista alheio.',
            ativo: true
        },
        {
            id_competencia: 6,
            nome: 'Adaptabilidade & Resolução de Problemas',
            categoria: 'Resiliência',
            descricao: 'Flexibilidade diante de mudanças, busca criativa de alternativas e persistência frente a novos desafios.',
            ativo: true
        }
    ],
    usuarios: [
        {
            id_usuario: 1,
            nome: 'Lucas Silva',
            username: 'aluno.demo',
            email: 'lucas.silva@escola.edu.br',
            senha_hash: '123456',
            telefone: '(17) 99111-1111',
            tipo_usuario: 'ALUNO',
            ativo: true
        },
        {
            id_usuario: 2,
            nome: 'Mariana Oliveira',
            username: 'mariana.aluna',
            email: 'mariana.oliveira@escola.edu.br',
            senha_hash: '123456',
            telefone: '(17) 99222-2222',
            tipo_usuario: 'ALUNO',
            ativo: true
        },
        {
            id_usuario: 3,
            nome: 'Prof. Carlos Eduardo Santos',
            username: 'prof.carlos',
            email: 'carlos.santos@prof.escola.edu.br',
            senha_hash: '123456',
            telefone: '(17) 99333-3333',
            tipo_usuario: 'PROFESSOR',
            ativo: true
        },
        {
            id_usuario: 4,
            nome: 'Coord. Helena Vasconcelos',
            username: 'coord.helena',
            email: 'coordenacao@escola.edu.br',
            senha_hash: '123456',
            telefone: '(17) 99444-4444',
            tipo_usuario: 'COORDENADOR',
            ativo: true
        },
        {
            id_usuario: 5,
            nome: 'Gabriel Ferreira',
            username: 'gabriel.aluno',
            email: 'gabriel.aluno@escola.edu.br',
            senha_hash: '123456',
            telefone: '(17) 99555-5555',
            tipo_usuario: 'ALUNO',
            ativo: true
        }
    ],
    matriculas: [
        { id_matricula: 1, id_aluno: 1, id_turma: 1, id_ano_letivo: 1, data_matricula: '2026-02-01', status: 'CURSANDO' },
        { id_matricula: 2, id_aluno: 2, id_turma: 1, id_ano_letivo: 1, data_matricula: '2026-02-01', status: 'CURSANDO' },
        { id_matricula: 3, id_aluno: 5, id_turma: 1, id_ano_letivo: 1, data_matricula: '2026-02-01', status: 'CURSANDO' }
    ],
    professor_turma_disciplina: [
        { id_relacao: 1, id_professor: 3, id_turma: 1, id_disciplina: 1 },
        { id_relacao: 2, id_professor: 3, id_turma: 1, id_disciplina: 5 },
        { id_relacao: 3, id_professor: 3, id_turma: 2, id_disciplina: 1 }
    ],
    avaliacoes: [
        {
            id_avaliacao: 1,
            id_matricula: 1,
            id_competencia: 1,
            id_disciplina: 1,
            id_periodo: 1,
            id_professor: 3,
            nota_autoavaliacao: 4.0,
            nota_professor: 5.0,
            nota_final: 4.5,
            observacao: 'Excelente pontualidade na entrega dos trabalhos e compromisso.',
            data_avaliacao: '2026-03-20T10:30:00'
        },
        {
            id_avaliacao: 2,
            id_matricula: 1,
            id_competencia: 2,
            id_disciplina: 1,
            id_periodo: 1,
            id_professor: 3,
            nota_autoavaliacao: 4.0,
            nota_professor: 4.0,
            nota_final: 4.0,
            observacao: 'Boa cooperação nas atividades em equipe.',
            data_avaliacao: '2026-03-20T10:30:00'
        },
        {
            id_avaliacao: 3,
            id_matricula: 1,
            id_competencia: 3,
            id_disciplina: 1,
            id_periodo: 1,
            id_professor: 3,
            nota_autoavaliacao: 5.0,
            nota_professor: 4.0,
            nota_final: 4.5,
            observacao: 'Ótima capacidade crítica e argumentativa nos debates.',
            data_avaliacao: '2026-03-20T10:30:00'
        },
        {
            id_avaliacao: 4,
            id_matricula: 1,
            id_competencia: 4,
            id_disciplina: 1,
            id_periodo: 1,
            id_professor: 3,
            nota_autoavaliacao: 4.0,
            nota_professor: 4.0,
            nota_final: 4.0,
            observacao: 'Boa clareza nas redações e exposições orais.',
            data_avaliacao: '2026-03-20T10:30:00'
        },
        {
            id_avaliacao: 5,
            id_matricula: 1,
            id_competencia: 5,
            id_disciplina: 1,
            id_periodo: 1,
            id_professor: 3,
            nota_autoavaliacao: 3.0,
            nota_professor: 4.0,
            nota_final: 3.5,
            observacao: 'Demonstrou evolução contínua no autocontrole durante avaliações.',
            data_avaliacao: '2026-03-20T10:30:00'
        },
        {
            id_avaliacao: 6,
            id_matricula: 1,
            id_competencia: 6,
            id_disciplina: 1,
            id_periodo: 1,
            id_professor: 3,
            nota_autoavaliacao: 4.0,
            nota_professor: 4.0,
            nota_final: 4.0,
            observacao: 'Boa postura diante de novas atividades pedagógicas.',
            data_avaliacao: '2026-03-20T10:30:00'
        }
    ]
};

// Sincronização em tempo real com o Backend MySQL
let isDbConnected = false;

async function syncWithBackend() {
    try {
        const res = await fetch(`${API_BASE}/api/dados`, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) return false;
        const data = await res.json();
        if (data && data.success) {
            if (data.usuarios) setTableData('USUARIOS', data.usuarios);
            if (data.turmas) setTableData('TURMAS', data.turmas);
            if (data.disciplinas) setTableData('DISCIPLINAS', data.disciplinas);
            if (data.competencias) setTableData('COMPETENCIAS', data.competencias);
            if (data.periodos) setTableData('PERIODOS_AVALIATIVOS', data.periodos);
            if (data.matriculas) setTableData('MATRICULAS', data.matriculas);
            if (data.ptd) setTableData('PROFESSOR_TURMA_DISCIPLINA', data.ptd);
            if (data.avaliacoes) setTableData('AVALIACOES', data.avaliacoes);
            if (data.anos_escolares) setTableData('ANOS_ESCOLARES', data.anos_escolares);
            if (data.anos_letivos) setTableData('ANOS_LETIVOS', data.anos_letivos);
            if (data.niveis_ensino) setTableData('NIVEIS_ENSINO', data.niveis_ensino);
            isDbConnected = true;
            atualizarBadgeConexao(true);
            return true;
        }
    } catch (e) {
        // Backend ou MySQL offline, utiliza cache local
        isDbConnected = false;
        atualizarBadgeConexao(false);
    }
    return false;
}

// Indicador visual de conexão com o banco
function atualizarBadgeConexao(conectado) {
    let badge = document.getElementById('mg-db-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'mg-db-badge';
        badge.style.cssText = `
            position: fixed;
            bottom: 12px;
            right: 12px;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 6px;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
        `;
        document.body.appendChild(badge);
    }

    if (conectado) {
        badge.style.background = '#d4edda';
        badge.style.color = '#155724';
        badge.style.border = '1px solid #c3e6cb';
        badge.innerHTML = '🟢 Conectado ao MySQL (XAMPP / Node)';
    } else {
        badge.style.background = '#fff3cd';
        badge.style.color = '#856404';
        badge.style.border = '1px solid #ffeeba';
        badge.innerHTML = '🟡 Modo Local (Cache)';
    }
}

// Inicializador do banco local / cache
function initDataStore() {
    for (const key in SEED_DATA) {
        const storageKey = KEYS[key.toUpperCase()];
        if (storageKey && !localStorage.getItem(storageKey)) {
            localStorage.setItem(storageKey, JSON.stringify(SEED_DATA[key]));
        }
    }
}

// Helpers Genéricos
function getTableData(keyName) {
    initDataStore();
    try {
        const data = localStorage.getItem(KEYS[keyName.toUpperCase()]);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error('Erro ao ler tabela: ' + keyName, e);
        return [];
    }
}

function setTableData(keyName, data) {
    try {
        localStorage.setItem(KEYS[keyName.toUpperCase()], JSON.stringify(data));
    } catch (e) {
        console.error('Erro ao gravar tabela: ' + keyName, e);
    }
}

// Autenticação & Sessão
function getAuthUser() {
    try {
        const user = sessionStorage.getItem(KEYS.AUTH_USER);
        return user ? JSON.parse(user) : null;
    } catch (e) {
        return null;
    }
}

function setAuthUser(user) {
    sessionStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user));
}

function logout() {
    sessionStorage.removeItem(KEYS.AUTH_USER);
    window.location.href = 'login.html';
}

function requireAuth(allowedRoles = []) {
    const user = getAuthUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.tipo_usuario)) {
        if (user.tipo_usuario === 'ALUNO') window.location.href = 'aluno.html';
        else if (user.tipo_usuario === 'PROFESSOR') window.location.href = 'professor.html';
        else if (user.tipo_usuario === 'COORDENADOR') window.location.href = 'relatorios.html';
        return null;
    }
    return user;
}

// Consultas e Mutações de Negócio
const DataStore = {
    init: function () {
        initDataStore();
        syncWithBackend();
    },

    sync: syncWithBackend,
    getApiBase: () => API_BASE,

    getUsuarios: () => getTableData('USUARIOS'),
    getTurmas: () => getTableData('TURMAS'),
    getDisciplinas: () => getTableData('DISCIPLINAS'),
    getCompetencias: () => getTableData('COMPETENCIAS'),
    getPeriodos: () => getTableData('PERIODOS_AVALIATIVOS'),
    getMatriculas: () => getTableData('MATRICULAS'),
    getPTD: () => getTableData('PROFESSOR_TURMA_DISCIPLINA'),
    getAvaliacoes: () => getTableData('AVALIACOES'),

    // Obter dados completos de matrícula do aluno
    getMatriculaAluno: function (id_aluno) {
        const matriculas = this.getMatriculas();
        const turmas = this.getTurmas();
        const anosEscolares = getTableData('ANOS_ESCOLARES');

        const mat = matriculas.find(m => Number(m.id_aluno) === Number(id_aluno));
        if (!mat) return null;

        const turma = turmas.find(t => Number(t.id_turma) === Number(mat.id_turma));
        const anoEscolar = turma ? anosEscolares.find(a => Number(a.id_ano_escolar) === Number(turma.id_ano_escolar)) : null;

        return {
            ...mat,
            turma_nome: turma ? turma.nome_turma : 'Não informada',
            ano_escolar_nome: anoEscolar ? anoEscolar.descricao : '',
            periodo_turno: turma ? turma.periodo : ''
        };
    },

    // Buscar turmas que o professor leciona
    getTurmasDoProfessor: function (id_professor) {
        const ptd = this.getPTD().filter(item => Number(item.id_professor) === Number(id_professor));
        const turmas = this.getTurmas();
        const disciplinas = this.getDisciplinas();

        const resultado = [];
        ptd.forEach(rel => {
            const turma = turmas.find(t => Number(t.id_turma) === Number(rel.id_turma));
            const disc = disciplinas.find(d => Number(d.id_disciplina) === Number(rel.id_disciplina));
            if (turma && disc) {
                resultado.push({
                    id_relacao: rel.id_relacao,
                    id_turma: turma.id_turma,
                    nome_turma: turma.nome_turma,
                    id_disciplina: disc.id_disciplina,
                    nome_disciplina: disc.nome
                });
            }
        });
        return resultado;
    },

    // Obter alunos matriculados em uma turma
    getAlunosPorTurma: function (id_turma) {
        const matriculas = this.getMatriculas().filter(m => Number(m.id_turma) === Number(id_turma));
        const usuarios = this.getUsuarios();

        return matriculas.map(mat => {
            const usuario = usuarios.find(u => Number(u.id_usuario) === Number(mat.id_aluno));
            return {
                id_matricula: mat.id_matricula,
                id_aluno: mat.id_aluno,
                nome: usuario ? usuario.nome : 'Aluno desconhecido',
                email: usuario ? usuario.email : '',
                status_matricula: mat.status
            };
        });
    },

    // Buscar avaliações existentes para uma combinação
    getAvaliacoesRegistro: function (id_matricula, id_disciplina, id_periodo) {
        const avaliacoes = this.getAvaliacoes();
        return avaliacoes.filter(a =>
            Number(a.id_matricula) === Number(id_matricula) &&
            Number(a.id_disciplina) === Number(id_disciplina) &&
            Number(a.id_periodo) === Number(id_periodo)
        );
    },

    // Inicializar ciclo de avaliação para uma turma/disciplina/período
    inicializarEtapaAvaliacao: function (id_turma, id_disciplina, id_periodo, id_professor) {
        // Envio assíncrono para o MySQL via Node.js API
        fetch(`${API_BASE}/api/avaliacoes/iniciar-etapa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_turma, id_disciplina, id_periodo, id_professor })
        }).then(res => res.json()).then(res => {
            if (res.success) syncWithBackend();
        }).catch(err => console.warn('Falha no sync do MySQL:', err));

        // Atualização imediata no cache local
        const alunos = this.getAlunosPorTurma(id_turma);
        const competencias = this.getCompetencias();
        const avaliacoes = this.getAvaliacoes();

        let novos = 0;
        alunos.forEach(aluno => {
            competencias.forEach(comp => {
                const existe = avaliacoes.find(a =>
                    Number(a.id_matricula) === Number(aluno.id_matricula) &&
                    Number(a.id_competencia) === Number(comp.id_competencia) &&
                    Number(a.id_disciplina) === Number(id_disciplina) &&
                    Number(a.id_periodo) === Number(id_periodo)
                );

                if (!existe) {
                    avaliacoes.push({
                        id_avaliacao: Date.now() + Math.floor(Math.random() * 10000),
                        id_matricula: Number(aluno.id_matricula),
                        id_competencia: Number(comp.id_competencia),
                        id_disciplina: Number(id_disciplina),
                        id_periodo: Number(id_periodo),
                        id_professor: Number(id_professor),
                        nota_autoavaliacao: null,
                        nota_professor: null,
                        nota_final: null,
                        observacao: '',
                        data_avaliacao: new Date().toISOString()
                    });
                    novos++;
                }
            });
        });

        if (novos > 0) {
            setTableData('AVALIACOES', avaliacoes);
        }
        return novos;
    },

    // Salvar Autoavaliação do Aluno (AA)
    salvarAutoavaliacaoAluno: function (id_matricula, id_disciplina, id_periodo, notasPorCompetencia) {
        // Envio assíncrono para o MySQL via Node.js API
        fetch(`${API_BASE}/api/avaliacoes/autoavaliacao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_matricula, id_disciplina, id_periodo, notasPorCompetencia })
        }).then(res => res.json()).then(res => {
            if (res.success) syncWithBackend();
        }).catch(err => console.warn('Falha no sync do MySQL:', err));

        // Atualização imediata no cache local
        const avaliacoes = this.getAvaliacoes();
        const competencias = this.getCompetencias();
        const ptd = this.getPTD().find(rel => Number(rel.id_disciplina) === Number(id_disciplina));
        const id_professor_default = ptd ? ptd.id_professor : 3;

        competencias.forEach(comp => {
            const notaAA = notasPorCompetencia[comp.id_competencia];
            if (notaAA !== undefined && notaAA !== null) {
                let av = avaliacoes.find(a =>
                    Number(a.id_matricula) === Number(id_matricula) &&
                    Number(a.id_competencia) === Number(comp.id_competencia) &&
                    Number(a.id_disciplina) === Number(id_disciplina) &&
                    Number(a.id_periodo) === Number(id_periodo)
                );

                if (av) {
                    av.nota_autoavaliacao = Number(notaAA);
                    if (av.nota_professor !== null && av.nota_professor !== undefined) {
                        av.nota_final = Number(((av.nota_autoavaliacao + av.nota_professor) / 2).toFixed(2));
                    }
                    av.data_avaliacao = new Date().toISOString();
                } else {
                    avaliacoes.push({
                        id_avaliacao: Date.now() + Math.floor(Math.random() * 10000),
                        id_matricula: Number(id_matricula),
                        id_competencia: Number(comp.id_competencia),
                        id_disciplina: Number(id_disciplina),
                        id_periodo: Number(id_periodo),
                        id_professor: id_professor_default,
                        nota_autoavaliacao: Number(notaAA),
                        nota_professor: null,
                        nota_final: null,
                        observacao: '',
                        data_avaliacao: new Date().toISOString()
                    });
                }
            }
        });

        setTableData('AVALIACOES', avaliacoes);
        return true;
    },

    // Salvar Avaliação do Professor (AP) e calcular NF = (AA + AP) / 2
    salvarAvaliacaoProfessor: function (id_matricula, id_disciplina, id_periodo, id_professor, notasPorCompetencia, observacaoGeral) {
        // Envio assíncrono para o MySQL via Node.js API
        fetch(`${API_BASE}/api/avaliacoes/professor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_matricula, id_disciplina, id_periodo, id_professor, notasPorCompetencia, observacao: observacaoGeral })
        }).then(res => res.json()).then(res => {
            if (res.success) syncWithBackend();
        }).catch(err => console.warn('Falha no sync do MySQL:', err));

        // Atualização imediata no cache local
        const avaliacoes = this.getAvaliacoes();
        const competencias = this.getCompetencias();

        competencias.forEach(comp => {
            const notaAP = notasPorCompetencia[comp.id_competencia];
            if (notaAP !== undefined && notaAP !== null) {
                let av = avaliacoes.find(a =>
                    Number(a.id_matricula) === Number(id_matricula) &&
                    Number(a.id_competencia) === Number(comp.id_competencia) &&
                    Number(a.id_disciplina) === Number(id_disciplina) &&
                    Number(a.id_periodo) === Number(id_periodo)
                );

                const notaAPNum = Number(notaAP);

                if (av) {
                    av.nota_professor = notaAPNum;
                    av.id_professor = Number(id_professor);
                    if (observacaoGeral) av.observacao = observacaoGeral;

                    if (av.nota_autoavaliacao !== null && av.nota_autoavaliacao !== undefined) {
                        av.nota_final = Number(((Number(av.nota_autoavaliacao) + notaAPNum) / 2).toFixed(2));
                    } else {
                        av.nota_final = null; // Regra estrita: aguarda autoavaliação
                    }
                    av.data_avaliacao = new Date().toISOString();
                } else {
                    avaliacoes.push({
                        id_avaliacao: Date.now() + Math.floor(Math.random() * 10000),
                        id_matricula: Number(id_matricula),
                        id_competencia: Number(comp.id_competencia),
                        id_disciplina: Number(id_disciplina),
                        id_periodo: Number(id_periodo),
                        id_professor: Number(id_professor),
                        nota_autoavaliacao: null,
                        nota_professor: notaAPNum,
                        nota_final: null,
                        observacao: observacaoGeral || '',
                        data_avaliacao: new Date().toISOString()
                    });
                }
            }
        });

        setTableData('AVALIACOES', avaliacoes);
        return true;
    },

    // Excluir avaliação / resetar etapa selecionada
    excluirAvaliacaoEtapa: function (id_matricula, id_disciplina, id_periodo) {
        // Envio para o MySQL via Node.js API
        fetch(`${API_BASE}/api/avaliacoes`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_matricula, id_disciplina, id_periodo })
        }).then(res => res.json()).then(res => {
            if (res.success) syncWithBackend();
        }).catch(err => console.warn('Falha no sync do MySQL:', err));

        let avaliacoes = this.getAvaliacoes();
        const totalAntes = avaliacoes.length;
        avaliacoes = avaliacoes.filter(a =>
            !(Number(a.id_matricula) === Number(id_matricula) &&
              Number(a.id_disciplina) === Number(id_disciplina) &&
              Number(a.id_periodo) === Number(id_periodo))
        );
        setTableData('AVALIACOES', avaliacoes);
        return totalAntes - avaliacoes.length;
    }
};

// Inicializa na carga da página
document.addEventListener('DOMContentLoaded', function () {
    DataStore.init();
});
