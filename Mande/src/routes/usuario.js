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
            successRedirect: '/usuario/mis-servicios',
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
    const userUbication = await (await pool.query('SELECT usuario_latitud, usuario_longitud FROM usuario WHERE numero_usuario=$1', [numUser])).rows;
    const trabajadores = await (await pool.query('SELECT * FROM trabajador JOIN (SELECT * FROM laborvstrabajador WHERE nombre_labor=$1) AS L ON id_trabajador = trabajador_id WHERE trabajador_disponibilidad=true ORDER BY trabajador_puntaje DESC', [nombre_labor])).rows;
    res.render('usuario/trabajadores', {nombre_labor: nombre_labor, servicio_descipcion: servicio_descipcion, userUbication: userUbication[0], trabajadores});
});

// MIS SERVIVICIOS
router.get('/mis-servicios', async (req, res) => {
    const num_usuario = req.user.numero_usuario;
    const servicios = await (await pool.query('SELECT * FROM servicio WHERE usuario_numero = $1', [num_usuario])).rows;
    res.render('usuario/misServicios', {servicios});
});

// CONTRATAR TRABAJADOR
router.get('/contratar-trabajador/:trabajador_id/:trabajador_nombre/:nombre_labor', async (req, res) => {
    const {trabajador_id, nombre_labor, trabajador_nombre}=req.params;
    const servicio_descipcion ='en proceso equis de';
    const usuario_numero = req.user.numero_usuario;
    await pool.query('INSERT INTO servicio (nombre_labor, servicio_descipcion, usuario_numero, trabajador_id, trabajador_nombre) VALUES ($1, $2, $3, $4, $5)', [nombre_labor, servicio_descipcion, usuario_numero, trabajador_id, trabajador_nombre]);
    const trabajitos = await (await pool.query('SELECT trabajador_trabajosHechos FROM trabajador WHERE id_trabajador=$1', [trabajador_id])).rows;
    const trabajotes = parseInt(trabajitos[0].trabajador_trabajoshechos)+1;
    await pool.query('UPDATE trabajador SET trabajador_disponibilidad=false, trabajador_trabajosHechos=$1 WHERE id_trabajador=$2', [trabajotes, trabajador_id]);
    res.redirect('/usuario/mis-servicios');
});

// PERFIL 
router.get('/perfil', (req, res) => {
    console.log(req.user.numero_usuario);
    res.send('profile');
});

module.exports = router;