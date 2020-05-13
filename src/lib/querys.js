const pool = require('../database');
const helpers = require('./helpers');
const querys = {};

// TRABAJADOR
querys.crearTrabajador = async (id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud, trabajador_username, trabajador_password) => {
    try {
        await pool.query('INSERT INTO trabajador(id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_username, trabajador_password) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id_trabajador, trabajador_nombre, trabajador_fechaNacimiento, trabajador_foto, trabajador_documento, trabajador_username, trabajador_password]);
        await pool.query('INSERT INTO direccion VALUES ($1, $2, $3, $4, $5)', [id_trabajador, trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud]);
        return 'success';
    } catch (error) {
        var restriccion = error.constraint;
        return restriccion;
    }
}

querys.laboresSinAgregar = async (id_trabajador) => {
    lista = await (await pool.query('SELECT labor_nombre FROM labor LEFT JOIN (SELECT nombre_labor FROM laborvstrabajador WHERE trabajador_id=$1) AS laboresOf ON labor_nombre = nombre_labor WHERE nombre_labor is null', [id_trabajador])).rows;
    return lista;
}

querys.misLabores = async(id_trabajador) =>  {
    lista = await (await pool.query('SELECT * FROM laborvstrabajador WHERE trabajador_id=$1', [id_trabajador])).rows;
    return lista;
}

querys.addLabor = async(id_trabajador, nombre_labor, precioxhora) => {
    await pool.query('INSERT INTO laborvstrabajador(trabajador_id, nombre_labor, precioxhora) VALUES($1, $2, $3)', [id_trabajador, nombre_labor, precioxhora]);
}

querys.borrarLabor = async(id_traba, id_trabajador) => {
    nombre_labor = await (await pool.query('SELECT nombre_labor FROM laborvstrabajador WHERE id_traba=$1', [id_traba])).rows[0].nombre_labor;
    hayTrabajoActivo = await (await pool.query('SELECT * FROM servicio WHERE nombre_labor=$1 AND trabajador_id=$2 AND servicio_estado=1', [nombre_labor, id_trabajador])).rows;
    if(hayTrabajoActivo.length > 0) {
        return 'failed';
    }else {
        await pool.query('DELETE FROM laborvstrabajador WHERE id_traba=$1', [id_traba]);
        return 'success';
    }
}

querys.laborParaEditar = async(id_traba) => {
    labor = await (await pool.query('SELECT * FROM laborvstrabajador WHERE id_traba=$1', [id_traba])).rows;
    return labor;
}

querys.editarLabor = async(nombre_labor, precioxhora, id_traba, id_trabajador) => {
    hayTrabajoActivo = await (await pool.query('SELECT * FROM servicio WHERE nombre_labor=$1 AND trabajador_id=$2 AND servicio_estado=1', [nombre_labor, id_trabajador])).rows;
    if(hayTrabajoActivo.length > 0) {
        return 'failed';
    }else {
        await pool.query('UPDATE laborvstrabajador SET nombre_labor=$1, precioxhora=$2 WHERE id_traba=$3', [nombre_labor, precioxhora, id_traba]);
        return 'success';
    }
}

querys.trabajadorDisponibilidad = async(id_trabajador) => {
    trabajador = await (await pool.query('SELECT * FROM trabajador WHERE id_trabajador=$1', [id_trabajador])).rows[0];
    return trabajador;
}

querys.trabajosActivos = async(id_trabajador) => {
    trabajos = await (await pool.query('SELECT * FROM servicio JOIN (SELECT * FROM usuario) AS U ON usuario_id=id_usuario WHERE trabajador_id=$1 AND servicio_estado=1', [id_trabajador])).rows;
    return trabajos;
}

querys.detallesTrabajo = async(id_servicio) => {
    servicio = (await pool.query('SELECT * FROM servicio JOIN (SELECT * FROM usuario JOIN (SELECT * FROM direccion) AS D ON id_usuario=id_direccion) AS S ON id_usuario=usuario_id WHERE id_servicio=$1', [id_servicio])).rows[0];
    return servicio;
}

querys.ubicacionTrabajador = async(id_trabajador) => {
    ubicacion = (await pool.query('SELECT direccion_latitud, direccion_longitud FROM direccion WHERE id_direccion=$1', [id_trabajador])).rows;
    return ubicacion;
}

querys.laborPrecio = async(id_trabajador, nombre_labor) => {
    precio = (await pool.query('SELECT precioxhora FROM laborvstrabajador WHERE trabajador_id=$1 AND nombre_labor=$2', [id_trabajador, nombre_labor])).rows[0].precioxhora;
    return precio;
}

querys.trabajoInformacion = async(id_servicio) => {
    servicio = (await pool.query('SELECT * FROM servicio JOIN (SELECT * FROM usuario)AS U ON usuario_numero=usuario_numero WHERE id_servicio=$1', [id_servicio])).rows[0];
    return servicio;
}

querys.culminarTrabajo = async(id_servicio, id_trabajador, pago_valor) => {
    await pool.query('UPDATE servicio SET servicio_estado=2, servicio_final=CURRENT_TIMESTAMP WHERE id_servicio=$1', [id_servicio]);
    await pool.query('UPDATE trabajador SET trabajador_disponibilidad=true WHERE id_trabajador=$1', [id_trabajador]);
    await pool.query('INSERT INTO pago(servicio_id, pago_valor) VALUES ($1, $2)', [id_servicio, pago_valor]);
}

querys.trabajosSinPagar = async(id_trabajador) => {
    trabajos = (await pool.query('SELECT * FROM usuario JOIN (SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON id_servicio=servicio_id) AS S ON id_usuario=usuario_id WHERE trabajador_id=$1 AND servicio_estado=2', [id_trabajador])).rows;
    return trabajos;
}

querys.historialTrabajos = async(id_trabajador) => {
    trabajos = (await pool.query('SELECT * FROM usuario JOIN (SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON id_servicio=servicio_id) AS S ON id_usuario=usuario_id WHERE trabajador_id=$1 AND servicio_estado=3', [id_trabajador])).rows;
    return trabajos;
}

querys.trabajadorPerfil = async(id_trabajador) => {
    const perfil = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM direccion) AS D ON id_trabajador=id_direccion WHERE id_trabajador=$1', [id_trabajador])).rows[0];
    return perfil;
}

querys.actualizarTrabajador = async(trabajador_nombre, trabajador_foto, trabajador_documento, trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud, trabajador_username, id_trabajador) => {
    try {
        await pool.query('UPDATE trabajador SET trabajador_nombre=$1, trabajador_foto=$2, trabajador_documento=$3, trabajador_username=$4 WHERE id_trabajador=$5', [trabajador_nombre, trabajador_foto, trabajador_documento, trabajador_username, id_trabajador]);
        await pool.query('UPDATE direccion SET direccion_address=$1, direccion_localidad=$2, direccion_latitud=$3, direccion_longitud=$4 WHERE id_direccion=$5', [trabajador_direccion, trabajador_localidad, trabajador_latitud, trabajador_longitud, id_trabajador]);
        return 'success';
    } catch (error) {
        return 'error';
    }
}

querys.contraseñaTrabajador = async (trabajador_password, id_trabajador) => {
    await pool.query('UPDATE trabajador SET trabajador_password=$1 WHERE id_trabajador=$2', [trabajador_password, id_trabajador]);
}

querys.borrarTrabajador = async(id_trabajador) => {
    activo = (await pool.query('SELECT * FROM servicio WHERE trabajador_id=$1 AND servicio_estado=1', [id_trabajador])).rows;
    if(activo.length>0){
        return false;
    }else{
        await pool.query('UPDATE trabajador SET eliminado=true WHERE id_trabajador=$1', [id_trabajador]);
        return true;
    }
}


// USUARIO
querys.crearUsuario = async(id_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password) => {
    try {
        await pool.query('INSERT INTO usuario (id_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_email, usuario_numero, usuario_username, usuario_password, usuario_recibo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [id_usuario, usuario_nombre, usuario_fechaNacimiento, usuario_email, usuario_numero, usuario_username, usuario_password, usuario_recibo]);
        await pool.query('INSERT INTO direccion VALUES ($1, $2, $3, $4, $5)', [id_usuario, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud]);
        return 'success';
    } catch (error) {
        restriccion = error.constraint;
        return restriccion;
    }
}

querys.serviciosPorPagar = async(id_usuario) => {
    servicios = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON servicio_id = id_servicio WHERE usuario_id=$1 AND servicio_estado=2)AS S ON id_trabajador=trabajador_id', [id_usuario])).rows;
    return servicios;
}

querys.serviciosDisponibles = async() => {
    servicios = await (await pool.query('SELECT * FROM labor')).rows;
    return servicios;
}

querys.localidadUsuario = async (id_usuario) => {
    localidad = await (await pool.query('SELECT direccion_localidad FROM direccion WHERE id_direccion=$1', [id_usuario])).rows[0].direccion_localidad;
    return localidad;
}

querys.ubicacionUsuario = async(id_usuario) => {
    ubicacion = await (await pool.query('SELECT direccion_latitud, direccion_longitud FROM direccion WHERE id_direccion=$1', [id_usuario])).rows;
    return ubicacion;
}

querys.trabajadoresDisponibles = async(nombre_labor, userLocation) => {
    trabajadores = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM laborvstrabajador JOIN (SELECT * FROM direccion) AS D ON trabajador_id=id_direccion WHERE nombre_labor=$1) AS L ON id_trabajador = trabajador_id WHERE trabajador_disponibilidad=true AND direccion_localidad=$2 AND eliminado=false ORDER BY promedio DESC', [nombre_labor, userLocation])).rows;
    return trabajadores;
}

querys.trabajadorPerfilProfesional = async(nombre_labor, trabajador_id) => {
    trabajador = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM laborvstrabajador JOIN (SELECT * FROM direccion) AS D ON trabajador_id=id_direccion WHERE nombre_labor=$1) AS L ON id_trabajador = trabajador_id WHERE id_trabajador=$2', [nombre_labor, trabajador_id])).rows[0];
    return trabajador;
}

querys.contratarTrabajo = async(nombre_labor, servicio_descipcion, trabajador_id, id_usuario) => {
    const trabajosHastaElMomento = await (await pool.query('SELECT trabajoshechos FROM laborvstrabajador WHERE trabajador_id=$1 AND nombre_labor=$2', [trabajador_id, nombre_labor])).rows;
    const trabajosActualizado = parseInt(trabajosHastaElMomento[0].trabajoshechos)+1;
    await pool.query('INSERT INTO servicio (nombre_labor, servicio_descipcion, usuario_id, trabajador_id) VALUES ($1, $2, $3, $4)', [nombre_labor, servicio_descipcion, id_usuario, trabajador_id]);
    await pool.query('UPDATE trabajador SET trabajador_disponibilidad=false WHERE id_trabajador=$1', [trabajador_id]);
    await pool.query('UPDATE laborvstrabajador SET trabajoshechos=$1 WHERE trabajador_id=$2 AND nombre_labor=$3', [trabajosActualizado, trabajador_id, nombre_labor]);
}

querys.serviciosActivos = async(id_usuario) => {
    servicios = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM servicio) AS S ON id_trabajador=trabajador_id WHERE usuario_id = $1 AND servicio_estado=1', [id_usuario])).rows;
    return servicios;
}

querys.servicioInformacion = async(id_usuario, id_servicio) => {
    servicio = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON servicio_id = id_servicio WHERE usuario_id=$1 AND id_servicio=$2)AS S ON id_trabajador=trabajador_id', [id_usuario, id_servicio])).rows[0];
    return servicio;
}

querys.pagarServicio = async(trabajador_id, id_servicio, nombre_labor, calificacion) => {
    const numeros = await (await pool.query('SELECT calificaciones, trabajoshechos FROM laborvstrabajador WHERE trabajador_id=$1 AND nombre_labor=$2', [trabajador_id, nombre_labor])).rows[0];
    const trabajador_calificaciones = parseInt(numeros.calificaciones) + parseInt(calificacion);
    const trabajador_trabajosHechos = parseInt(numeros.trabajoshechos);
    const trabajador_promedio = (trabajador_calificaciones / trabajador_trabajosHechos).toFixed(1);
    await pool.query('UPDATE laborvstrabajador SET promedio=$1, calificaciones=$2 WHERE trabajador_id=$3 AND nombre_labor=$4', [trabajador_promedio, trabajador_calificaciones, trabajador_id, nombre_labor]);
    await pool.query('UPDATE servicio SET servicio_estado=3, servicio_calificacion=$1 WHERE id_servicio=$2', [calificacion, id_servicio]);
    await pool.query('UPDATE pago SET pago_estado=true, pago_fecha=CURRENT_TIMESTAMP WHERE servicio_id=$1', [id_servicio]);
}

querys.historialServicios = async(id_usuario) => {
    servicios = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON servicio_id = id_servicio WHERE usuario_id=$1 AND servicio_estado=3)AS S ON id_trabajador=trabajador_id', [id_usuario])).rows;
    return servicios;
}

querys.usuarioPerfil = async(id_usuario) => {
    datos = await (await pool.query('SELECT * FROM usuario JOIN (SELECT * FROM direccion) AS D ON id_usuario=id_direccion WHERE id_usuario=$1', [id_usuario])).rows[0];
    return datos;
}

querys.actualizarUsuario = async(id_usuario, usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username) => {
    try {
        await pool.query('UPDATE usuario SET usuario_nombre=$1, usuario_email=$2, usuario_numero=$3, usuario_username=$4, usuario_recibo=$5 WHERE id_usuario=$6', [usuario_nombre, usuario_email, usuario_numero, usuario_username, usuario_recibo, id_usuario]);
        await pool.query('UPDATE direccion SET direccion_address=$1, direccion_localidad=$2, direccion_latitud=$3, direccion_longitud=$4 WHERE id_direccion=$5', [usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, id_usuario]);
        return 'success';
    } catch (error) {
        var restriccion = error.constraint;
        return restriccion;
    }
}

querys.contraseñaUsuario = async (usuario_password, id_usuario) => {
    await pool.query('UPDATE usuario SET usuario_password=$1 WHERE id_usuario=$2', [usuario_password, id_usuario]);
}

querys.borrarUsuario = async(id_usuario) => {
    activo = (await pool.query('SELECT * FROM servicio WHERE usuario_id=$1 AND servicio_estado=1 OR servicio_estado=2', [id_usuario])).rows;
    if(activo.length>0){
        return false;
    }else{
        await pool.query('UPDATE usuario SET eliminado=true WHERE id_usuario=$1', [id_usuario]);
        return true;
    }
}

module.exports = querys;