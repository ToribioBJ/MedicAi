# MedicAI

MedicAI es un sistema médico avanzado que integra un backend en Python (FastAPI) y un frontend interactivo en React (Vite + Tailwind CSS).

## ✨ Características Principales

*   **Asistente Médico IA**: Triaje inteligente y pre-evaluación impulsado por Llama-3.3 (vía Groq) que analiza síntomas y da recomendaciones con enfoque médico.
*   **Interacción por Voz**: Dictado integrado (`Speech-to-Text`) para hablarle al chatbot y lectura de respuestas en voz alta (`Text-to-Speech`).
*   **Historial y Calendario**: Manejo automático de sesiones de chat, registro de historial clínico e integración de agenda.
*   **Diseño Dinámico**: Interfaz de usuario moderna impulsada por Tailwind CSS con modos claro y oscuro.
## Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado en tu computadora:
- [Node.js y npm](https://nodejs.org/)
- [Python 3.8+](https://www.python.org/)
- [MySQL](https://www.mysql.com/) en tu máquina local u hosteado.

## ⚙️ Instalación y Configuración

Después de clonar el repositorio, debes configurar tanto el backend como el frontend de forma independiente.

### 1. Configurar el Backend (Python)

1. Abre tu terminal y ve a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Crea un entorno virtual nuevo. Si clonaste el proyecto y por algún error se subió la carpeta `venv`, bórrala y crea una nueva.
   ```bash
   python -m venv venv
   ```
3. Activa el entorno virtual:
   * **Windows:** `.\venv\Scripts\activate` ó `.\venv\Scripts\Activate.ps1`
   * **Mac/Linux:** `source venv/bin/activate`
4. Instala las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```
5. Configura tus variables de entorno secretas. Copia el archivo `backend/.env.example`, pégalo en la misma carpeta, renómbralo como `.env` y rellena con tus credenciales reales (No subas este archivo a Git):
   ```bash
   cp .env.example .env
   ```
6. Puedes ejecutar el servidor backend con:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Configurar el Frontend (React + Vite)

1. Abre una nueva pestaña de la terminal y entra a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias de node:
   ```bash
   npm install
   ```
3. Configura tus variables de entorno creando un archivo local `.env`:
   ```bash
   cp .env.example .env
   ```
4. Inicia el servidor de desarrollo del frontend:
   ```bash
   npm run dev
   ```

## 🔐 Seguridad
**NUNCA** subas tus archivos `.env` a GitHub. Estas configuraciones deben mantenerse en tu ambiente local para proteger tus contraseñas y claves de API.