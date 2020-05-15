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
    trabajador_password TEXT,
    eliminado BOOLEAN NOT NULL DEFAULT 'false'
);

-- RELACIÓN LABOR-TRABAJADOR
CREATE TABLE laborvstrabajador(
    id_traba SERIAL PRIMARY KEY,
    trabajador_id NUMERIC,
    nombre_labor VARCHAR(40) NOT NULL,
    precioxhora NUMERIC NOT NULL,
    calificaciones NUMERIC NOT NULL DEFAULT 0,
    trabajoshechos NUMERIC NOT NULL DEFAULT 0,
    promedio  NUMERIC NOT NULL DEFAULT 0
);

-- TABLA DIRECCION
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
    usuario_password TEXT,
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

-- TABLA PAGO
CREATE TABLE pago(
    id_pago SERIAL PRIMARY KEY,
    servicio_id INTEGER REFERENCES servicio(id_servicio),
    pago_valor NUMERIC,
    pago_estado BOOLEAN NOT NULL DEFAULT 'FALSE',
    pago_fecha TIMESTAMP
);

-- TABLA AUDITORIA
CREATE TABLE tbl_audit (
	Id SERIAL PRIMARY KEY,
	table_name VARCHAR(30),
	operation CHAR(1),
	old_value TEXT,
	new_value TEXT,
	user_name VARCHAR(30),
	date_oper TIMESTAMP WITHOUT TIME ZONE);

-- FUNCION DE LA TABLA AUDITORIA
CREATE OR REPLACE FUNCTION regis_audit() RETURNS TRIGGER AS $$
            
            BEGIN
            
            IF(TG_OP = 'DELETE') THEN
             INSERT INTO tbl_audit (table_name, operation, old_value, new_value, user_name, date_oper)
             VALUES(TG_TABLE_NAME, 'D', OLD, NULL, USER, now());
             RETURN OLD;
            END IF;
            IF(TG_OP = 'UPDATE') THEN
             INSERT INTO tbl_audit (table_name, operation, old_value, new_value, user_name, date_oper)
             VALUES(TG_TABLE_NAME, 'U', OLD, NEW, USER, now());
             RETURN NEW;
            END IF;
            IF(TG_OP = 'INSERT') THEN
             INSERT INTO tbl_audit (table_name, operation, old_value, new_value, user_name, date_oper)
             VALUES(TG_TABLE_NAME, 'I', NULL, NEW, USER, now());
             RETURN NEW;
            END IF;
            RETURN NULL;
            
            END
            $$ LANGUAGE plpgsql;

--TRIGGERS DE TABLA AUDITORIA X TODO LO DEMÁS
CREATE TRIGGER tbl_usuario_tbl_audit AFTER INSERT OR UPDATE OR DELETE ON usuario FOR EACH ROW EXECUTE PROCEDURE regis_audit();
CREATE TRIGGER tbl_trabajador_tbl_audit AFTER INSERT OR UPDATE OR DELETE ON trabajador FOR EACH ROW EXECUTE PROCEDURE regis_audit();
CREATE TRIGGER tbl_labor_tbl_audit AFTER INSERT OR UPDATE OR DELETE ON labor FOR EACH ROW EXECUTE PROCEDURE regis_audit();
CREATE TRIGGER tbl_servicio_tbl_audit AFTER INSERT OR UPDATE OR DELETE ON servicio FOR EACH ROW EXECUTE PROCEDURE regis_audit();
CREATE TRIGGER tbl_pago_tbl_audit AFTER INSERT OR UPDATE OR DELETE ON pago FOR EACH ROW EXECUTE PROCEDURE regis_audit();
CREATE TRIGGER tbl_direccion_tbl_audit AFTER INSERT OR UPDATE OR DELETE ON direccion FOR EACH ROW EXECUTE PROCEDURE regis_audit();
CREATE TRIGGER tbl_lvst_tbl_audit AFTER INSERT OR UPDATE OR DELETE ON laborvstrabajador FOR EACH ROW EXECUTE PROCEDURE regis_audit();
--CREATE TRIGGER tbl_lvstid_tbl_audit AFTER INSERT OR UPDATE OR DELETE ON laborvstrabajador_id_traba_seq FOR EACH ROW EXECUTE PROCEDURE regis_audit();
--CREATE TRIGGER tbl_pagoid_tbl_audit AFTER INSERT OR UPDATE OR DELETE ON pago_id_pago_seq FOR EACH ROW EXECUTE PROCEDURE regis_audit();
--CREATE TRIGGER tbl_servicioid_tbl_audit AFTER INSERT OR UPDATE OR DELETE ON servicio_id_servicio_seq FOR EACH ROW EXECUTE PROCEDURE regis_audit();

-- LISTA PREDEFINIDA DE LABORES
INSERT INTO labor(labor_nombre) VALUES
    ('Plomero'),
    ('Cerrajero'),
    ('Profesor de Ingles'),
    ('Paseador de perros'),
    ('Cocinero');