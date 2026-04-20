-- =====================================================================
-- MedicAI - Base de Datos (MySQL 8.0+)
-- Soporta: CRUD completo + alimentación de IA con contexto del paciente
-- =====================================================================

-- Crear base de datos
DROP DATABASE IF EXISTS medicai;
CREATE DATABASE medicai
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE medicai;

-- =====================================================================
-- 1. USUARIOS (autenticación: admin, médicos, recepción)
-- =====================================================================
CREATE TABLE usuarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    rol             ENUM('admin','medico','recepcion') NOT NULL,
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. PACIENTES
-- =====================================================================
CREATE TABLE pacientes (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    dni                     VARCHAR(20) UNIQUE NOT NULL,
    nombres                 VARCHAR(100) NOT NULL,
    apellidos               VARCHAR(100) NOT NULL,
    fecha_nacimiento        DATE,
    sexo                    ENUM('M','F','O'),
    telefono                VARCHAR(20),
    email                   VARCHAR(150),
    direccion               TEXT,
    tipo_sangre             VARCHAR(5),
    alergias                TEXT,
    antecedentes            TEXT,           -- enfermedades crónicas, cirugías previas
    medicamentos_actuales   TEXT,           -- tratamientos en curso (para IA)
    fecha_registro          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
    activo                  TINYINT(1) NOT NULL DEFAULT 1,
    INDEX idx_pacientes_dni (dni),
    INDEX idx_pacientes_apellidos (apellidos)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. MEDICOS (perfil clínico vinculado a usuarios)
-- =====================================================================
CREATE TABLE medicos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT NOT NULL UNIQUE,
    cmp             VARCHAR(20) UNIQUE NOT NULL,    -- Colegio Médico del Perú
    especialidad    VARCHAR(100) NOT NULL,
    telefono        VARCHAR(20),
    horario         VARCHAR(200),                   -- "Lun-Vie 08:00-14:00"
    INDEX idx_medicos_especialidad (especialidad),
    CONSTRAINT fk_medicos_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. CITAS
-- =====================================================================
CREATE TABLE citas (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id     INT NOT NULL,
    medico_id       INT NOT NULL,
    fecha_hora      DATETIME NOT NULL,
    duracion_min    INT NOT NULL DEFAULT 30,
    motivo          TEXT,
    estado          ENUM('pendiente','confirmada','atendida','cancelada','no_asistio')
                    NOT NULL DEFAULT 'pendiente',
    notas           TEXT,
    creada_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_citas_paciente (paciente_id),
    INDEX idx_citas_medico (medico_id),
    INDEX idx_citas_fecha (fecha_hora),
    INDEX idx_citas_estado (estado),
    CONSTRAINT fk_citas_paciente
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_citas_medico
        FOREIGN KEY (medico_id)   REFERENCES medicos(id)   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 5. CONSULTAS_TRIAJE (reemplaza triage_history)
--    Permite triaje anónimo (paciente_id NULL) o asociado a paciente.
--    Guarda contexto completo para que la IA aprenda/recuerde.
-- =====================================================================
CREATE TABLE consultas_triaje (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id             INT NULL,                           -- NULL = anónimo
    mensaje_usuario         TEXT NOT NULL,
    sintomas_detectados     JSON,                               -- array de síntomas
    nivel                   ENUM('EMERGENCIA','URGENCIA','ESTABLE') NOT NULL,
    resumen                 TEXT,
    accion_sugerida         TEXT,
    especialidad_sugerida   VARCHAR(100),
    contexto_ia             TEXT,                               -- prompt/respuesta Gemini (debug)
    derivada_a_cita_id      INT NULL,
    fecha_creacion          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_triaje_paciente (paciente_id),
    INDEX idx_triaje_nivel (nivel),
    INDEX idx_triaje_fecha (fecha_creacion),
    CONSTRAINT fk_triaje_paciente
        FOREIGN KEY (paciente_id)        REFERENCES pacientes(id) ON DELETE SET NULL,
    CONSTRAINT fk_triaje_cita
        FOREIGN KEY (derivada_a_cita_id) REFERENCES citas(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 6. HISTORIAL_CLINICO (consultas médicas reales, post-cita)
-- =====================================================================
CREATE TABLE historial_clinico (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id     INT NOT NULL,
    medico_id       INT NOT NULL,
    cita_id         INT NULL,
    fecha           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sintomas        TEXT NOT NULL,
    diagnostico     TEXT NOT NULL,
    tratamiento     TEXT,
    observaciones   TEXT,
    signos_vitales  JSON,                           -- {presion, pulso, temp, ...}
    INDEX idx_historial_paciente (paciente_id),
    INDEX idx_historial_fecha (fecha),
    CONSTRAINT fk_historial_paciente
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    CONSTRAINT fk_historial_medico
        FOREIGN KEY (medico_id)   REFERENCES medicos(id)   ON DELETE RESTRICT,
    CONSTRAINT fk_historial_cita
        FOREIGN KEY (cita_id)     REFERENCES citas(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 7. MEDICAMENTOS_RECETADOS
-- =====================================================================
CREATE TABLE medicamentos_recetados (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    historial_id    INT NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    dosis           VARCHAR(50),
    frecuencia      VARCHAR(100),                   -- "cada 8 horas"
    duracion_dias   INT,
    indicaciones    TEXT,
    INDEX idx_medicamentos_historial (historial_id),
    CONSTRAINT fk_medicamentos_historial
        FOREIGN KEY (historial_id) REFERENCES historial_clinico(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- VISTAS (útiles para alimentar a la IA con contexto completo)
-- =====================================================================

-- Ficha completa del paciente (pásala como contexto a Gemini)
CREATE OR REPLACE VIEW vista_ficha_paciente AS
SELECT
    p.id                                        AS paciente_id,
    p.dni,
    CONCAT(p.nombres, ' ', p.apellidos)         AS nombre_completo,
    p.fecha_nacimiento,
    TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad,
    p.sexo,
    p.tipo_sangre,
    p.alergias,
    p.antecedentes,
    p.medicamentos_actuales,
    (SELECT COUNT(*) FROM citas c              WHERE c.paciente_id = p.id) AS total_citas,
    (SELECT COUNT(*) FROM historial_clinico h  WHERE h.paciente_id = p.id) AS total_consultas,
    (SELECT COUNT(*) FROM consultas_triaje t   WHERE t.paciente_id = p.id) AS total_triajes
FROM pacientes p
WHERE p.activo = 1;

-- Últimos triajes con datos del paciente (IA con contexto)
CREATE OR REPLACE VIEW vista_triaje_contexto AS
SELECT
    t.id,
    t.mensaje_usuario,
    t.nivel,
    t.resumen,
    t.accion_sugerida,
    t.fecha_creacion,
    CONCAT(p.nombres, ' ', p.apellidos) AS paciente_nombre,
    p.fecha_nacimiento,
    p.sexo,
    p.alergias,
    p.antecedentes,
    p.medicamentos_actuales
FROM consultas_triaje t
LEFT JOIN pacientes p ON p.id = t.paciente_id
ORDER BY t.fecha_creacion DESC;

-- Agenda (para recepción y médicos)
CREATE OR REPLACE VIEW vista_agenda AS
SELECT
    c.id                                    AS cita_id,
    c.fecha_hora,
    c.duracion_min,
    c.motivo,
    c.estado,
    p.dni,
    CONCAT(p.nombres, ' ', p.apellidos)     AS paciente,
    p.telefono,
    u.nombre                                AS medico,
    m.especialidad
FROM citas c
JOIN pacientes p ON p.id = c.paciente_id
JOIN medicos m   ON m.id = c.medico_id
JOIN usuarios u  ON u.id = m.usuario_id
ORDER BY c.fecha_hora;

-- =====================================================================
-- DATOS DE EJEMPLO (seed) - Para demo y pruebas
-- NOTA: los password_hash son PLACEHOLDERS. Genera reales con bcrypt.
-- =====================================================================

INSERT INTO usuarios (email, password_hash, nombre, rol) VALUES
('admin@medicai.com',    '$2b$12$KIXoL6Jg3fEYI3p9wqZfUuqQ3vH0Jt5L8bN0aXqZzQYjR4q5a0p6S', 'Administrador',       'admin'),
('dr.garcia@medicai.com','$2b$12$KIXoL6Jg3fEYI3p9wqZfUuqQ3vH0Jt5L8bN0aXqZzQYjR4q5a0p6S', 'Dr. Carlos García',   'medico'),
('dra.lopez@medicai.com','$2b$12$KIXoL6Jg3fEYI3p9wqZfUuqQ3vH0Jt5L8bN0aXqZzQYjR4q5a0p6S', 'Dra. Ana López',      'medico'),
('recepcion@medicai.com','$2b$12$KIXoL6Jg3fEYI3p9wqZfUuqQ3vH0Jt5L8bN0aXqZzQYjR4q5a0p6S', 'María Torres',        'recepcion');

INSERT INTO medicos (usuario_id, cmp, especialidad, telefono, horario) VALUES
(2, 'CMP-12345', 'Medicina General', '999111222', 'Lun-Vie 08:00-14:00'),
(3, 'CMP-67890', 'Pediatría',        '999333444', 'Lun-Sab 14:00-20:00');

INSERT INTO pacientes (dni, nombres, apellidos, fecha_nacimiento, sexo, telefono, email, tipo_sangre, alergias, antecedentes, medicamentos_actuales) VALUES
('12345678', 'Juan',  'Pérez Ramos',    '1985-03-15', 'M', '987654321', 'juan@mail.com',   'O+',  'Penicilina',  'Hipertensión diagnosticada 2020', 'Enalapril 10mg/día'),
('87654321', 'María', 'Silva Gómez',    '1990-07-22', 'F', '987111222', 'maria@mail.com',  'A+',  'Ninguna',     'Asma leve',                       'Salbutamol inhalador PRN'),
('11223344', 'Pedro', 'Castro Luna',    '2015-11-05', 'M', '987333444', NULL,              'B+',  'Mariscos',    'Sano',                            NULL),
('55667788', 'Lucía', 'Fernández Rey',  '1978-01-30', 'F', '987555666', 'lucia@mail.com',  'AB+', 'AINES',       'Diabetes tipo 2, sobrepeso',      'Metformina 850mg 2x/día');

INSERT INTO citas (paciente_id, medico_id, fecha_hora, motivo, estado) VALUES
(1, 1, '2026-04-15 09:00:00', 'Control de presión arterial', 'confirmada'),
(2, 1, '2026-04-15 10:00:00', 'Crisis asmática leve',        'pendiente'),
(3, 2, '2026-04-16 15:00:00', 'Control pediátrico anual',    'confirmada'),
(4, 1, '2026-04-17 11:00:00', 'Seguimiento diabetes',        'pendiente');

INSERT INTO consultas_triaje (paciente_id, mensaje_usuario, sintomas_detectados, nivel, resumen, accion_sugerida, especialidad_sugerida) VALUES
(1,    'Me duele fuerte el pecho y me falta el aire', '["dolor torácico","disnea"]', 'EMERGENCIA', 'Posible evento cardiovascular en paciente hipertenso', 'Acudir INMEDIATAMENTE a emergencias', 'Cardiología'),
(2,    'Tengo tos y silbido en el pecho desde ayer',  '["tos","sibilancias"]',       'URGENCIA',   'Posible exacerbación asmática',                       'Usar inhalador y acudir a consulta hoy', 'Neumología'),
(NULL, 'Tengo un poco de fiebre y dolor de cabeza',   '["fiebre","cefalea"]',        'ESTABLE',    'Cuadro viral inespecífico',                           'Hidratación, paracetamol y reposo',      'Medicina General');

INSERT INTO historial_clinico (paciente_id, medico_id, cita_id, sintomas, diagnostico, tratamiento, observaciones, signos_vitales) VALUES
(1, 1, NULL, 'Cefalea ocasional, presión elevada en casa',
 'Hipertensión arterial estadio 1 - controlada',
 'Continuar Enalapril 10mg/día, dieta hiposódica',
 'Paciente adherente al tratamiento',
 '{"presion":"140/90","pulso":78,"temp":36.7,"peso":82}'),
(4, 1, NULL, 'Fatiga, sed excesiva',
 'Diabetes mellitus tipo 2 descompensada',
 'Ajustar Metformina a 1000mg 2x/día, derivar a nutrición',
 'Glicemia en ayunas: 180 mg/dL',
 '{"presion":"130/85","pulso":82,"temp":36.5,"glicemia":180}');

INSERT INTO medicamentos_recetados (historial_id, nombre, dosis, frecuencia, duracion_dias, indicaciones) VALUES
(1, 'Enalapril',    '10mg',   '1 vez al día (mañana)', 30, 'Tomar con alimentos'),
(2, 'Metformina',   '1000mg', 'Cada 12 horas',         30, 'Tomar con las comidas principales'),
(2, 'Atorvastatina','20mg',   '1 vez al día (noche)',  30, 'Tomar antes de dormir');

-- =====================================================================
-- CONSULTAS ÚTILES PARA ALIMENTAR A LA IA
-- =====================================================================

-- Ficha del paciente (contexto system prompt para Gemini):
--   SELECT * FROM vista_ficha_paciente WHERE paciente_id = ?;

-- Historial reciente (últimas 5 consultas):
--   SELECT fecha, diagnostico, tratamiento
--   FROM historial_clinico
--   WHERE paciente_id = ?
--   ORDER BY fecha DESC LIMIT 5;

-- Triajes previos:
--   SELECT fecha_creacion, mensaje_usuario, nivel, resumen
--   FROM consultas_triaje
--   WHERE paciente_id = ?
--   ORDER BY fecha_creacion DESC LIMIT 10;

-- Medicamentos activos:
--   SELECT mr.nombre, mr.dosis, mr.frecuencia
--   FROM medicamentos_recetados mr
--   JOIN historial_clinico h ON h.id = mr.historial_id
--   WHERE h.paciente_id = ?
--   ORDER BY h.fecha DESC;
