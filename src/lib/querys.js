const pool = require('../database');
const querys = {};


// TRABAJADOR

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

querys.borrarLabor = async(id_traba) => {
    await pool.query('DELETE FROM laborvstrabajador WHERE id_traba=$1', [id_traba]);
}

querys.laborParaEditar = async(id_traba) => {
    labor = await (await pool.query('SELECT * FROM laborvstrabajador WHERE id_traba=$1', [id_traba])).rows;
    return labor;
}

querys.editarLabor = async(nombre_labor, precioxhora, id_traba) => {
    await pool.query('UPDATE laborvstrabajador SET nombre_labor=$1, precioxhora=$2 WHERE id_traba=$3', [nombre_labor, precioxhora, id_traba]);
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

querys.servicioInformacion = async(id_servicio) => {
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

querys.borrarTrabajador = async(id_trabajador) => {
    await pool.query('UPDATE trabajador SET eliminado=true WHERE id_trabajador=$1', [id_trabajador]);
}

module.exports = querys;