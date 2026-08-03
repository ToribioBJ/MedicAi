-- =====================================================================
-- MedicAI - Base de Datos Unificada para Producción (MySQL 8.0+)
-- =====================================================================

-- Nota: Si importas en Clever Cloud u otro hosting administrado, 
-- no es necesario ejecutar CREATE DATABASE ni USE, ya que el hosting 
-- te asigna una base de datos con un nombre predefinido.

-- =====================================================================
-- 1. USUARIOS
-- =====================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(150) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    nombre          VARCHAR(150) NOT NULL,
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    role            VARCHAR(50) NOT NULL DEFAULT 'usuario',
    email_verified  TINYINT(1) NOT NULL DEFAULT 0,
    verification_token VARCHAR(255) NULL,
    verification_token_expiration DATETIME NULL,
    reset_password_token VARCHAR(255) NULL,
    reset_password_token_expiration DATETIME NULL,
    fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 2. USUARIOS TELEGRAM
-- =====================================================================
CREATE TABLE IF NOT EXISTS telegram_users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    telegram_chat_id VARCHAR(100) UNIQUE NOT NULL,
    username        VARCHAR(150) NULL,
    first_name      VARCHAR(150) NULL,
    last_name       VARCHAR(150) NULL,
    usuario_id      INT NOT NULL,
    telegram_linking_code VARCHAR(10) NULL,
    telegram_linking_code_expiration DATETIME NULL,
    telegram_linking_email VARCHAR(150) NULL,
    fecha_registro  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_telegram_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- 3. CONVERSACIONES (Chats de IA por Usuario)
-- =====================================================================
CREATE TABLE IF NOT EXISTS conversaciones (
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
CREATE TABLE IF NOT EXISTS mensajes_chat (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    conversacion_id INT NOT NULL,
    role            ENUM('user','assistant') NOT NULL,
    contenido       TEXT NOT NULL,
    imagen          LONGTEXT NULL,
    tokens          INT NOT NULL DEFAULT 0,
    fecha_envio     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_mensajes_conversacion (conversacion_id),
    CONSTRAINT fk_mensajes_conversacion
        FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- DATOS DE EJEMPLO
-- =====================================================================

-- Insertar administrador por defecto
INSERT INTO usuarios (email, password_hash, nombre, role, email_verified) 
VALUES ('admin@medicai.com', '$2b$12$KIXoL6Jg3fEYI3p9wqZfUuqQ3vH0Jt5L8bN0aXqZzQYjR4q5a0p6S', 'Administrador MedicAI', 'administrador', 1)
ON DUPLICATE KEY UPDATE role='administrador', email_verified=1;
