-- =====================================================================
-- MedicAI - Script de Migración y Actualización de Base de Datos
-- =====================================================================

USE medicai;

-- 1. Agregar columnas a la tabla de usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'usuario';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verified TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255) NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS verification_token_expiration DATETIME NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255) NULL;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS reset_password_token_expiration DATETIME NULL;
-- 1.1 Crear tabla para usuarios de Telegram
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

-- 2. Asegurar que el usuario administrador por defecto sea administrador verificado
UPDATE usuarios 
SET role = 'administrador', email_verified = 1 
WHERE email = 'admin@medicai.com';

-- 3. Agregar columna de imagen a la tabla de mensajes_chat
ALTER TABLE mensajes_chat ADD COLUMN IF NOT EXISTS imagen LONGTEXT NULL;
