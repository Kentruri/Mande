const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');

// REGISTRO 
router.get('/registro', (req, res) => {
    res.render('usuario/registro');
});

router.post('/registro', passport.authenticate('usuario.signup',
    {
        successRedirect: '/usuario/tipo-servicio',
        failureRedirect: '/usuario/registro',
        failureFlash: true
    }));

// INICIO DE SESIÓN
router.get('/inicio-sesion', (req, res) => {
    res.render('usuario/inicio');
});

router.post('/inicio-sesion', (req, res, next) => {
    passport.authenticate('usuario.signin',
        {
            successRedirect: '/usuario/perfil',
            failureRedirect: '/usuario/inicio-sesion',
            failureFlash: true
        })(req, res, next);
});

// ESCOGER TIPO DE SERVICIO
router.get('/tipo-servicio', async (req, res) => {
    const labores = await (await pool.query('SELECT * FROM labor')).rows;
    res.render('usuario/tipoServicio', { labores });
});

router.post('/tipo-servicio', async (req, res) => {
    const { nombre_labor } = req.body;
    const {servicio_descipcion}= req.body;
    const numUser = req.user.numero_usuario;
    const userLocation = await (await pool.query('SELECT usuario_localidad FROM usuario WHERE numero_usuario=$1', [numUser])).rows[0].usuario_localidad;
    console.log(userLocation);
    const userUbication = await (await pool.query('SELECT usuario_latitud, usuario_longitud FROM usuario WHERE numero_usuario=$1', [numUser])).rows;
    const trabajadores = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM laborvstrabajador WHERE nombre_labor=$1) AS L ON id_trabajador = trabajador_id WHERE trabajador_disponibilidad=true AND trabajador_localidad=$2 ORDER BY trabajador_puntaje DESC', [nombre_labor, userLocation])).rows;
    res.render('usuario/trabajadores', {nombre_labor: nombre_labor, servicio_descipcion: servicio_descipcion, userUbication: userUbication[0], trabajadores});
});

// SERVIVICIOS ACTIVOS
router.get('/servicios-activos', async (req, res) => {
    const num_usuario = req.user.numero_usuario;
    const servicios = await (await pool.query('SELECT * FROM servicio WHERE usuario_numero = $1 AND servicio_estado=1', [num_usuario])).rows;
    res.render('usuario/serviciosActivos', {servicios});
});

// SERVICIOS POR PAGAR
router.get('/servicios-pagar', async (req, res) => {
    const num_usuario = req.user.numero_usuario;
    const servicios = await (await pool.query('SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON servicio_id = id_servicio WHERE usuario_numero=$1 AND servicio_estado=2', [num_usuario])).rows;
    res.render('usuario/serviciosPagar', {servicios});
});

// PAGAR SERVICIO
router.get('/pagar-servicio/:id_servicio/:id_pago/:trabajador_id', async (req, res) => {
    const {id_servicio, id_pago, trabajador_id} = req.params;
    const servicio = await (await pool.query('SELECT * FROM servicio JOIN (SELECT * FROM pago) AS P ON servicio_id = id_servicio WHERE usuario_numero=$1 AND id_servicio=$2', [req.user.numero_usuario, id_servicio])).rows[0];
    res.render('usuario/pagarServicio', {servicio});
});

router.post('/pagar-servicio/:id_servicio/:id_pago/:trabajador_id', async (req, res) => {
    res.redirect('/usuario/servicios-pagar');
    const {id_servicio, id_pago, trabajador_id} = req.params;
    const {calificacion} = req.body;

    console.log(calificacion);
   
});

// CONTRATAR TRABAJADOR
router.get('/contratar-trabajador/:trabajador_id/:trabajador_nombre/:nombre_labor/:servicio_descipcion', async (req, res) => {
    const {trabajador_id, nombre_labor, trabajador_nombre, servicio_descipcion}=req.params;
    const usuario_numero = req.user.numero_usuario;
    const nombre_usuario = await (await pool.query('SELECT usuario_nombre FROM usuario WHERE numero_usuario=$1', [usuario_numero])).rows[0].usuario_nombre;
    await pool.query('INSERT INTO servicio (nombre_labor, servicio_descipcion, usuario_numero, usuario_nombre, trabajador_id, trabajador_nombre) VALUES ($1, $2, $3, $4, $5, $6)', [nombre_labor, servicio_descipcion, usuario_numero, nombre_usuario, trabajador_id, trabajador_nombre]);
    const trabajitos = await (await pool.query('SELECT trabajador_trabajosHechos FROM trabajador WHERE id_trabajador=$1', [trabajador_id])).rows;
    const trabajotes = parseInt(trabajitos[0].trabajador_trabajoshechos)+1;
    await pool.query('UPDATE trabajador SET trabajador_disponibilidad=false, trabajador_trabajosHechos=$1 WHERE id_trabajador=$2', [trabajotes, trabajador_id]);
    res.redirect('/usuario/servicios-activos');
});

// PERFIL 
router.get('/perfil', async (req, res, done) => {
    const usuario_numero = req.user.numero_usuario;
    const deuda = await (await pool.query('SELECT servicio_estado FROM servicio WHERE usuario_numero=$1 AND servicio_estado=2', [usuario_numero])).rows; 
    const rows = await (await pool.query('SELECT * FROM usuario WHERE numero_usuario=$1', [usuario_numero])).rows;
    const user = rows[0];
   
    
    if(deuda.length > 0)
    {
        done(null, user, req.flash('success','¡' + user.usuario_nombre + '! Tienes un pago pendiente'));
    }else
    {
        done(null, user, req.flash('success','Bienvenido ' + user.usuario_nombre));
    }
    res.redirect('/usuario/servicios-activos');
    
});

module.exports = router;