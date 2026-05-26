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

-- 2. Asegurar que el usuario administrador por defecto sea administrador verificado
UPDATE usuarios 
SET role = 'administrador', email_verified = 1 
WHERE email = 'admin@medicai.com';
