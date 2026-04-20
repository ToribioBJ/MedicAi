-- Migración v2: Soporte para Chatbot Conversacional Persistente
USE medicai;

CREATE TABLE IF NOT EXISTS conversaciones (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id     INT NULL,
    titulo          VARCHAR(255),
    fecha_creacion  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_conv_paciente (paciente_id),
    CONSTRAINT fk_conv_paciente
        FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mensajes_chat (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    conversacion_id INT NOT NULL,
    role            ENUM('user', 'assistant') NOT NULL,
    contenido       TEXT NOT NULL,
    fecha_envio     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_msg_conv (conversacion_id),
    CONSTRAINT fk_msg_conv
        FOREIGN KEY (conversacion_id) REFERENCES conversaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
