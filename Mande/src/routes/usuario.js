const express = require('express');
const router = express.Router();
const passport = require('passport');
const pool = require('../database');

// REGISTER 
router.get('/registro', (req, res) => {
    res.render('usuario/registro');
});

router.post('/registro', passport.authenticate('usuario.signup',
    {
        successRedirect: '/usuario/perfil',
        failureRedirect: '/usuario/registro',
        failureFlash: true
    }));


// SIGN-IN
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


// PROFILE 
router.get('/perfil', (req, res) => {
    console.log(req.user.numero_usuario);
    res.send('profile');
});

module.exports = router;