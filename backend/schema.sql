-- =====================================================================
-- MedicAI - Base de Datos Minimalista (MySQL 8.0+)
-- =====================================================================

DROP DATABASE IF EXISTS medicai;
CREATE DATABASE medicai
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE medicai;

-- =====================================================================
-- 1. USUARIOS
-- =====================================================================
CREATE TABLE usuarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. CITAS (Calendario del Usuario)
-- =====================================================================
CREATE TABLE citas (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT NOT NULL,
    fecha_hora      DATETIME NOT NULL,
    duracion_min    INT NOT NULL DEFAULT 30,
    motivo          TEXT,
    estado          ENUM('pendiente','confirmada','atendida','cancelada','no_asistio')
                    NOT NULL DEFAULT 'pendiente',
    notas           TEXT,
    creada_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_citas_usuario (usuario_id),
    INDEX idx_citas_fecha (fecha_hora),
    INDEX idx_citas_estado (estado),
    CONSTRAINT fk_citas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. CONVERSACIONES (Chats de IA per Usuario)
-- =====================================================================
CREATE TABLE conversaciones (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      INT NOT NULL,
    titulo          VARCHAR(255),
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conversaciones_usuario (usuario_id),
    CONSTRAINT fk_conversaciones_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 4. MENSAJES_CHAT
-- =====================================================================
CREATE TABLE mensajes_chat (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    conversacion_id INT NOT NULL,
    role            ENUM('user','assistant') NOT NULL,
    contenido       TEXT NOT NULL,
    fecha_envio     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mensajes_conversacion (conversacion_id),
    CONSTRAINT fk_mensajes_conversacion
        FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DATOS DE EJEMPLO
-- =====================================================================

INSERT INTO usuarios (email, password_hash, nombre) VALUES
('admin@medicai.com',    '$2b$12$KIXoL6Jg3fEYI3p9wqZfUuqQ3vH0Jt5L8bN0aXqZzQYjR4q5a0p6S', 'Administrador MedicAI');

INSERT INTO citas (usuario_id, fecha_hora, motivo, estado) VALUES
(1, '2026-04-15 09:00:00', 'Chequeo General Mensual', 'confirmada'),
(1, '2026-04-18 10:00:00', 'Seguimiento', 'pendiente');
