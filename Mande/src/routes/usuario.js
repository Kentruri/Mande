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
        successRedirect: '/usuario/perfil',
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

// MIS SERVIVICIOS
router.get('/mis-servicios', async (req, res) => {
    const labores = await (await pool.query('SELECT * FROM labor')).rows;
    res.render('usuario/solicitarServicios', {labores});
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