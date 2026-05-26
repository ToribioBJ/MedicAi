import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:@localhost:3306/medicai"
)

# Intentar crear la base de datos automáticamente si no existe
try:
    if "/" in DATABASE_URL:
        base_url, db_name = DATABASE_URL.rsplit('/', 1)
        # Asegurar que no esté vacía la base de datos
        if db_name and "?" in db_name:
            db_name = db_name.split("?")[0]
        if db_name:
            temp_engine = create_engine(base_url, pool_pre_ping=True)
            with temp_engine.connect() as conn:
                conn.execution_options(isolation_level="AUTOCOMMIT").execute(
                    text(f"CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
                )
            temp_engine.dispose()
except Exception as e:
    print(f">>> Advertencia al verificar/crear la base de datos: {e}")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,
)

# Migración automática de columnas para la tabla usuarios
try:
    with engine.connect() as conn:
        for col_def in [
            "role VARCHAR(50) NOT NULL DEFAULT 'usuario'",
            "email_verified TINYINT(1) NOT NULL DEFAULT 0",
            "verification_token VARCHAR(255) NULL",
            "verification_token_expiration DATETIME NULL",
            "reset_password_token VARCHAR(255) NULL",
            "reset_password_token_expiration DATETIME NULL"
        ]:
            col_name = col_def.split()[0]
            try:
                # Comprobar si la columna ya existe para evitar warnings innecesarios
                # Ejecutar ALTER TABLE de forma tolerante a fallos
                conn.execute(text(f"ALTER TABLE usuarios ADD COLUMN {col_def}"))
                conn.commit()
                print(f">>> Columna agregada con éxito en la migración: {col_name}")
            except Exception:
                # La columna probablemente ya existe
                pass
except Exception as migration_err:
    print(f">>> Advertencia en la migración de columnas: {migration_err}")

# Migración automática de columnas para la tabla mensajes_chat
try:
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE mensajes_chat ADD COLUMN imagen LONGTEXT NULL"))
            conn.commit()
            print(">>> Columna 'imagen' agregada con éxito en la migración de mensajes_chat")
        except Exception:
            pass
except Exception as migration_err:
    print(f">>> Advertencia en la migración de mensajes_chat: {migration_err}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
