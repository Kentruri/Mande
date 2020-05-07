const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');
const helpers = require('../lib/helpers');
const { isLoggedInUser, isNotLoggedInUser } = require('../lib/auth');

// REGISTRO 
router.get('/registro', isNotLoggedInUser, (req, res) => {
    res.render('usuario/registro');
});

router.post('/registro', passport.authenticate('usuario.signup',
    {
        successRedirect: '/usuario/tipo-servicio',
        failureRedirect: '/usuario/registro',
        failureFlash: true
    }));

// INICIO DE SESIÓN
router.get('/inicio-sesion', isNotLoggedInUser, (req, res) => {
    res.render('usuario/inicio');
});

router.post('/inicio-sesion', (req, res, next) => {
    passport.authenticate('usuario.signin',
        {
            successRedirect: '/usuario/ingreso',
            failureRedirect: '/usuario/inicio-sesion',
            failureFlash: true
        })(req, res, next);
});

// ESCOGER TIPO DE SERVICIO
router.get('/tipo-servicio', isLoggedInUser, async (req, res, done) => {
    const deuda = await (await pool.query('SELECT servicio_estado FROM servicio WHERE usuario_id=$1 AND servicio_estado=2', [req.user.id_usuario])).rows;
    const labores = await (await pool.query('SELECT * FROM labor')).rows;
    if (deuda.length > 0) {
        done(null, req.flash('success', 'No puedes solicitar servicios mientras tengas pagos pendientes'));
        res.redirect('/usuario/servicios-pagar');
    } else {
        res.render('usuario/tipoServicio', { labores });
    }
});

router.post('/tipo-servicio', async (req, res) => {
    const { nombre_labor, servicio_descipcion } = req.body;
    const userLocation = await (await pool.query('SELECT direccion_localidad FROM direccion WHERE id_direccion=$1', [req.user.usuario_numero])).rows[0].direccion_localidad;
    const userUbication = await (await pool.query('SELECT direccion_latitud, direccion_longitud FROM direccion WHERE id_direccion=$1', [req.user.usuario_numero])).rows;
    const trabajadores = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM laborvstrabajador JOIN (SELECT * FROM direccion) AS D ON trabajador_id=id_direccion WHERE nombre_labor=$1) AS L ON id_trabajador = trabajador_id WHERE trabajador_disponibilidad=true AND direccion_localidad=$2 ORDER BY promedio DESC', [nombre_labor, userLocation])).rows;
    res.render('usuario/trabajadores', { nombre_labor: nombre_labor, servicio_descipcion: servicio_descipcion, userUbication: userUbication[0], trabajadores });
});

//PERFIL DE UN TRABAJADOR
router.get('/trabajador-perfil/:trabajador_id/:nombre_labor/:servicio_descipcion', isLoggedInUser, async (req, res) => {
    const { trabajador_id, nombre_labor, servicio_descipcion } = req.params;
    const userUbication = await (await pool.query('SELECT direccion_latitud, direccion_longitud FROM direccion WHERE id_direccion=$1', [req.user.usuario_numero])).rows[0];
    const trabajador = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM laborvstrabajador JOIN (SELECT * FROM direccion) AS D ON trabajador_id=id_direccion WHERE nombre_labor=$1) AS L ON id_trabajador = trabajador_id WHERE id_trabajador=$2', [nombre_labor, trabajador_id])).rows[0];
    res.render('usuario/trabajadorPerfil', { nombre_labor: nombre_labor, servicio_descipcion: servicio_descipcion, userUbication: userUbication, trabajador });
});

// CONTRATAR TRABAJADOR
router.get('/contratar-trabajador/:trabajador_id/:nombre_labor/:servicio_descipcion', isLoggedInUser, async (req, res, done) => {
    const { trabajador_id, nombre_labor, servicio_descipcion } = req.params;
    const usuario_numero = req.user.usuario_numero;
    const trabajosHastaElMomento = await (await pool.query('SELECT trabajoshechos FROM laborvstrabajador WHERE trabajador_id=$1 AND nombre_labor=$2', [trabajador_id, nombre_labor])).rows;
    const trabajosActualizado = parseInt(trabajosHastaElMomento[0].trabajoshechos) + 1;
    await pool.query('INSERT INTO servicio (nombre_labor, servicio_descipcion, usuario_id, trabajador_id) VALUES ($1, $2, $3, $4)', [nombre_labor, servicio_descipcion, usuario_numero, trabajador_id]);
    await pool.query('UPDATE trabajador SET trabajador_disponibilidad=false WHERE id_trabajador=$1', [trabajador_id]);
    await pool.query('UPDATE laborvstrabajador SET trabajoshechos=$1 WHERE trabajador_id=$2 AND nombre_labor=$3', [trabajosActualizado, trabajador_id, nombre_labor]);
    done(null, req.flash('success', 'Trabajador contratado!'));
    res.redirect('/usuario/servicios-activos');
});

// SERVIVICIOS ACTIVOS
router.get('/servicios-activos', isLoggedInUser, async (req, res) => {
    const num_usuario = req.user.usuario_numero;
    const servicios = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM servicio) AS S ON id_trabajador=trabajador_id WHERE usuario_id = $1 AND servicio_estado=1', [num_usuario])).rows;
    res.render('usuario/serviciosActivos', { servicios });
});

// SERVICIOS POR PAGAR
router.get('/servicios-pagar', isLoggedInUser, async (req, res) => {
    const servicios = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON servicio_id = id_servicio WHERE usuario_id=$1 AND servicio_estado=2)AS S ON id_trabajador=trabajador_id', [req.user.id_usuario])).rows;
    res.render('usuario/serviciosPagar', { servicios });
});

// PAGAR SERVICIO
router.get('/pagar-servicio/:id_servicio/:id_pago/:trabajador_id/:nombre_labor', isLoggedInUser, async (req, res) => {
    const { id_servicio, id_pago, trabajador_id } = req.params;
    const servicio = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON servicio_id = id_servicio WHERE usuario_id=$1 AND id_servicio=$2)AS S ON id_trabajador=trabajador_id', [req.user.id_usuario, id_servicio])).rows[0];
    res.render('usuario/pagarServicio', { servicio });
});

router.post('/pagar-servicio/:id_servicio/:id_pago/:trabajador_id/:nombre_labor', async (req, res, done) => {
    const { id_servicio, id_pago, trabajador_id, nombre_labor } = req.params;
    const { calificacion } = req.body;
    const numeros = await (await pool.query('SELECT calificaciones, trabajoshechos FROM laborvstrabajador WHERE trabajador_id=$1 AND nombre_labor=$2', [trabajador_id, nombre_labor])).rows[0];
    const trabajador_calificaciones = parseInt(numeros.calificaciones) + parseInt(calificacion);
    const trabajador_trabajosHechos = parseInt(numeros.trabajoshechos);
    const trabajador_promedio = (trabajador_calificaciones / trabajador_trabajosHechos).toFixed(1);
    await pool.query('UPDATE laborvstrabajador SET promedio=$1, calificaciones=$2 WHERE trabajador_id=$3 AND nombre_labor=$4', [trabajador_promedio, trabajador_calificaciones, trabajador_id, nombre_labor]);
    await pool.query('UPDATE servicio SET servicio_estado=3, servicio_calificacion=$1 WHERE id_servicio=$2', [calificacion, id_servicio]);
    await pool.query('UPDATE pago SET pago_estado=true, pago_fecha=CURRENT_TIMESTAMP WHERE servicio_id=$1', [id_servicio]);
    done(null, req.flash('success', 'Pago exitoso!'));
    res.redirect('/usuario/servicios-historial');
});

// SERVIVICIOS PAGADOS
router.get('/servicios-historial', isLoggedInUser, async (req, res) => {
    const num_usuario = req.user.id_usuario;
    const servicios = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON servicio_id = id_servicio WHERE usuario_id=$1 AND servicio_estado=3)AS S ON id_trabajador=trabajador_id', [num_usuario])).rows;
    res.render('usuario/serviciosHistorial', { servicios });
});

// PERFIL 
router.get('/ingreso', isLoggedInUser, async (req, res, done) => {
    const usuario_numero = req.user.id_usuario;
    const deuda = await (await pool.query('SELECT servicio_estado FROM servicio WHERE usuario_id=$1 AND servicio_estado=2', [usuario_numero])).rows;
    const rows = await (await pool.query('SELECT * FROM usuario WHERE usuario_numero=$1', [usuario_numero])).rows;
    const user = rows[0];

    if (deuda.length > 0) {
        done(null, user, req.flash('success', '¡' + user.usuario_nombre + '! Tienes un pago pendiente'));
        res.redirect('/usuario/servicios-pagar');
    } else {
        done(null, user, req.flash('success', 'Bienvenido ' + user.usuario_nombre));
        res.redirect('/usuario/servicios-activos');
    }

});

router.get('/perfil', isLoggedInUser, async (req, res, done) => {
    const user = await (await pool.query('SELECT * FROM usuario JOIN (SELECT * FROM direccion) AS D ON id_usuario=id_direccion WHERE usuario_numero=$1', [req.user.id_usuario])).rows[0];
    console.log(user);
    res.render('usuario/perfil', { user });
});

router.post('/perfil', async (req, res, done) => {
    const id_usuario = req.user.id_usuario;
    const { usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password, usuario_numCard } = req.body;
    const newUser = {usuario_nombre, usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, usuario_recibo, usuario_email, usuario_numero, usuario_username, usuario_password, usuario_numCard};
    newUser.usuario_numCard = await helpers.encryptNumCard(usuario_numCard);
    await pool.query('UPDATE usuario SET usuario_nombre=$1, usuario_email=$2, usuario_numero=$3, usuario_username=$4, usuario_password=$5, usuario_numCard=$6, usuario_recibo=$7 WHERE id_usuario=$8', [usuario_nombre, usuario_email, usuario_numero, usuario_username, usuario_password, newUser.usuario_numCard, usuario_recibo, id_usuario]);
    await pool.query('UPDATE direccion SET direccion_address=$1, direccion_localidad=$2, direccion_latitud=$3, direccion_longitud=$4 WHERE id_direccion=$5', [usuario_direccion, usuario_localidad, usuario_latitud, usuario_longitud, id_usuario]);
    done(null, req.flash('success', 'Actualización exitosa!'));
    res.redirect('/usuario/perfil');
});

router.get('/borrar-cuenta', isLoggedInUser, async (req, res, done) => {
    await pool.query('UPDATE usuario SET eliminado=true WHERE id_usuario=$1', [req.user.id_usuario]);
    console.log(req.user.fechanacimiento);
    res.redirect('/usuario/cerrar-sesion');
});

// CERRAR SESIÓN
router.get('/cerrar-sesion', isLoggedInUser, (req, res) => {
    req.logOut();
    res.redirect('/');
});

module.exports = router;