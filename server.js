/**
 * MindGrowth - server.js
 * Back-end em Node.js (Express + MySQL)
 * Alinhado estritamente à Seção 3.4 do Artigo Científico
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos do front-end
app.use(express.static(path.join(__dirname)));

// Configuração da Conexão com o MySQL do XAMPP
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mindgrowth',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true
};

let pool = null;

function getPool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

// Inicializador / Verificador do Banco de Dados
async function inicializarBancoSeNecessario() {
    try {
        // Conexão inicial sem banco para verificar se o banco mindgrowth existe
        const tempConn = await mysql.createConnection({
            host: dbConfig.host,
            port: dbConfig.port,
            user: dbConfig.user,
            password: dbConfig.password,
            multipleStatements: true
        });

        await tempConn.query("CREATE DATABASE IF NOT EXISTS mindgrowth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
        await tempConn.end();

        // Agora verifica se a tabela usuarios existe no banco
        const p = getPool();
        const [tables] = await p.query("SHOW TABLES LIKE 'usuarios'");
        if (tables.length === 0) {
            console.log("Banco 'mindgrowth' sem tabelas. Importando mindgrowth.sql...");
            const sqlPath = path.join(__dirname, 'mindgrowth.sql');
            if (fs.existsSync(sqlPath)) {
                const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
                const connWithMulti = await mysql.createConnection({
                    ...dbConfig,
                    multipleStatements: true
                });
                await connWithMulti.query(sqlContent);
                await connWithMulti.end();
                console.log("Banco 'mindgrowth' importado com sucesso via mindgrowth.sql!");
            }
        }
    } catch (err) {
        console.warn("Aviso na inicialização do MySQL:", err.message);
    }
}

// ============================================================
// ROTAS DA API REST (Node.js)
// ============================================================

// 1. Status do Servidor e da Conexão com o MySQL
app.get('/api/status', async (req, res) => {
    try {
        const p = getPool();
        const [userRows] = await p.query('SELECT COUNT(*) as total FROM usuarios');
        const [avalRows] = await p.query('SELECT COUNT(*) as total FROM avaliacoes');
        const [turmaRows] = await p.query('SELECT COUNT(*) as total FROM turmas');

        res.json({
            success: true,
            status: 'online',
            dbConnected: true,
            database: dbConfig.database,
            counts: {
                usuarios: userRows[0].total,
                avaliacoes: avalRows[0].total,
                turmas: turmaRows[0].total
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'degraded',
            dbConnected: false,
            error: error.message,
            instruction: 'Verifique se o serviço MySQL no XAMPP Control Panel está iniciado (Start).'
        });
    }
});

// 2. Carregar todos os dados sincronizados com o banco
app.get('/api/dados', async (req, res) => {
    try {
        const p = getPool();
        const [usuarios] = await p.query('SELECT id_usuario, nome, username, email, telefone, data_nascimento, sexo, tipo_usuario, foto_perfil, ativo, criado_em FROM usuarios');
        const [turmas] = await p.query('SELECT * FROM turmas');
        const [disciplinas] = await p.query('SELECT * FROM disciplinas WHERE ativo = TRUE');
        const [competencias] = await p.query('SELECT * FROM competencias WHERE ativo = TRUE');
        const [periodos] = await p.query('SELECT * FROM periodos_avaliativos ORDER BY ordem_periodo ASC');
        const [matriculas] = await p.query('SELECT * FROM matriculas');
        const [ptd] = await p.query('SELECT * FROM professor_turma_disciplina');
        const [avaliacoes] = await p.query('SELECT * FROM avaliacoes');
        const [anos_escolares] = await p.query('SELECT * FROM anos_escolares ORDER BY ordem_exibicao ASC');
        const [anos_letivos] = await p.query('SELECT * FROM anos_letivos');
        const [niveis_ensino] = await p.query('SELECT * FROM niveis_ensino');

        res.json({
            success: true,
            usuarios,
            turmas,
            disciplinas,
            competencias,
            periodos,
            matriculas,
            ptd,
            avaliacoes,
            anos_escolares,
            anos_letivos,
            niveis_ensino
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3. Autenticação / Login
app.post('/api/auth/login', async (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const p = getPool();
        const loginStr = usuario.trim().toLowerCase();

        const [rows] = await p.query(
            'SELECT * FROM usuarios WHERE (LOWER(username) = ? OR LOWER(email) = ?) LIMIT 1',
            [loginStr, loginStr]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Usuário ou senha incorretos.' });
        }

        const user = rows[0];

        // Validação de senha (suporta texto plano do seed 123456 ou hash futuro)
        if (user.senha_hash !== senha && user.senha !== senha) {
            return res.status(401).json({ success: false, error: 'Usuário ou senha incorretos.' });
        }

        if (user.ativo === 0 || user.ativo === false) {
            return res.status(403).json({ success: false, error: 'Esta conta está inativa ou aguardando aprovação.' });
        }

        // Retorna dados do usuário autenticado (sem a senha)
        res.json({
            success: true,
            user: {
                id_usuario: user.id_usuario,
                nome: user.nome,
                username: user.username,
                email: user.email,
                tipo_usuario: user.tipo_usuario
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Cadastro de Novos Usuários
app.post('/api/usuarios/cadastro', async (req, res) => {
    const { nome, username, email, senha, telefone, sexo, perfil } = req.body;

    if (!nome || !username || !email || !senha || !perfil) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios não preenchidos.' });
    }

    try {
        const p = getPool();
        const cleanUser = username.trim().toLowerCase();
        const cleanEmail = email.trim().toLowerCase();

        // Verificar unicidade
        const [existing] = await p.query(
            'SELECT id_usuario FROM usuarios WHERE LOWER(username) = ? OR LOWER(email) = ?',
            [cleanUser, cleanEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({ success: false, error: 'Nome de usuário ou e-mail já cadastrado.' });
        }

        // Inserção do usuário
        const [result] = await p.query(
            `INSERT INTO usuarios (nome, username, email, senha_hash, telefone, sexo, tipo_usuario, ativo)
             VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [nome.trim(), cleanUser, cleanEmail, senha, telefone || null, sexo || 'OUTRO', perfil.toUpperCase()]
        );

        const novoId = result.insertId;

        // Se for ALUNO, criar matrícula padrão no 9º Ano A (Turma 1, Ano Letivo 1)
        if (perfil.toUpperCase() === 'ALUNO') {
            await p.query(
                `INSERT INTO matriculas (id_aluno, id_turma, id_ano_letivo, data_matricula, status)
                 VALUES (?, 1, 1, CURDATE(), 'CURSANDO')`,
                [novoId]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Usuário cadastrado com sucesso no banco de dados!',
            id_usuario: novoId
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. Salvar Autoavaliação do Aluno (AA)
app.post('/api/avaliacoes/autoavaliacao', async (req, res) => {
    const { id_matricula, id_disciplina, id_periodo, notasPorCompetencia } = req.body;

    if (!id_matricula || !id_disciplina || !id_periodo || !notasPorCompetencia) {
        return res.status(400).json({ success: false, error: 'Parâmetros incompletos.' });
    }

    try {
        const p = getPool();

        // Obter professor padrão para a turma e disciplina se não existir
        const [matRows] = await p.query('SELECT id_turma FROM matriculas WHERE id_matricula = ?', [id_matricula]);
        let idProfessorDefault = null;
        if (matRows.length > 0) {
            const idTurma = matRows[0].id_turma;
            const [ptdRows] = await p.query(
                'SELECT id_professor FROM professor_turma_disciplina WHERE id_turma = ? AND id_disciplina = ? LIMIT 1',
                [idTurma, id_disciplina]
            );
            if (ptdRows.length > 0) {
                idProfessorDefault = ptdRows[0].id_professor;
            }
        }

        for (const [idCompStr, nota] of Object.entries(notasPorCompetencia)) {
            const id_competencia = Number(idCompStr);
            const notaNum = Number(nota);

            if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) continue;

            const [existentes] = await p.query(
                `SELECT id_avaliacao FROM avaliacoes 
                 WHERE id_matricula = ? AND id_competencia = ? AND id_disciplina = ? AND id_periodo = ?`,
                [id_matricula, id_competencia, id_disciplina, id_periodo]
            );

            if (existentes.length > 0) {
                await p.query(
                    `UPDATE avaliacoes 
                     SET nota_autoavaliacao = ?, data_avaliacao = NOW()
                     WHERE id_avaliacao = ?`,
                    [notaNum, existentes[0].id_avaliacao]
                );
            } else {
                await p.query(
                    `INSERT INTO avaliacoes 
                     (id_matricula, id_competencia, id_disciplina, id_periodo, id_professor, nota_autoavaliacao, data_avaliacao)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [id_matricula, id_competencia, id_disciplina, id_periodo, idProfessorDefault, notaNum]
                );
            }
        }

        res.json({ success: true, message: 'Autoavaliação salva com sucesso no MySQL!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. Salvar Avaliação do Professor (AP)
app.post('/api/avaliacoes/professor', async (req, res) => {
    const { id_matricula, id_disciplina, id_periodo, id_professor, notasPorCompetencia, observacao } = req.body;

    if (!id_matricula || !id_disciplina || !id_periodo || !id_professor || !notasPorCompetencia) {
        return res.status(400).json({ success: false, error: 'Parâmetros incompletos.' });
    }

    try {
        const p = getPool();

        for (const [idCompStr, nota] of Object.entries(notasPorCompetencia)) {
            const id_competencia = Number(idCompStr);
            const notaNum = Number(nota);

            if (isNaN(notaNum) || notaNum < 1 || notaNum > 5) continue;

            const [existentes] = await p.query(
                `SELECT id_avaliacao FROM avaliacoes 
                 WHERE id_matricula = ? AND id_competencia = ? AND id_disciplina = ? AND id_periodo = ?`,
                [id_matricula, id_competencia, id_disciplina, id_periodo]
            );

            if (existentes.length > 0) {
                await p.query(
                    `UPDATE avaliacoes 
                     SET nota_professor = ?, id_professor = ?, observacao = ?, data_avaliacao = NOW()
                     WHERE id_avaliacao = ?`,
                    [notaNum, id_professor, observacao || null, existentes[0].id_avaliacao]
                );
            } else {
                await p.query(
                    `INSERT INTO avaliacoes 
                     (id_matricula, id_competencia, id_disciplina, id_periodo, id_professor, nota_professor, observacao, data_avaliacao)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [id_matricula, id_competencia, id_disciplina, id_periodo, id_professor, notaNum, observacao || null]
                );
            }
        }

        res.json({ success: true, message: 'Avaliação do docente gravada com sucesso no MySQL!' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 7. Inicializar Etapa de Avaliação para Turma
app.post('/api/avaliacoes/iniciar-etapa', async (req, res) => {
    const { id_turma, id_disciplina, id_periodo, id_professor } = req.body;

    if (!id_turma || !id_disciplina || !id_periodo) {
        return res.status(400).json({ success: false, error: 'Parâmetros incompletos.' });
    }

    try {
        const p = getPool();

        const [alunos] = await p.query('SELECT id_matricula FROM matriculas WHERE id_turma = ?', [id_turma]);
        const [competencias] = await p.query('SELECT id_competencia FROM competencias WHERE ativo = TRUE');

        let criados = 0;
        for (const aluno of alunos) {
            for (const comp of competencias) {
                const [existente] = await p.query(
                    `SELECT id_avaliacao FROM avaliacoes 
                     WHERE id_matricula = ? AND id_competencia = ? AND id_disciplina = ? AND id_periodo = ?`,
                    [aluno.id_matricula, comp.id_competencia, id_disciplina, id_periodo]
                );

                if (existente.length === 0) {
                    await p.query(
                        `INSERT INTO avaliacoes 
                         (id_matricula, id_competencia, id_disciplina, id_periodo, id_professor, data_avaliacao)
                         VALUES (?, ?, ?, ?, ?, NOW())`,
                        [aluno.id_matricula, comp.id_competencia, id_disciplina, id_periodo, id_professor || null]
                    );
                    criados++;
                }
            }
        }

        res.json({ success: true, message: `Etapa iniciada com sucesso. ${criados} registros preparados.`, criados });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. Excluir / Resetar Avaliação de Etapa
app.delete('/api/avaliacoes', async (req, res) => {
    const { id_matricula, id_disciplina, id_periodo } = req.body;

    if (!id_matricula || !id_disciplina || !id_periodo) {
        return res.status(400).json({ success: false, error: 'Parâmetros incompletos.' });
    }

    try {
        const p = getPool();
        const [result] = await p.query(
            'DELETE FROM avaliacoes WHERE id_matricula = ? AND id_disciplina = ? AND id_periodo = ?',
            [id_matricula, id_disciplina, id_periodo]
        );

        res.json({ success: true, message: `${result.affectedRows} registros excluídos.` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Inicialização do Servidor
app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`  MindGrowth - Servidor Node.js em Execução!        `);
    console.log(`  Acesse: http://localhost:${PORT}                  `);
    console.log(`  MySQL Host: ${dbConfig.host}:${dbConfig.port}      `);
    console.log(`  Banco: ${dbConfig.database}                       `);
    console.log(`====================================================`);
    await inicializarBancoSeNecessario();
});
