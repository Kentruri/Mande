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
    trabajador_disponibilidad BOOLEAN NOT NULL DEFAULT 'true',
    trabajador_username VARCHAR(40) UNIQUE,
    trabajador_password VARCHAR(40),
    eliminado BOOLEAN NOT NULL DEFAULT 'false'
);

-- RELACIÓN LABOR-TRABAJADOR
CREATE TABLE laborvstrabajador(
    id_traba SERIAL PRIMARY KEY,
    trabajador_id NUMERIC,
    nombre_labor VARCHAR(40),
    precioxhora NUMERIC NOT NULL,
    calificaciones NUMERIC NOT NULL DEFAULT 0,
    trabajoshechos NUMERIC NOT NULL DEFAULT 0,
    promedio  NUMERIC NOT NULL DEFAULT 0
);

CREATE TABLE direccion(
    id_direccion NUMERIC NOT NULL,
    direccion_address TEXT NOT NULL,
    direccion_localidad TEXT NOT NULL,
    direccion_latitud NUMERIC NOT NULL,
    direccion_longitud NUMERIC NOT NULL
);

-- TABLA USUARIO 
CREATE TABLE usuario(
    id_usuario NUMERIC PRIMARY KEY,
    usuario_nombre VARCHAR(60) NOT NULL,
    usuario_fechaNacimiento DATE NOT NULL,
    usuario_email VARCHAR NOT NULL UNIQUE,
    usuario_numero NUMERIC UNIQUE,
    usuario_username VARCHAR(40) UNIQUE,
    usuario_password VARCHAR(40),
    usuario_numCard TEXT,
    usuario_recibo TEXT NOT NULL,
    eliminado BOOLEAN NOT NULL DEFAULT 'false'
);

CREATE TABLE servicio(
    id_servicio SERIAL PRIMARY KEY,
    nombre_labor VARCHAR(40),
    servicio_descipcion TEXT,
    usuario_id NUMERIC,
    trabajador_id NUMERIC REFERENCES trabajador(id_trabajador),
    servicio_inicio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    servicio_final TIMESTAMP, 
    servicio_estado INTEGER NOT NULL DEFAULT 1,
    servicio_calificacion NUMERIC
);

CREATE TABLE pago(
    id_pago SERIAL PRIMARY KEY,
    servicio_id INTEGER REFERENCES servicio(id_servicio),
    pago_valor NUMERIC,
    pago_estado BOOLEAN NOT NULL DEFAULT 'FALSE',
    pago_fecha TIMESTAMP
);

-- LISTA PREDEFINIDA DE LABORES
INSERT INTO labor(labor_nombre) VALUES
    ('Plomero'),
    ('Cerrajero'),
    ('Profesor de Ingles'),
    ('Paseador de perros'),
    ('Cocinero');