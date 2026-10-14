-- ============================================================
-- MindGrowth - Banco de Dados v2.0 (Definitivo)
-- Compatível com MySQL / MariaDB (XAMPP + phpMyAdmin)
-- Alinhado aos Requisitos do Artigo Científico
-- ============================================================

CREATE DATABASE IF NOT EXISTS mindgrowth
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE mindgrowth;

-- Desativar temporariamente checagem de chaves estrangeiras para recriação limpa
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS avaliacoes;
DROP TABLE IF EXISTS solicitacoes_professor;
DROP TABLE IF EXISTS professor_turma_disciplina;
DROP TABLE IF EXISTS ano_escolar_disciplina;
DROP TABLE IF EXISTS matriculas;
DROP TABLE IF EXISTS turmas;
DROP TABLE IF EXISTS periodos_avaliativos;
DROP TABLE IF EXISTS competencias;
DROP TABLE IF EXISTS disciplinas;
DROP TABLE IF EXISTS anos_escolares;
DROP TABLE IF EXISTS anos_letivos;
DROP TABLE IF EXISTS niveis_ensino;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. USUÁRIOS (Alunos, Professores e Coordenação/Gestores)
-- ============================================================
CREATE TABLE usuarios (
    id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    data_nascimento DATE NULL,
    sexo ENUM('MASCULINO','FEMININO','OUTRO') NULL,
    tipo_usuario ENUM('ALUNO','PROFESSOR','COORDENADOR') NOT NULL,
    foto_perfil VARCHAR(255) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. NÍVEIS DE ENSINO (Fundamental e Médio)
-- ============================================================
CREATE TABLE niveis_ensino (
    id_nivel INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ============================================================
-- 3. ANOS / SÉRIES ESCOLARES (6º ao 9º Fundamental; 1º ao 3º EM)
-- ============================================================
CREATE TABLE anos_escolares (
    id_ano_escolar INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_nivel INT UNSIGNED NOT NULL,
    descricao VARCHAR(50) NOT NULL,
    ordem_exibicao INT NOT NULL,

    CONSTRAINT fk_anos_escolares_nivel
        FOREIGN KEY (id_nivel)
        REFERENCES niveis_ensino(id_nivel)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_ano_escolar_nivel
        UNIQUE (id_nivel, descricao)
) ENGINE=InnoDB;

-- ============================================================
-- 4. ANOS LETIVOS
-- ============================================================
CREATE TABLE anos_letivos (
    id_ano_letivo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ano YEAR NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- 5. TURMAS
-- ============================================================
CREATE TABLE turmas (
    id_turma INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_ano_escolar INT UNSIGNED NOT NULL,
    id_ano_letivo INT UNSIGNED NOT NULL,
    nome_turma VARCHAR(20) NOT NULL,
    periodo ENUM('MANHA','TARDE','NOITE','INTEGRAL') NULL,

    CONSTRAINT fk_turmas_ano_escolar
        FOREIGN KEY (id_ano_escolar)
        REFERENCES anos_escolares(id_ano_escolar)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_turmas_ano_letivo
        FOREIGN KEY (id_ano_letivo)
        REFERENCES anos_letivos(id_ano_letivo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_turma_ano
        UNIQUE (id_ano_escolar, id_ano_letivo, nome_turma),

    CONSTRAINT uq_turma_id_ano_letivo
        UNIQUE (id_turma, id_ano_letivo),

    INDEX idx_turmas_ano_letivo (id_ano_letivo),
    INDEX idx_turmas_ano_escolar (id_ano_escolar)
) ENGINE=InnoDB;

-- ============================================================
-- 6. MATRÍCULAS / HISTÓRICO ESCOLAR DO ALUNO
-- ============================================================
CREATE TABLE matriculas (
    id_matricula INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_aluno INT UNSIGNED NOT NULL,
    id_turma INT UNSIGNED NOT NULL,
    id_ano_letivo INT UNSIGNED NOT NULL,
    data_matricula DATE NOT NULL,
    status ENUM(
        'CURSANDO',
        'APROVADO',
        'REPROVADO',
        'TRANSFERIDO'
    ) NOT NULL DEFAULT 'CURSANDO',

    CONSTRAINT fk_matriculas_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_matriculas_turma
        FOREIGN KEY (id_turma)
        REFERENCES turmas(id_turma)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_matriculas_ano_letivo
        FOREIGN KEY (id_ano_letivo)
        REFERENCES anos_letivos(id_ano_letivo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_matriculas_turma_ano
        FOREIGN KEY (id_turma, id_ano_letivo)
        REFERENCES turmas(id_turma, id_ano_letivo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_aluno_ano_letivo
        UNIQUE (id_aluno, id_ano_letivo),

    INDEX idx_matriculas_aluno (id_aluno),
    INDEX idx_matriculas_turma (id_turma),
    INDEX idx_matriculas_ano (id_ano_letivo)
) ENGINE=InnoDB;

-- ============================================================
-- 7. DISCIPLINAS
-- ============================================================
CREATE TABLE disciplinas (
    id_disciplina INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- 8. DISCIPLINAS DISPONÍVEIS POR ANO ESCOLAR
-- ============================================================
CREATE TABLE ano_escolar_disciplina (
    id_relacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_ano_escolar INT UNSIGNED NOT NULL,
    id_disciplina INT UNSIGNED NOT NULL,

    CONSTRAINT fk_aed_ano_escolar
        FOREIGN KEY (id_ano_escolar)
        REFERENCES anos_escolares(id_ano_escolar)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_aed_disciplina
        FOREIGN KEY (id_disciplina)
        REFERENCES disciplinas(id_disciplina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_ano_disciplina
        UNIQUE (id_ano_escolar, id_disciplina)
) ENGINE=InnoDB;

-- ============================================================
-- 9. PROFESSOR x TURMA x DISCIPLINA
-- ============================================================
CREATE TABLE professor_turma_disciplina (
    id_relacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_professor INT UNSIGNED NOT NULL,
    id_turma INT UNSIGNED NOT NULL,
    id_disciplina INT UNSIGNED NOT NULL,

    CONSTRAINT fk_ptd_professor
        FOREIGN KEY (id_professor)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ptd_turma
        FOREIGN KEY (id_turma)
        REFERENCES turmas(id_turma)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_ptd_disciplina
        FOREIGN KEY (id_disciplina)
        REFERENCES disciplinas(id_disciplina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_turma_disciplina
        UNIQUE (id_turma, id_disciplina),

    INDEX idx_ptd_professor (id_professor),
    INDEX idx_ptd_turma (id_turma),
    INDEX idx_ptd_disciplina (id_disciplina)
) ENGINE=InnoDB;

-- ============================================================
-- 10. PERÍODOS AVALIATIVOS (Bimestres / Ciclos)
-- ============================================================
CREATE TABLE periodos_avaliativos (
    id_periodo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_ano_letivo INT UNSIGNED NOT NULL,
    nome VARCHAR(100) NOT NULL,
    ordem_periodo INT NOT NULL,
    data_inicio DATE NULL,
    data_fim DATE NULL,

    CONSTRAINT fk_periodos_ano_letivo
        FOREIGN KEY (id_ano_letivo)
        REFERENCES anos_letivos(id_ano_letivo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_periodo_ano_ordem
        UNIQUE (id_ano_letivo, ordem_periodo),

    INDEX idx_periodos_ano (id_ano_letivo)
) ENGINE=InnoDB;

-- ============================================================
-- 11. COMPETÊNCIAS / SOFT SKILLS (Critérios Padronizados - Artigo Seção 2.1)
-- ============================================================
CREATE TABLE competencias (
    id_competencia INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT NULL,
    categoria VARCHAR(100) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- 12. SOLICITAÇÕES DE PROFESSORES
-- ============================================================
CREATE TABLE solicitacoes_professor (
    id_solicitacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    status ENUM('PENDENTE','APROVADA','RECUSADA')
        NOT NULL DEFAULT 'PENDENTE',
    id_coordenador INT UNSIGNED NULL,
    observacao TEXT NULL,
    data_solicitacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_analise DATETIME NULL,

    CONSTRAINT fk_solicitacao_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_solicitacao_coordenador
        FOREIGN KEY (id_coordenador)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    INDEX idx_solicitacoes_usuario (id_usuario),
    INDEX idx_solicitacoes_status (status),
    INDEX idx_solicitacoes_coordenador (id_coordenador)
) ENGINE=InnoDB;

-- ============================================================
-- 13. AVALIAÇÕES DE SOFT SKILLS (Artigo Seção 3.2 e 4)
--
-- Fórmula automatizada:
-- NF_skill = (AA + AP) / 2
--
-- Ajuste estrutural: notas e id_professor permitem valor nulo (NULL)
-- para viabilizar o preenchimento assíncrono (aluno avalia primeiro
-- ou docente avalia primeiro, calculando NF quando ambas existirem).
-- ============================================================
CREATE TABLE avaliacoes (
    id_avaliacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    id_matricula INT UNSIGNED NOT NULL,
    id_competencia INT UNSIGNED NOT NULL,
    id_disciplina INT UNSIGNED NOT NULL,
    id_periodo INT UNSIGNED NOT NULL,
    id_professor INT UNSIGNED NULL,

    nota_autoavaliacao DECIMAL(4,2) NULL DEFAULT NULL,
    nota_professor DECIMAL(4,2) NULL DEFAULT NULL,

    nota_final DECIMAL(4,2)
        GENERATED ALWAYS AS (
            CASE
                WHEN nota_autoavaliacao IS NOT NULL AND nota_professor IS NOT NULL
                THEN (nota_autoavaliacao + nota_professor) / 2
                ELSE NULL
            END
        ) STORED,

    observacao TEXT NULL,
    data_avaliacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_avaliacoes_matricula
        FOREIGN KEY (id_matricula)
        REFERENCES matriculas(id_matricula)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_avaliacoes_competencia
        FOREIGN KEY (id_competencia)
        REFERENCES competencias(id_competencia)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_avaliacoes_disciplina
        FOREIGN KEY (id_disciplina)
        REFERENCES disciplinas(id_disciplina)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_avaliacoes_periodo
        FOREIGN KEY (id_periodo)
        REFERENCES periodos_avaliativos(id_periodo)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_avaliacoes_professor
        FOREIGN KEY (id_professor)
        REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    -- Escala Likert 1 a 5 padronizada no artigo
    CONSTRAINT chk_nota_autoavaliacao
        CHECK (nota_autoavaliacao IS NULL OR (nota_autoavaliacao BETWEEN 1.00 AND 5.00)),

    CONSTRAINT chk_nota_professor
        CHECK (nota_professor IS NULL OR (nota_professor BETWEEN 1.00 AND 5.00)),

    CONSTRAINT uq_avaliacao
        UNIQUE (
            id_matricula,
            id_competencia,
            id_disciplina,
            id_periodo
        ),

    INDEX idx_avaliacoes_matricula (id_matricula),
    INDEX idx_avaliacoes_competencia (id_competencia),
    INDEX idx_avaliacoes_disciplina (id_disciplina),
    INDEX idx_avaliacoes_periodo (id_periodo),
    INDEX idx_avaliacoes_professor (id_professor)
) ENGINE=InnoDB;

-- ============================================================
-- CARGA DE DADOS INICIAIS (SEED DATA COM NOMES GENÉRICOS)
-- ============================================================

-- 1. Níveis de Ensino
INSERT INTO niveis_ensino (id_nivel, nome) VALUES
(1, 'Ensino Fundamental'),
(2, 'Ensino Médio');

-- 2. Anos Letivos
INSERT INTO anos_letivos (id_ano_letivo, ano, ativo) VALUES
(1, 2026, TRUE);

-- 3. Anos / Séries Escolares
INSERT INTO anos_escolares (id_ano_escolar, id_nivel, descricao, ordem_exibicao) VALUES
(1, 1, '6º Ano', 1),
(2, 1, '7º Ano', 2),
(3, 1, '8º Ano', 3),
(4, 1, '9º Ano', 4),
(5, 2, '1º Ano EM', 10),
(6, 2, '2º Ano EM', 11),
(7, 2, '3º Ano EM', 12);

-- 4. Turmas
INSERT INTO turmas (id_turma, id_ano_escolar, id_ano_letivo, nome_turma, periodo) VALUES
(1, 4, 1, '9º Ano A', 'MANHA'),
(2, 5, 1, '1º Ano EM A', 'MANHA'),
(3, 7, 1, '3º Ano EM A', 'MANHA');

-- 5. Disciplinas
INSERT INTO disciplinas (id_disciplina, nome, descricao, ativo) VALUES
(1, 'Língua Portuguesa', 'Comunicação, leitura e expressão textual', TRUE),
(2, 'Matemática', 'Raciocínio lógico e resolução de problemas', TRUE),
(3, 'Ciências / Biologia', 'Investigação científica e pensamento crítico', TRUE),
(4, 'História e Sociedade', 'Cidadania, empatia e contexto social', TRUE),
(5, 'Projeto de Vida', 'Autoconhecimento e planejamento socioemocional', TRUE);

-- 6. Associação Disciplinas x Anos Escolares
INSERT INTO ano_escolar_disciplina (id_ano_escolar, id_disciplina) VALUES
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5),
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5),
(7, 1), (7, 2), (7, 3), (7, 4), (7, 5);

-- 7. Períodos Avaliativos (Bimestres)
INSERT INTO periodos_avaliativos (id_periodo, id_ano_letivo, nome, ordem_periodo, data_inicio, data_fim) VALUES
(1, 1, '1º Bimestre', 1, '2026-02-01', '2026-04-30'),
(2, 1, '2º Bimestre', 2, '2026-05-01', '2026-07-15'),
(3, 1, '3º Bimestre', 3, '2026-08-01', '2026-09-30'),
(4, 1, '4º Bimestre', 4, '2026-10-01', '2026-12-15');

-- 8. Competências Socioemocionais (Extraídas da fundamentação do Artigo)
INSERT INTO competencias (id_competencia, nome, categoria, descricao, ativo) VALUES
(1, 'Responsabilidade', 'Autogestão', 'Capacidade de cumprir prazos, gerenciar compromissos e demonstrar pontualidade e dedicação às atividades escolares.', TRUE),
(2, 'Trabalho em Equipe & Relações Interpessoais', 'Habilidades Sociais', 'Habilidade de colaborar de forma respeitosa, ouvir os colegas e construir soluções coletivas em sala de aula.', TRUE),
(3, 'Pensamento Crítico & Senso Crítico', 'Cognitivo-Comportamental', 'Capacidade de analisar informações, questionar com fundamentos lógicos e propor argumentos construtivos.', TRUE),
(4, 'Comunicação Assertiva', 'Expressão', 'Habilidade de expressar ideias com clareza, respeito e empatia, tanto oralmente quanto por escrito.', TRUE),
(5, 'Inteligência Emocional & Empatia', 'Socioemocional', 'Autoconsciência sobre as próprias emoções, autocontrole e sensibilidade para compreender o ponto de vista alheio.', TRUE),
(6, 'Adaptabilidade & Resolução de Problemas', 'Resiliência', 'Flexibilidade diante de mudanças, busca criativa de alternativas e persistência frente a novos desafios.', TRUE);

-- 9. Usuários Genéricos de Teste (Sem nomes de autores ou orientador)
INSERT INTO usuarios (id_usuario, nome, username, email, senha_hash, telefone, tipo_usuario, ativo) VALUES
(1, 'Lucas Silva', 'aluno.demo', 'lucas.silva@escola.edu.br', '123456', '(17) 99111-1111', 'ALUNO', TRUE),
(2, 'Mariana Oliveira', 'mariana.aluna', 'mariana.oliveira@escola.edu.br', '123456', '(17) 99222-2222', 'ALUNO', TRUE),
(3, 'Prof. Carlos Eduardo Santos', 'prof.carlos', 'carlos.santos@prof.escola.edu.br', '123456', '(17) 99333-3333', 'PROFESSOR', TRUE),
(4, 'Coord. Helena Vasconcelos', 'coord.helena', 'coordenacao@escola.edu.br', '123456', '(17) 99444-4444', 'COORDENADOR', TRUE),
(5, 'Gabriel Ferreira', 'gabriel.aluno', 'gabriel.aluno@escola.edu.br', '123456', '(17) 99555-5555', 'ALUNO', TRUE);

-- 10. Matrículas (Turma 1: 9º Ano A)
INSERT INTO matriculas (id_matricula, id_aluno, id_turma, id_ano_letivo, data_matricula, status) VALUES
(1, 1, 1, 1, '2026-02-01', 'CURSANDO'),
(2, 2, 1, 1, '2026-02-01', 'CURSANDO'),
(3, 5, 1, 1, '2026-02-01', 'CURSANDO');

-- 11. Vínculo Professor x Turma x Disciplina
INSERT INTO professor_turma_disciplina (id_relacao, id_professor, id_turma, id_disciplina) VALUES
(1, 3, 1, 1), -- Prof. Carlos leciona Língua Portuguesa no 9º Ano A
(2, 3, 1, 5), -- Prof. Carlos leciona Projeto de Vida no 9º Ano A
(3, 3, 2, 1); -- Prof. Carlos leciona Língua Portuguesa no 1º Ano EM A

-- 12. Avaliações Modelo (Exemplo Completo com Cálculo Automatizado da Nota Final)
-- Aluno: Lucas Silva (id_matricula: 1), 1º Bimestre (id_periodo: 1), Português (id_disciplina: 1), Prof. Carlos (id_professor: 3)
INSERT INTO avaliacoes (id_matricula, id_competencia, id_disciplina, id_periodo, id_professor, nota_autoavaliacao, nota_professor, observacao, data_avaliacao) VALUES
(1, 1, 1, 1, 3, 4.00, 5.00, 'Excelente pontualidade na entrega dos trabalhos e compromisso.', '2026-03-20 10:30:00'),
(1, 2, 1, 1, 3, 4.00, 4.00, 'Boa cooperação nas atividades em equipe.', '2026-03-20 10:30:00'),
(1, 3, 1, 1, 3, 5.00, 4.00, 'Ótima capacidade crítica e argumentativa nos debates.', '2026-03-20 10:30:00'),
(1, 4, 1, 1, 3, 4.00, 4.00, 'Boa clareza nas redações e exposições orais.', '2026-03-20 10:30:00'),
(1, 5, 1, 1, 3, 3.00, 4.00, 'Demonstrou evolução contínua no autocontrole durante avaliações.', '2026-03-20 10:30:00'),
(1, 6, 1, 1, 3, 4.00, 4.00, 'Boa postura diante de novas atividades pedagógicas.', '2026-03-20 10:30:00');
