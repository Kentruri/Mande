CREATE DATABASE Mande;

-- TABLA LABOR
CREATE TABLE labor(
    labor_nombre VARCHAR(40) PRIMARY KEY 
);

-- TABLA TRABAJADOR
CREATE TABLE trabajador(
    id_trabajador NUMERIC PRIMARY KEY NOT NULL,
    trabajador_nombre VARCHAR(60) NOT NULL,
    trabajador_fechaNacimiento DATE NOT NULL,
    trabajador_foto TEXT NOT NULL,
    trabajador_documento TEXT NOT NULL,
    trabajador_direccion TEXT NOT NULL,
    trabajador_latitud NUMERIC NOT NULL,
    trabajador_longitud NUMERIC NOT NULL,
    trabajador_disponibilidad BOOLEAN NOT NULL DEFAULT 'true',
    trabajador_calificaciones NUMERIC NOT NULL DEFAULT 0,
    trabajador_trabajosHechos NUMERIC NOT NULL DEFAULT 0,
    trabajador_puntaje NUMERIC NOT NULL DEFAULT 0,
    trabajador_username VARCHAR(40) UNIQUE,
    trabajador_password VARCHAR(40)
);

-- RELACIÓN LABOR-TRABAJADOR
CREATE TABLE laborVStrabajador(
    id_traba SERIAL,
    trabajador_id NUMERIC,
    nombre_labor VARCHAR(40) REFERENCES labor(labor_nombre),
    precioxhora NUMERIC NOT NULL
);

-- TABLA USUARIO 
CREATE TABLE usuario(
    numero_usuario NUMERIC PRIMARY KEY,
    usuario_nombre VARCHAR(60) NOT NULL,
    usuario_fechaNacimiento DATE NOT NULL,
    usuario_direccion TEXT NOT NULL,
    usuario_latitud NUMERIC NOT NULL,
    usuario_longitud NUMERIC NOT NULL,
    usuario_recibo TEXT NOT NULL,
    usuario_email VARCHAR NOT NULL UNIQUE,
    usuario_username VARCHAR(40) UNIQUE,
    usuario_password VARCHAR(40),
    usuario_numCard TEXT
);

CREATE TABLE servicio(
    id_servicio SERIAL,
    nombre_labor VARCHAR(40),
    servicio_descipcion TEXT,
    usuario_numero NUMERIC,
    usuario_nombre VARCHAR(40),
    trabajador_id NUMERIC REFERENCES trabajador(id_trabajador),
    trabajador_nombre VARCHAR(40),
    servicio_fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    servicio_estado INTEGER NOT NULL DEFAULT 1
);

-- LISTA PREDEFINIDA DE LABORES
INSERT INTO labor(labor_nombre) VALUES
    ('Plomero'),
    ('Cerrajero'),
    ('Profesor de Inglés'),
    ('Paseador de perros');