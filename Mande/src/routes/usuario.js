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
router.get('/solicitar-servicio', async (req, res) => {
    const labores = await (await pool.query('SELECT * FROM labor')).rows;
    res.render('usuario/tipoServicio', { labores });
});

router.post('/solicitar-servicio', async (req, res) => {
    const { nombre_labor } = req.body;
    const trabajadores = await (await pool.query('SELECT id_trabajador, trabajador_nombre, trabajador_foto, trabajador_latitud, trabajador_longitud, trabajador_calificaciones, trabajador_trabajosHechos FROM trabajador RIGHT JOIN (SELECT trabajador_id FROM laborvstrabajador WHERE nombre_labor=$1) AS laboresOf ON id_trabajador = trabajador_id', [nombre_labor])).rows;
    res.render('usuario/trabajadores', {trabajadores});
})

// MIS SERVIVICIOS
router.get('/mis-servicios', async (req, res) => {
    const num_usuario = req.user.numero_usuario;
    const servicios = await (await pool.query('SELECT * FROM servicio WHERE usuario_numero = $1', [num_usuario])).rows;
    res.render('usuario/misServicios', {servicios});
});

// SOLICITUD DE SERVICIOS
router.get('/solicitar-servicio', (req, res) => {
    res.render('usuario/solicitarServicios');
});

// PERFIL 
router.get('/perfil', (req, res) => {
    console.log(req.user.numero_usuario);
    res.send('profile');
});

module.exports = router;